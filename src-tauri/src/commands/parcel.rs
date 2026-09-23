use serde::{Deserialize, Serialize};
use crate::engine::parcel::Parcel;
use crate::engine::{ObjectType, Point2};
use super::project;

#[derive(Debug, Serialize)]
pub struct ParcelResponse {
    pub id: String,
    pub name: String,
    pub number: String,
    pub area: f64,
    pub perimeter: f64,
    pub vertices: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateParcelInput {
    pub name: String,
    pub number: String,
    pub vertices: Vec<[f64; 2]>,
}

#[tauri::command]
pub fn create_parcel(input: CreateParcelInput) -> Result<ParcelResponse, String> {
    let vertices: Vec<Point2> = input.vertices.iter().map(|v| Point2::new(v[0], v[1])).collect();

    if vertices.len() < 3 {
        return Err("Parcel requires at least 3 vertices".into());
    }

    let parcel = Parcel::new(input.name, input.number, vertices);
    let response = parcel_to_response(&parcel);
    let id = parcel.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Parcel, parcel.name.clone());
    }
    project().parcels.write().insert(id, parcel);
    Ok(response)
}

#[tauri::command]
pub fn get_parcel_data(id: String) -> Result<ParcelResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let parcels = project().parcels.read();
    let parcel = parcels.get(&uuid).ok_or("Parcel not found")?;
    Ok(parcel_to_response(parcel))
}

#[derive(Debug, Serialize)]
pub struct SubdivisionResponse {
    pub parcels: Vec<ParcelResponse>,
}

#[derive(Debug, Deserialize)]
pub struct SubdivideInput {
    pub parcel_id: String,
    pub frontage_width: f64,
    pub edge_index: usize,
}

#[tauri::command]
pub fn subdivide_parcel(input: SubdivideInput) -> Result<SubdivisionResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.parcel_id).map_err(|e| e.to_string())?;

    let new_parcels = {
        let parcels = project().parcels.read();
        let parcel = parcels.get(&uuid).ok_or("Parcel not found")?;
        parcel.subdivide_frontage(input.frontage_width, input.edge_index)
    };

    let mut responses = Vec::new();
    for p in new_parcels {
        let resp = parcel_to_response(&p);
        let id = p.id;
        {
            let mut graph = project().graph.write();
            graph.add_node(id, ObjectType::Parcel, p.name.clone());
        }
        project().parcels.write().insert(id, p);
        responses.push(resp);
    }

    Ok(SubdivisionResponse { parcels: responses })
}

#[tauri::command]
pub fn import_geojson_parcels(content: String) -> Result<Vec<ParcelResponse>, String> {
    let polygons = crate::io::import::shapefile_import::import_geojson_polygons(&content)?;
    let mut responses = Vec::new();

    for (i, poly) in polygons.iter().enumerate() {
        let parcel = Parcel::new(
            poly.name.clone(),
            format!("{}", i + 1),
            poly.vertices.clone(),
        );
        let resp = parcel_to_response(&parcel);
        let id = parcel.id;
        {
            let mut graph = project().graph.write();
            graph.add_node(id, ObjectType::Parcel, parcel.name.clone());
        }
        project().parcels.write().insert(id, parcel);
        responses.push(resp);
    }

    Ok(responses)
}

fn parcel_to_response(parcel: &Parcel) -> ParcelResponse {
    ParcelResponse {
        id: parcel.id.to_string(),
        name: parcel.name.clone(),
        number: parcel.number.clone(),
        area: parcel.area,
        perimeter: parcel.perimeter,
        vertices: parcel.vertices.iter().flat_map(|v| vec![v.x, v.y]).collect(),
    }
}
