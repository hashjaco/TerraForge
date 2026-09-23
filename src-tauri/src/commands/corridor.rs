use serde::{Deserialize, Serialize};

use crate::engine::corridor::extruder;
use crate::engine::corridor::template::Template;
use crate::engine::corridor::{Corridor, TemplateSide, TemplateAssignment};
use crate::engine::ObjectType;

use super::project;

#[derive(Debug, Serialize)]
pub struct CorridorResponse {
    pub id: String,
    pub name: String,
    pub alignment_id: String,
    pub profile_id: String,
    pub vertex_count: usize,
    pub triangle_count: usize,
    pub vertices: Vec<f64>,
    pub indices: Vec<u32>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCorridorInput {
    pub name: String,
    pub alignment_id: String,
    pub profile_id: String,
    pub frequency: Option<f64>,
}

#[tauri::command]
pub fn create_corridor(input: CreateCorridorInput) -> Result<CorridorResponse, String> {
    let align_uuid = uuid::Uuid::parse_str(&input.alignment_id).map_err(|e| e.to_string())?;
    let profile_uuid = uuid::Uuid::parse_str(&input.profile_id).map_err(|e| e.to_string())?;

    let frequency = input.frequency.unwrap_or(10.0);
    let mut corridor = Corridor::new(input.name, align_uuid, profile_uuid, frequency);

    corridor.template_assignments.push(TemplateAssignment {
        station: 0.0,
        template: Template::basic_road(),
        side: TemplateSide::Both,
    });

    {
        let alignments = project().alignments.read();
        let profiles = project().profiles.read();

        let alignment = alignments.get(&align_uuid).ok_or("Alignment not found")?;
        let profile = profiles.get(&profile_uuid).ok_or("Profile not found")?;

        extruder::build_corridor_mesh(&mut corridor, alignment, profile);
    }

    let response = CorridorResponse {
        id: corridor.id.to_string(),
        name: corridor.name.clone(),
        alignment_id: input.alignment_id,
        profile_id: input.profile_id,
        vertex_count: corridor.mesh_vertices.len(),
        triangle_count: corridor.mesh_indices.len(),
        vertices: corridor.flatten_vertices(),
        indices: corridor.flatten_indices(),
    };

    let id = corridor.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Corridor, corridor.name.clone());
        let _ = graph.add_edge(id, align_uuid);
        let _ = graph.add_edge(id, profile_uuid);
    }
    project().corridors.write().insert(id, corridor);

    Ok(response)
}

#[tauri::command]
pub fn get_corridor_data(id: String) -> Result<CorridorResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let corridors = project().corridors.read();
    let corridor = corridors.get(&uuid).ok_or("Corridor not found")?;

    Ok(CorridorResponse {
        id: corridor.id.to_string(),
        name: corridor.name.clone(),
        alignment_id: corridor.alignment_id.to_string(),
        profile_id: corridor.profile_id.to_string(),
        vertex_count: corridor.mesh_vertices.len(),
        triangle_count: corridor.mesh_indices.len(),
        vertices: corridor.flatten_vertices(),
        indices: corridor.flatten_indices(),
    })
}

#[tauri::command]
pub fn update_corridor(id: String, frequency: Option<f64>) -> Result<CorridorResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let mut corridors = project().corridors.write();
    let corridor = corridors.get_mut(&uuid).ok_or("Corridor not found")?;

    if let Some(freq) = frequency {
        corridor.frequency = freq;
    }

    let align_id = corridor.alignment_id;
    let prof_id = corridor.profile_id;

    {
        let alignments = project().alignments.read();
        let profiles = project().profiles.read();

        if let (Some(alignment), Some(profile)) =
            (alignments.get(&align_id), profiles.get(&prof_id))
        {
            extruder::build_corridor_mesh(corridor, alignment, profile);
        }
    }

    Ok(CorridorResponse {
        id: corridor.id.to_string(),
        name: corridor.name.clone(),
        alignment_id: corridor.alignment_id.to_string(),
        profile_id: corridor.profile_id.to_string(),
        vertex_count: corridor.mesh_vertices.len(),
        triangle_count: corridor.mesh_indices.len(),
        vertices: corridor.flatten_vertices(),
        indices: corridor.flatten_indices(),
    })
}

#[tauri::command]
pub fn rebuild_corridor(id: String) -> Result<CorridorResponse, String> {
    update_corridor(id, None)
}
