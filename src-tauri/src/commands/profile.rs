use serde::{Deserialize, Serialize};

use crate::engine::alignment::horizontal;
use crate::engine::profile::{Profile, PVI};
use crate::engine::ObjectType;

use super::project;

#[derive(Debug, Serialize)]
pub struct ProfileResponse {
    pub id: String,
    pub name: String,
    pub alignment_id: String,
    pub pvi_count: usize,
    pub sampled_points: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct PVIInput {
    pub station: f64,
    pub elevation: f64,
    pub curve_length: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreateProfileInput {
    pub name: String,
    pub alignment_id: String,
    pub pvis: Vec<PVIInput>,
}

#[tauri::command]
pub fn create_profile(input: CreateProfileInput) -> Result<ProfileResponse, String> {
    let align_uuid = uuid::Uuid::parse_str(&input.alignment_id).map_err(|e| e.to_string())?;

    let total_length = {
        let alignments = project().alignments.read();
        let alignment = alignments.get(&align_uuid).ok_or("Alignment not found")?;
        alignment.total_length()
    };

    let pvis: Vec<PVI> = input
        .pvis
        .iter()
        .map(|p| PVI {
            station: p.station,
            elevation: p.elevation,
            curve_length: p.curve_length,
        })
        .collect();

    let profile = Profile::new(input.name, align_uuid, pvis);
    let sampled = profile.flatten_sampled(0.0, total_length, 1.0);

    let response = ProfileResponse {
        id: profile.id.to_string(),
        name: profile.name.clone(),
        alignment_id: input.alignment_id,
        pvi_count: profile.pvis.len(),
        sampled_points: sampled,
    };

    let id = profile.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Profile, profile.name.clone());
        let _ = graph.add_edge(id, align_uuid);
    }
    project().profiles.write().insert(id, profile);

    Ok(response)
}

#[tauri::command]
pub fn get_profile_data(id: String) -> Result<ProfileResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let profiles = project().profiles.read();
    let profile = profiles.get(&uuid).ok_or("Profile not found")?;

    let total_length = {
        let alignments = project().alignments.read();
        alignments
            .get(&profile.alignment_id)
            .map(|a| a.total_length())
            .unwrap_or(100.0)
    };

    let sampled = profile.flatten_sampled(0.0, total_length, 1.0);

    Ok(ProfileResponse {
        id: profile.id.to_string(),
        name: profile.name.clone(),
        alignment_id: profile.alignment_id.to_string(),
        pvi_count: profile.pvis.len(),
        sampled_points: sampled,
    })
}

#[tauri::command]
pub fn update_profile(id: String, pvis: Vec<PVIInput>) -> Result<ProfileResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let mut profiles = project().profiles.write();
    let profile = profiles.get_mut(&uuid).ok_or("Profile not found")?;

    profile.pvis = pvis
        .iter()
        .map(|p| PVI {
            station: p.station,
            elevation: p.elevation,
            curve_length: p.curve_length,
        })
        .collect();

    let total_length = {
        let alignments = project().alignments.read();
        alignments
            .get(&profile.alignment_id)
            .map(|a| a.total_length())
            .unwrap_or(100.0)
    };

    let sampled = profile.flatten_sampled(0.0, total_length, 1.0);

    Ok(ProfileResponse {
        id: profile.id.to_string(),
        name: profile.name.clone(),
        alignment_id: profile.alignment_id.to_string(),
        pvi_count: profile.pvis.len(),
        sampled_points: sampled,
    })
}

/// Sample existing ground elevation along an alignment by querying a TIN surface.
/// Returns station/elevation pairs as a flat array [s0, e0, s1, e1, ...].
#[tauri::command]
pub fn sample_existing_ground(
    surface_id: String,
    alignment_id: String,
    interval: f64,
) -> Result<Vec<f64>, String> {
    let surf_uuid = uuid::Uuid::parse_str(&surface_id).map_err(|e| e.to_string())?;
    let align_uuid = uuid::Uuid::parse_str(&alignment_id).map_err(|e| e.to_string())?;

    let surfaces = project().surfaces.read();
    let alignments = project().alignments.read();

    let surface = surfaces.get(&surf_uuid).ok_or("Surface not found")?;
    let alignment = alignments.get(&align_uuid).ok_or("Alignment not found")?;

    let total_length = alignment.total_length();
    let mut result = Vec::new();
    let mut station = 0.0;

    while station <= total_length {
        // Find the XY position at this station along the alignment
        let mut cumulative = 0.0;
        let mut found = false;

        for segment in &alignment.segments {
            let seg_len = horizontal::segment_length(segment);
            if cumulative + seg_len >= station {
                let local_dist = station - cumulative;
                if let Some(pt) = horizontal::point_at_distance(segment, local_dist) {
                    // Query the surface for elevation at this XY position
                    if let Some(z) = surface.elevation_at(pt.x, pt.y) {
                        result.push(station);
                        result.push(z);
                    }
                }
                found = true;
                break;
            }
            cumulative += seg_len;
        }

        if !found {
            // Past the end of alignment -- try last point
            if let Some(last_seg) = alignment.segments.last() {
                let seg_len = horizontal::segment_length(last_seg);
                if let Some(pt) = horizontal::point_at_distance(last_seg, seg_len) {
                    if let Some(z) = surface.elevation_at(pt.x, pt.y) {
                        result.push(station);
                        result.push(z);
                    }
                }
            }
        }

        station += interval;
    }

    Ok(result)
}
