use serde::{Deserialize, Serialize};
use crate::engine::grading::*;
use crate::engine::{ObjectType, Point3};
use super::project;

#[derive(Debug, Serialize)]
pub struct FeatureLineResponse {
    pub id: String,
    pub name: String,
    pub vertex_count: usize,
    pub total_length: f64,
    pub vertices: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFeatureLineInput {
    pub name: String,
    pub vertices: Vec<[f64; 3]>,
}

#[tauri::command]
pub fn create_feature_line(input: CreateFeatureLineInput) -> Result<FeatureLineResponse, String> {
    let vertices: Vec<Point3> = input.vertices.iter().map(|v| Point3::new(v[0], v[1], v[2])).collect();
    let fl = FeatureLine::new(input.name, vertices);
    let response = FeatureLineResponse {
        id: fl.id.to_string(),
        name: fl.name.clone(),
        vertex_count: fl.vertices.len(),
        total_length: fl.total_length(),
        vertices: fl.vertices.iter().flat_map(|v| vec![v.x, v.y, v.z]).collect(),
    };
    let id = fl.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::FeatureLine, fl.name.clone());
    }
    project().feature_lines.write().insert(id, fl);
    Ok(response)
}

#[tauri::command]
pub fn get_feature_line_data(id: String) -> Result<FeatureLineResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let fls = project().feature_lines.read();
    let fl = fls.get(&uuid).ok_or("Feature line not found")?;
    Ok(FeatureLineResponse {
        id: fl.id.to_string(),
        name: fl.name.clone(),
        vertex_count: fl.vertices.len(),
        total_length: fl.total_length(),
        vertices: fl.vertices.iter().flat_map(|v| vec![v.x, v.y, v.z]).collect(),
    })
}

#[derive(Debug, Deserialize)]
pub struct ExtractFeatureLineInput {
    pub name: String,
    pub surface_id: String,
    pub path: Vec<[f64; 2]>,
}

#[tauri::command]
pub fn extract_feature_line_from_surface(input: ExtractFeatureLineInput) -> Result<FeatureLineResponse, String> {
    let surf_uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&surf_uuid).ok_or("Surface not found")?;

    let path: Vec<(f64, f64)> = input.path.iter().map(|p| (p[0], p[1])).collect();
    let fl = feature_line::extract_from_surface(input.name, surface, &path);

    let response = FeatureLineResponse {
        id: fl.id.to_string(),
        name: fl.name.clone(),
        vertex_count: fl.vertices.len(),
        total_length: fl.total_length(),
        vertices: fl.vertices.iter().flat_map(|v| vec![v.x, v.y, v.z]).collect(),
    };
    let id = fl.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::FeatureLine, fl.name.clone());
    }
    project().feature_lines.write().insert(id, fl);
    Ok(response)
}

#[derive(Debug, Serialize)]
pub struct GradingObjectResponse {
    pub id: String,
    pub name: String,
    pub feature_line_id: String,
    pub projected_points: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGradingInput {
    pub name: String,
    pub feature_line_id: String,
    pub target_type: String,
    pub target_value: f64,
    pub cut_slope: f64,
    pub fill_slope: f64,
    pub side: String,
    pub target_surface_id: Option<String>,
}

#[tauri::command]
pub fn create_grading(input: CreateGradingInput) -> Result<GradingObjectResponse, String> {
    let fl_uuid = uuid::Uuid::parse_str(&input.feature_line_id).map_err(|e| e.to_string())?;

    let target = match input.target_type.as_str() {
        "elevation" => GradingTarget::Elevation(input.target_value),
        "relative" => GradingTarget::RelativeElevation(input.target_value),
        "distance" => GradingTarget::Distance(input.target_value),
        "surface" => {
            let sid = input.target_surface_id.ok_or("target_surface_id required for surface target")?;
            let s_uuid = uuid::Uuid::parse_str(&sid).map_err(|e| e.to_string())?;
            GradingTarget::Surface(s_uuid)
        }
        _ => return Err("Invalid target_type. Use: elevation, relative, distance, or surface".into()),
    };

    let side = match input.side.as_str() {
        "left" => GradingSide::Left,
        "right" => GradingSide::Right,
        "both" => GradingSide::Both,
        _ => GradingSide::Both,
    };

    let criteria = GradingCriteria {
        target,
        cut_slope: input.cut_slope,
        fill_slope: input.fill_slope,
        ditch_width: None,
        ditch_depth: None,
    };

    let mut grading = GradingObject::new(input.name, fl_uuid, criteria, side);

    // Compute projection
    {
        let fls = project().feature_lines.read();
        let fl = fls.get(&fl_uuid).ok_or("Feature line not found")?;

        let target_surface = if let GradingTarget::Surface(sid) = &grading.criteria.target {
            let surfaces = project().surfaces.read();
            surfaces.get(sid).cloned()
        } else {
            None
        };

        grading.compute_projection(fl, target_surface.as_ref());
    }

    let response = GradingObjectResponse {
        id: grading.id.to_string(),
        name: grading.name.clone(),
        feature_line_id: grading.feature_line_id.to_string(),
        projected_points: grading.projected_points.iter().flat_map(|p| vec![p.x, p.y, p.z]).collect(),
    };

    project().grading_objects.write().insert(grading.id, grading);
    Ok(response)
}
