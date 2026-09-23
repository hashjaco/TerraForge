use serde::{Deserialize, Serialize};
use crate::engine::drainage::*;
use crate::engine::{ObjectType, Point2, Point3};
use super::project;

#[derive(Debug, Serialize)]
pub struct CatchmentResponse {
    pub id: String,
    pub name: String,
    pub area: f64,
    pub runoff_coefficient: f64,
    pub boundary: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateCatchmentInput {
    pub name: String,
    pub boundary: Vec<[f64; 2]>,
    pub runoff_coefficient: f64,
}

#[tauri::command]
pub fn create_catchment(input: CreateCatchmentInput) -> Result<CatchmentResponse, String> {
    let boundary: Vec<Point2> = input.boundary.iter().map(|v| Point2::new(v[0], v[1])).collect();
    let catchment = Catchment::new(input.name, boundary, input.runoff_coefficient);

    let response = catchment_to_response(&catchment);
    let id = catchment.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Catchment, catchment.name.clone());
    }
    project().catchments.write().insert(id, catchment);
    Ok(response)
}

#[derive(Debug, Serialize)]
pub struct CatchmentAnalysisResponse {
    pub peak_flow: f64,
    pub volume: f64,
    pub time_to_peak: f64,
}

#[tauri::command]
pub fn analyze_catchment(id: String, rainfall_intensity: f64) -> Result<CatchmentAnalysisResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let catchments = project().catchments.read();
    let catchment = catchments.get(&uuid).ok_or("Catchment not found")?;

    let analysis = catchment.compute_rational_flow(rainfall_intensity);
    Ok(CatchmentAnalysisResponse {
        peak_flow: analysis.peak_flow,
        volume: analysis.volume,
        time_to_peak: analysis.time_to_peak,
    })
}

#[derive(Debug, Serialize)]
pub struct ChannelResponse {
    pub id: String,
    pub name: String,
    pub capacity: f64,
    pub velocity: f64,
    pub slope: f64,
    pub centerline: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateChannelInput {
    pub name: String,
    pub centerline: Vec<[f64; 3]>,
    pub section_type: String,
    pub bottom_width: Option<f64>,
    pub side_slope: Option<f64>,
    pub depth: f64,
    pub mannings_n: Option<f64>,
}

#[tauri::command]
pub fn create_channel(input: CreateChannelInput) -> Result<ChannelResponse, String> {
    let centerline: Vec<Point3> = input.centerline.iter().map(|c| Point3::new(c[0], c[1], c[2])).collect();

    let section = match input.section_type.as_str() {
        "trapezoidal" => ChannelSection::Trapezoidal {
            bottom_width: input.bottom_width.unwrap_or(2.0),
            side_slope: input.side_slope.unwrap_or(2.0),
            depth: input.depth,
        },
        "v-ditch" => ChannelSection::VDitch {
            side_slope: input.side_slope.unwrap_or(3.0),
            depth: input.depth,
        },
        "rectangular" => ChannelSection::Rectangular {
            width: input.bottom_width.unwrap_or(1.0),
            depth: input.depth,
        },
        _ => return Err("Invalid section type. Use: trapezoidal, v-ditch, or rectangular".into()),
    };

    let mut channel = Channel::new(input.name, centerline, section);
    if let Some(n) = input.mannings_n {
        channel.mannings_n = n;
    }

    let response = ChannelResponse {
        id: channel.id.to_string(),
        name: channel.name.clone(),
        capacity: channel.compute_capacity(),
        velocity: channel.compute_velocity(),
        slope: channel.slope,
        centerline: channel.centerline.iter().flat_map(|c| vec![c.x, c.y, c.z]).collect(),
    };

    project().channels.write().insert(channel.id, channel);
    Ok(response)
}

#[derive(Debug, Serialize)]
pub struct PondResponse {
    pub id: String,
    pub name: String,
    pub pond_type: String,
    pub total_storage: f64,
    pub max_depth: f64,
    pub center: [f64; 3],
}

#[derive(Debug, Deserialize)]
pub struct CreatePondInput {
    pub name: String,
    pub center: [f64; 3],
    pub pond_type: String,
    pub stage_storage: Vec<[f64; 2]>,
    pub max_depth: f64,
}

#[tauri::command]
pub fn create_pond(input: CreatePondInput) -> Result<PondResponse, String> {
    let pond_type = match input.pond_type.as_str() {
        "detention" => PondType::Detention,
        "retention" => PondType::Retention,
        _ => return Err("Invalid pond type. Use: detention or retention".into()),
    };

    let center = Point3::new(input.center[0], input.center[1], input.center[2]);
    let mut pond = Pond::new(input.name, center, pond_type);
    pond.stage_storage = input.stage_storage.iter().map(|ss| (ss[0], ss[1])).collect();
    pond.max_depth = input.max_depth;

    let response = PondResponse {
        id: pond.id.to_string(),
        name: pond.name.clone(),
        pond_type: format!("{:?}", pond_type),
        total_storage: pond.total_storage(),
        max_depth: pond.max_depth,
        center: [pond.center.x, pond.center.y, pond.center.z],
    };

    project().ponds.write().insert(pond.id, pond);
    Ok(response)
}

#[derive(Debug, Serialize)]
pub struct UndergroundStorageResponse {
    pub id: String,
    pub name: String,
    pub volume: f64,
    pub position: [f64; 3],
}

#[derive(Debug, Deserialize)]
pub struct CreateUndergroundStorageInput {
    pub name: String,
    pub position: [f64; 3],
    pub storage_type: String,
    pub width: Option<f64>,
    pub height: Option<f64>,
    pub length: f64,
    pub diameter: Option<f64>,
    pub count: Option<u32>,
}

#[tauri::command]
pub fn create_underground_storage(input: CreateUndergroundStorageInput) -> Result<UndergroundStorageResponse, String> {
    let position = Point3::new(input.position[0], input.position[1], input.position[2]);

    let storage_type = match input.storage_type.as_str() {
        "box" => StorageType::BoxChamber {
            width: input.width.unwrap_or(2.0),
            height: input.height.unwrap_or(1.5),
            length: input.length,
        },
        "pipe-arch" => StorageType::PipeArch {
            diameter: input.diameter.unwrap_or(1.2),
            length: input.length,
            count: input.count.unwrap_or(1),
        },
        _ => return Err("Invalid storage type. Use: box or pipe-arch".into()),
    };

    let storage = UndergroundStorage::new(input.name, position, storage_type);
    let response = UndergroundStorageResponse {
        id: storage.id.to_string(),
        name: storage.name.clone(),
        volume: storage.volume,
        position: [storage.position.x, storage.position.y, storage.position.z],
    };

    project().underground_storage.write().insert(storage.id, storage);
    Ok(response)
}

fn catchment_to_response(catchment: &Catchment) -> CatchmentResponse {
    CatchmentResponse {
        id: catchment.id.to_string(),
        name: catchment.name.clone(),
        area: catchment.area,
        runoff_coefficient: catchment.runoff_coefficient,
        boundary: catchment.boundary.iter().flat_map(|v| vec![v.x, v.y]).collect(),
    }
}
