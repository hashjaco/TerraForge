use serde::{Deserialize, Serialize};
use crate::engine::intersection::*;
use crate::engine::{ObjectType, Point2};
use super::project;

#[derive(Debug, Serialize)]
pub struct IntersectionResponse {
    pub id: String,
    pub name: String,
    pub intersection_type: String,
    pub center: [f64; 2],
    pub vertices: Vec<f64>,
    pub indices: Vec<u32>,
    pub curb_return_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct CreateIntersectionInput {
    pub name: String,
    pub center: [f64; 2],
    pub intersection_type: String,
    pub alignment_ids: Vec<String>,
    pub curb_return_radius: Option<f64>,
    pub roundabout_diameter: Option<f64>,
    pub circulatory_width: Option<f64>,
}

#[tauri::command]
pub fn create_intersection(input: CreateIntersectionInput) -> Result<IntersectionResponse, String> {
    let center = Point2::new(input.center[0], input.center[1]);
    let alignment_ids: Vec<uuid::Uuid> = input
        .alignment_ids
        .iter()
        .map(|id| uuid::Uuid::parse_str(id))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    let mut intersection = match input.intersection_type.as_str() {
        "three-way" | "t" => Intersection::new_three_way(input.name, center, alignment_ids),
        "four-way" | "cross" => Intersection::new_four_way(input.name, center, alignment_ids),
        "roundabout" => {
            let params = RoundaboutParams {
                inscribed_diameter: input.roundabout_diameter.unwrap_or(40.0),
                circulatory_width: input.circulatory_width.unwrap_or(6.0),
                apron_width: 2.0,
                entry_width: 4.0,
                exit_width: 4.5,
                num_segments: 32,
            };
            Intersection::new_roundabout(input.name, center, alignment_ids, params)
        }
        _ => return Err("Invalid type. Use: three-way, four-way, or roundabout".into()),
    };

    if let Some(radius) = input.curb_return_radius {
        let corners = match intersection.intersection_type {
            IntersectionType::ThreeWay => 3,
            IntersectionType::FourWay => 4,
            IntersectionType::Roundabout => 0,
        };
        for i in 0..corners {
            intersection.add_curb_return(radius, i);
        }
    }

    let response = intersection_to_response(&intersection);
    let id = intersection.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Intersection, intersection.name.clone());
    }
    project().intersections.write().insert(id, intersection);
    Ok(response)
}

#[tauri::command]
pub fn get_intersection_data(id: String) -> Result<IntersectionResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let intersections = project().intersections.read();
    let intersection = intersections.get(&uuid).ok_or("Intersection not found")?;
    Ok(intersection_to_response(intersection))
}

fn intersection_to_response(intersection: &Intersection) -> IntersectionResponse {
    IntersectionResponse {
        id: intersection.id.to_string(),
        name: intersection.name.clone(),
        intersection_type: format!("{:?}", intersection.intersection_type),
        center: [intersection.center.x, intersection.center.y],
        vertices: intersection.flatten_points(),
        indices: intersection.flatten_triangles(),
        curb_return_count: intersection.curb_returns.len(),
    }
}
