use serde::{Deserialize, Serialize};

use crate::engine::pipe_network::{NodeType, PipeNetwork, SystemType};
use crate::engine::pipe_network::hydraulics;
use crate::engine::{ObjectType, Point3};

use super::project;

#[derive(Debug, Serialize)]
pub struct PipeNetworkResponse {
    pub id: String,
    pub name: String,
    pub system_type: String,
    pub node_count: usize,
    pub pipe_count: usize,
    pub nodes: Vec<PipeNodeResponse>,
    pub pipes: Vec<PipeSegmentResponse>,
}

#[derive(Debug, Serialize)]
pub struct PipeNodeResponse {
    pub id: String,
    pub position: [f64; 3],
    pub node_type: String,
    pub rim_elevation: f64,
    pub invert_elevation: f64,
}

#[derive(Debug, Serialize)]
pub struct PipeSegmentResponse {
    pub id: String,
    pub start_node_id: String,
    pub end_node_id: String,
    pub diameter: f64,
    pub material: String,
    pub length: f64,
    pub slope: f64,
}

#[derive(Debug, Deserialize)]
pub struct CreatePipeNetworkInput {
    pub name: String,
    pub system_type: String,
}

#[derive(Debug, Deserialize)]
pub struct AddNodeInput {
    pub network_id: String,
    pub position: [f64; 3],
    pub node_type: String,
    pub rim_elevation: f64,
    pub invert_elevation: f64,
}

#[derive(Debug, Deserialize)]
pub struct AddPipeInput {
    pub network_id: String,
    pub start_node_id: String,
    pub end_node_id: String,
    pub diameter: f64,
    pub material: String,
}

fn parse_system_type(s: &str) -> Result<SystemType, String> {
    match s.to_lowercase().as_str() {
        "storm" => Ok(SystemType::Storm),
        "sanitary" => Ok(SystemType::Sanitary),
        "water" => Ok(SystemType::Water),
        _ => Err(format!("Unknown system type: {}", s)),
    }
}

fn parse_node_type(s: &str) -> Result<NodeType, String> {
    match s.to_lowercase().as_str() {
        "manhole" => Ok(NodeType::Manhole),
        "inlet" => Ok(NodeType::Inlet),
        "outlet" => Ok(NodeType::Outlet),
        "junction" => Ok(NodeType::Junction),
        _ => Err(format!("Unknown node type: {}", s)),
    }
}

fn network_to_response(network: &PipeNetwork) -> PipeNetworkResponse {
    PipeNetworkResponse {
        id: network.id.to_string(),
        name: network.name.clone(),
        system_type: format!("{:?}", network.system_type),
        node_count: network.nodes.len(),
        pipe_count: network.pipes.len(),
        nodes: network
            .nodes
            .iter()
            .map(|n| PipeNodeResponse {
                id: n.id.to_string(),
                position: [n.position.x, n.position.y, n.position.z],
                node_type: format!("{:?}", n.node_type),
                rim_elevation: n.rim_elevation,
                invert_elevation: n.invert_elevation,
            })
            .collect(),
        pipes: network
            .pipes
            .iter()
            .map(|p| PipeSegmentResponse {
                id: p.id.to_string(),
                start_node_id: p.start_node_id.to_string(),
                end_node_id: p.end_node_id.to_string(),
                diameter: p.diameter,
                material: p.material.clone(),
                length: p.length,
                slope: p.slope,
            })
            .collect(),
    }
}

#[tauri::command]
pub fn create_pipe_network(input: CreatePipeNetworkInput) -> Result<PipeNetworkResponse, String> {
    let system_type = parse_system_type(&input.system_type)?;
    let network = PipeNetwork::new(input.name, system_type);

    let response = network_to_response(&network);

    let id = network.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::PipeNetwork, network.name.clone());
    }
    project().pipe_networks.write().insert(id, network);

    Ok(response)
}

#[tauri::command]
pub fn get_pipe_network_data(id: String) -> Result<PipeNetworkResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let networks = project().pipe_networks.read();
    let network = networks.get(&uuid).ok_or("Pipe network not found")?;
    Ok(network_to_response(network))
}

#[tauri::command]
pub fn add_pipe_node(input: AddNodeInput) -> Result<PipeNetworkResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.network_id).map_err(|e| e.to_string())?;
    let node_type = parse_node_type(&input.node_type)?;
    let pos = Point3::new(input.position[0], input.position[1], input.position[2]);

    let mut networks = project().pipe_networks.write();
    let network = networks.get_mut(&uuid).ok_or("Pipe network not found")?;
    network.add_node(pos, node_type, input.rim_elevation, input.invert_elevation);

    Ok(network_to_response(network))
}

#[tauri::command]
pub fn add_pipe_segment(input: AddPipeInput) -> Result<PipeNetworkResponse, String> {
    let net_uuid = uuid::Uuid::parse_str(&input.network_id).map_err(|e| e.to_string())?;
    let start_uuid = uuid::Uuid::parse_str(&input.start_node_id).map_err(|e| e.to_string())?;
    let end_uuid = uuid::Uuid::parse_str(&input.end_node_id).map_err(|e| e.to_string())?;

    let mut networks = project().pipe_networks.write();
    let network = networks.get_mut(&net_uuid).ok_or("Pipe network not found")?;
    network
        .add_pipe(start_uuid, end_uuid, input.diameter, input.material)
        .ok_or("Failed to add pipe (check node IDs)")?;

    Ok(network_to_response(network))
}

#[derive(Debug, Serialize)]
pub struct NetworkAnalysisResponse {
    pub pipe_hydraulics: Vec<hydraulics::PipeHydraulics>,
    pub component_count: usize,
}

#[tauri::command]
pub fn analyze_network(id: String) -> Result<NetworkAnalysisResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let networks = project().pipe_networks.read();
    let network = networks.get(&uuid).ok_or("Pipe network not found")?;

    let mannings_n = 0.013; // concrete pipe
    let design_flow = 0.1; // m³/s placeholder

    let pipe_results: Vec<_> = network
        .pipes
        .iter()
        .map(|p| hydraulics::analyze_pipe(p, mannings_n, design_flow))
        .collect();

    let components = crate::engine::pipe_network::graph::find_connected_components(network);

    Ok(NetworkAnalysisResponse {
        pipe_hydraulics: pipe_results,
        component_count: components.len(),
    })
}
