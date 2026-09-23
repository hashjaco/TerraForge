use serde::{Deserialize, Serialize};
use crate::engine::pressure_network::*;
use crate::engine::{ObjectType, Point3};
use super::project;

#[derive(Debug, Serialize)]
pub struct PressureNetworkResponse {
    pub id: String,
    pub name: String,
    pub pipe_count: usize,
    pub fitting_count: usize,
    pub pipes: Vec<PressurePipeResponse>,
}

#[derive(Debug, Serialize)]
pub struct PressurePipeResponse {
    pub id: String,
    pub start: [f64; 3],
    pub end: [f64; 3],
    pub diameter: f64,
    pub material: String,
    pub length: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreatePressureNetworkInput {
    pub name: String,
}

#[tauri::command]
pub fn create_pressure_network(input: CreatePressureNetworkInput) -> Result<PressureNetworkResponse, String> {
    let network = PressureNetwork::new(input.name);
    let response = network_to_response(&network);
    let id = network.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::PressureNetwork, network.name.clone());
    }
    project().pressure_networks.write().insert(id, network);
    Ok(response)
}

#[derive(Debug, Deserialize)]
pub struct AddPressurePipeInput {
    pub network_id: String,
    pub start: [f64; 3],
    pub end: [f64; 3],
    pub diameter: f64,
    pub material: String,
}

#[tauri::command]
pub fn add_pressure_pipe(input: AddPressurePipeInput) -> Result<PressureNetworkResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.network_id).map_err(|e| e.to_string())?;
    let mut networks = project().pressure_networks.write();
    let network = networks.get_mut(&uuid).ok_or("Pressure network not found")?;

    let material = match input.material.to_lowercase().as_str() {
        "ductile-iron" | "di" => PipeMaterial::DuctileIron,
        "pvc" => PipeMaterial::Pvc,
        "hdpe" => PipeMaterial::Hdpe,
        "steel" => PipeMaterial::Steel,
        "copper" => PipeMaterial::CopperTubing,
        _ => PipeMaterial::Pvc,
    };

    let start = Point3::new(input.start[0], input.start[1], input.start[2]);
    let end = Point3::new(input.end[0], input.end[1], input.end[2]);
    network.add_pipe(start, end, input.diameter, material);

    Ok(network_to_response(network))
}

#[derive(Debug, Serialize)]
pub struct PressureDesignCheckResponse {
    pub checks: Vec<DesignCheckResponse>,
}

#[derive(Debug, Serialize)]
pub struct DesignCheckResponse {
    pub pipe_id: String,
    pub check_type: String,
    pub passed: bool,
    pub message: String,
}

#[tauri::command]
pub fn check_pressure_network(network_id: String) -> Result<PressureDesignCheckResponse, String> {
    let uuid = uuid::Uuid::parse_str(&network_id).map_err(|e| e.to_string())?;
    let networks = project().pressure_networks.read();
    let network = networks.get(&uuid).ok_or("Pressure network not found")?;

    let checks = network.run_design_checks(None);
    Ok(PressureDesignCheckResponse {
        checks: checks.iter().map(|c| DesignCheckResponse {
            pipe_id: c.pipe_id.to_string(),
            check_type: format!("{:?}", c.check_type),
            passed: c.passed,
            message: c.message.clone(),
        }).collect(),
    })
}

fn network_to_response(network: &PressureNetwork) -> PressureNetworkResponse {
    PressureNetworkResponse {
        id: network.id.to_string(),
        name: network.name.clone(),
        pipe_count: network.pipes.len(),
        fitting_count: network.fittings.len(),
        pipes: network.pipes.iter().map(|p| PressurePipeResponse {
            id: p.id.to_string(),
            start: [p.start.x, p.start.y, p.start.z],
            end: [p.end.x, p.end.y, p.end.z],
            diameter: p.diameter,
            material: format!("{:?}", p.material),
            length: p.length,
        }).collect(),
    }
}
