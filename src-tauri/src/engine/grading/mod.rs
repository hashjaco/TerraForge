pub mod feature_line;
pub mod grading_group;

use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::Point3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FeatureLine {
    pub id: Uuid,
    pub name: String,
    pub vertices: Vec<Point3>,
    pub is_closed: bool,
    pub source: FeatureLineSource,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FeatureLineSource {
    Manual,
    ExtractedFromCorridor(Uuid),
    ExtractedFromSurface(Uuid),
    ExtractedFromChannel(Uuid),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradingCriteria {
    pub target: GradingTarget,
    pub cut_slope: f64,
    pub fill_slope: f64,
    pub ditch_width: Option<f64>,
    pub ditch_depth: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum GradingTarget {
    Surface(Uuid),
    Elevation(f64),
    RelativeElevation(f64),
    Distance(f64),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradingObject {
    pub id: Uuid,
    pub name: String,
    pub feature_line_id: Uuid,
    pub criteria: GradingCriteria,
    pub projected_points: Vec<Point3>,
    pub side: GradingSide,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum GradingSide {
    Left,
    Right,
    Both,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GradingGroup {
    pub id: Uuid,
    pub name: String,
    pub gradings: Vec<Uuid>,
    pub auto_surface: bool,
    pub surface_id: Option<Uuid>,
}

impl FeatureLine {
    pub fn new(name: String, vertices: Vec<Point3>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            is_closed: false,
            vertices,
            source: FeatureLineSource::Manual,
        }
    }

    pub fn total_length(&self) -> f64 {
        self.vertices
            .windows(2)
            .map(|w| w[0].distance_to(&w[1]))
            .sum()
    }

    pub fn total_2d_length(&self) -> f64 {
        self.vertices
            .windows(2)
            .map(|w| {
                let dx = w[1].x - w[0].x;
                let dy = w[1].y - w[0].y;
                (dx * dx + dy * dy).sqrt()
            })
            .sum()
    }

    pub fn elevation_at_station(&self, station: f64) -> Option<f64> {
        let mut cumulative = 0.0;
        for window in self.vertices.windows(2) {
            let seg_len = window[0].distance_to(&window[1]);
            if cumulative + seg_len >= station {
                let t = (station - cumulative) / seg_len;
                return Some(window[0].z + t * (window[1].z - window[0].z));
            }
            cumulative += seg_len;
        }
        self.vertices.last().map(|v| v.z)
    }
}

impl GradingObject {
    pub fn new(
        name: String,
        feature_line_id: Uuid,
        criteria: GradingCriteria,
        side: GradingSide,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            feature_line_id,
            criteria,
            projected_points: Vec::new(),
            side,
        }
    }

    /// Project grading from a feature line to its target.
    pub fn compute_projection(
        &mut self,
        feature_line: &FeatureLine,
        target_surface: Option<&crate::engine::surface::Surface>,
    ) {
        self.projected_points.clear();

        for (i, vertex) in feature_line.vertices.iter().enumerate() {
            let target_z = match &self.criteria.target {
                GradingTarget::Elevation(z) => *z,
                GradingTarget::RelativeElevation(dz) => vertex.z + dz,
                GradingTarget::Distance(d) => {
                    vertex.z - d * self.criteria.cut_slope
                }
                GradingTarget::Surface(_sid) => {
                    if let Some(surf) = target_surface {
                        surf.elevation_at(vertex.x, vertex.y).unwrap_or(vertex.z)
                    } else {
                        vertex.z
                    }
                }
            };

            let dz = target_z - vertex.z;
            let slope = if dz >= 0.0 {
                self.criteria.fill_slope
            } else {
                self.criteria.cut_slope
            };

            let horizontal_dist = if slope.abs() > 1e-12 {
                (dz / slope).abs()
            } else {
                0.0
            };

            // Project perpendicular to the feature line direction
            let dir = if i + 1 < feature_line.vertices.len() {
                let next = &feature_line.vertices[i + 1];
                let dx = next.x - vertex.x;
                let dy = next.y - vertex.y;
                let len = (dx * dx + dy * dy).sqrt();
                if len > 1e-12 { (dx / len, dy / len) } else { (1.0, 0.0) }
            } else if i > 0 {
                let prev = &feature_line.vertices[i - 1];
                let dx = vertex.x - prev.x;
                let dy = vertex.y - prev.y;
                let len = (dx * dx + dy * dy).sqrt();
                if len > 1e-12 { (dx / len, dy / len) } else { (1.0, 0.0) }
            } else {
                (1.0, 0.0)
            };

            // Perpendicular direction
            let (perp_x, perp_y) = (-dir.1, dir.0);

            match self.side {
                GradingSide::Right | GradingSide::Both => {
                    self.projected_points.push(Point3::new(
                        vertex.x + perp_x * horizontal_dist,
                        vertex.y + perp_y * horizontal_dist,
                        target_z,
                    ));
                }
                GradingSide::Left => {
                    self.projected_points.push(Point3::new(
                        vertex.x - perp_x * horizontal_dist,
                        vertex.y - perp_y * horizontal_dist,
                        target_z,
                    ));
                }
            }
        }
    }
}

impl GradingGroup {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            gradings: Vec::new(),
            auto_surface: false,
            surface_id: None,
        }
    }
}
