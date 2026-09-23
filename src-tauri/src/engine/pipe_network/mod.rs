pub mod graph;
pub mod hydraulics;
pub mod sizing;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::engine::Point3;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum NodeType {
    Manhole,
    Inlet,
    Outlet,
    Junction,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum SystemType {
    Storm,
    Sanitary,
    Water,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipeNode {
    pub id: Uuid,
    pub position: Point3,
    pub node_type: NodeType,
    pub rim_elevation: f64,
    pub invert_elevation: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipeSegment {
    pub id: Uuid,
    pub start_node_id: Uuid,
    pub end_node_id: Uuid,
    pub diameter: f64,
    pub material: String,
    pub length: f64,
    pub slope: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipeNetwork {
    pub id: Uuid,
    pub name: String,
    pub system_type: SystemType,
    pub nodes: Vec<PipeNode>,
    pub pipes: Vec<PipeSegment>,
}

impl PipeNetwork {
    pub fn new(name: String, system_type: SystemType) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            system_type,
            nodes: Vec::new(),
            pipes: Vec::new(),
        }
    }

    pub fn add_node(&mut self, position: Point3, node_type: NodeType, rim_elev: f64, invert_elev: f64) -> Uuid {
        let id = Uuid::new_v4();
        self.nodes.push(PipeNode {
            id,
            position,
            node_type,
            rim_elevation: rim_elev,
            invert_elevation: invert_elev,
        });
        id
    }

    pub fn add_pipe(&mut self, start_id: Uuid, end_id: Uuid, diameter: f64, material: String) -> Option<Uuid> {
        let start = self.nodes.iter().find(|n| n.id == start_id)?;
        let end = self.nodes.iter().find(|n| n.id == end_id)?;

        let dx = end.position.x - start.position.x;
        let dy = end.position.y - start.position.y;
        let length = (dx * dx + dy * dy).sqrt();
        let slope = if length > 1e-12 {
            (start.invert_elevation - end.invert_elevation) / length
        } else {
            0.0
        };

        let id = Uuid::new_v4();
        self.pipes.push(PipeSegment {
            id,
            start_node_id: start_id,
            end_node_id: end_id,
            diameter,
            material,
            length,
            slope,
        });
        Some(id)
    }

    pub fn find_node(&self, id: Uuid) -> Option<&PipeNode> {
        self.nodes.iter().find(|n| n.id == id)
    }
}
