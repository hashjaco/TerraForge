use serde::{Deserialize, Serialize};

use crate::engine::alignment::{Alignment, AlignmentSegment};
use crate::engine::{ObjectType, Point2};

use super::project;

#[derive(Debug, Serialize)]
pub struct AlignmentResponse {
    pub id: String,
    pub name: String,
    pub total_length: f64,
    pub sampled_points: Vec<f64>,
    pub segment_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct SegmentInput {
    pub segment_type: String,
    pub start: Option<[f64; 2]>,
    pub end: Option<[f64; 2]>,
    pub center: Option<[f64; 2]>,
    pub radius: Option<f64>,
    pub start_angle: Option<f64>,
    pub sweep_angle: Option<f64>,
    pub start_direction: Option<f64>,
    pub start_radius: Option<f64>,
    pub end_radius: Option<f64>,
    pub length: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateAlignmentInput {
    pub name: String,
    pub segments: Vec<SegmentInput>,
}

fn parse_segment(input: &SegmentInput) -> Result<AlignmentSegment, String> {
    match input.segment_type.as_str() {
        "line" => {
            let start = input.start.ok_or("Line requires start")?;
            let end = input.end.ok_or("Line requires end")?;
            Ok(AlignmentSegment::Line {
                start: Point2::new(start[0], start[1]),
                end: Point2::new(end[0], end[1]),
            })
        }
        "arc" => {
            let center = input.center.ok_or("Arc requires center")?;
            Ok(AlignmentSegment::Arc {
                center: Point2::new(center[0], center[1]),
                radius: input.radius.ok_or("Arc requires radius")?,
                start_angle: input.start_angle.ok_or("Arc requires start_angle")?,
                sweep_angle: input.sweep_angle.ok_or("Arc requires sweep_angle")?,
            })
        }
        "spiral" => {
            let start = input.start.ok_or("Spiral requires start")?;
            Ok(AlignmentSegment::Spiral {
                start: Point2::new(start[0], start[1]),
                start_direction: input.start_direction.unwrap_or(0.0),
                start_radius: input.start_radius.ok_or("Spiral requires start_radius")?,
                end_radius: input.end_radius.ok_or("Spiral requires end_radius")?,
                length: input.length.ok_or("Spiral requires length")?,
            })
        }
        _ => Err(format!("Unknown segment type: {}", input.segment_type)),
    }
}

#[tauri::command]
pub fn create_alignment(input: CreateAlignmentInput) -> Result<AlignmentResponse, String> {
    let segments: Vec<AlignmentSegment> = input
        .segments
        .iter()
        .map(parse_segment)
        .collect::<Result<_, _>>()?;

    let alignment = Alignment::new(input.name, segments);
    let sampled = alignment.flatten_sampled_points(1.0);

    let response = AlignmentResponse {
        id: alignment.id.to_string(),
        name: alignment.name.clone(),
        total_length: alignment.total_length(),
        sampled_points: sampled,
        segment_count: alignment.segments.len(),
    };

    let id = alignment.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Alignment, alignment.name.clone());
    }
    project().alignments.write().insert(id, alignment);

    Ok(response)
}

#[tauri::command]
pub fn get_alignment_data(id: String) -> Result<AlignmentResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let alignments = project().alignments.read();
    let alignment = alignments.get(&uuid).ok_or("Alignment not found")?;
    let sampled = alignment.flatten_sampled_points(1.0);

    Ok(AlignmentResponse {
        id: alignment.id.to_string(),
        name: alignment.name.clone(),
        total_length: alignment.total_length(),
        sampled_points: sampled,
        segment_count: alignment.segments.len(),
    })
}

#[tauri::command]
pub fn update_alignment(id: String, segments: Vec<SegmentInput>) -> Result<AlignmentResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let new_segments: Vec<AlignmentSegment> = segments
        .iter()
        .map(parse_segment)
        .collect::<Result<_, _>>()?;

    let mut alignments = project().alignments.write();
    let alignment = alignments.get_mut(&uuid).ok_or("Alignment not found")?;
    alignment.segments = new_segments;

    let sampled = alignment.flatten_sampled_points(1.0);

    Ok(AlignmentResponse {
        id: alignment.id.to_string(),
        name: alignment.name.clone(),
        total_length: alignment.total_length(),
        sampled_points: sampled,
        segment_count: alignment.segments.len(),
    })
}

#[tauri::command]
pub fn sample_alignment(id: String, interval: f64) -> Result<Vec<f64>, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let alignments = project().alignments.read();
    let alignment = alignments.get(&uuid).ok_or("Alignment not found")?;
    Ok(alignment.flatten_sampled_points(interval))
}
