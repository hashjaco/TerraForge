pub mod extruder;
pub mod template;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::engine::Point3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Corridor {
    pub id: Uuid,
    pub name: String,
    pub alignment_id: Uuid,
    pub profile_id: Uuid,
    pub template_assignments: Vec<TemplateAssignment>,
    pub frequency: f64,
    pub mesh_vertices: Vec<Point3>,
    pub mesh_indices: Vec<[u32; 3]>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateAssignment {
    pub station: f64,
    pub template: template::Template,
    pub side: TemplateSide,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TemplateSide {
    Left,
    Right,
    Both,
}

impl Corridor {
    pub fn new(
        name: String,
        alignment_id: Uuid,
        profile_id: Uuid,
        frequency: f64,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            alignment_id,
            profile_id,
            template_assignments: Vec::new(),
            frequency,
            mesh_vertices: Vec::new(),
            mesh_indices: Vec::new(),
        }
    }

    pub fn flatten_vertices(&self) -> Vec<f64> {
        let mut flat = Vec::with_capacity(self.mesh_vertices.len() * 3);
        for v in &self.mesh_vertices {
            flat.push(v.x);
            flat.push(v.y);
            flat.push(v.z);
        }
        flat
    }

    pub fn flatten_indices(&self) -> Vec<u32> {
        let mut flat = Vec::with_capacity(self.mesh_indices.len() * 3);
        for tri in &self.mesh_indices {
            flat.push(tri[0]);
            flat.push(tri[1]);
            flat.push(tri[2]);
        }
        flat
    }
}
