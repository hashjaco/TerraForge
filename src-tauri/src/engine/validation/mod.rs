use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::alignment::{Alignment, AlignmentSegment};
use crate::engine::pipe_network::PipeNetwork;
use crate::engine::profile::Profile;
use crate::engine::surface::Surface;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
pub enum Severity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationIssue {
    pub id: Uuid,
    pub object_id: Uuid,
    pub severity: Severity,
    pub category: String,
    pub message: String,
    pub station: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignStandards {
    pub min_pipe_cover: f64,
    pub min_pipe_slope: f64,
    pub max_pipe_velocity: f64,
    pub min_pipe_velocity: f64,
    pub min_stopping_sight_distance: Vec<(f64, f64)>,
    pub max_superelevation: f64,
    pub min_grade: f64,
    pub max_grade: f64,
    pub min_curve_radius: Vec<(f64, f64)>,
}

impl Default for DesignStandards {
    fn default() -> Self {
        Self {
            min_pipe_cover: 1.2,
            min_pipe_slope: 0.005,
            max_pipe_velocity: 3.0,
            min_pipe_velocity: 0.6,
            min_stopping_sight_distance: vec![
                (30.0, 35.0), (40.0, 50.0), (50.0, 65.0),
                (60.0, 85.0), (80.0, 130.0), (100.0, 185.0),
            ],
            max_superelevation: 0.08,
            min_grade: 0.003,
            max_grade: 0.12,
            min_curve_radius: vec![
                (30.0, 25.0), (40.0, 45.0), (50.0, 75.0),
                (60.0, 120.0), (80.0, 230.0), (100.0, 395.0),
            ],
        }
    }
}

pub fn validate_pipe_network(
    network: &PipeNetwork,
    surface: Option<&Surface>,
    standards: &DesignStandards,
) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    for pipe in &network.pipes {
        // Minimum slope check
        if pipe.slope.abs() < standards.min_pipe_slope {
            issues.push(ValidationIssue {
                id: Uuid::new_v4(),
                object_id: pipe.id,
                severity: Severity::Error,
                category: "Pipe Slope".into(),
                message: format!(
                    "Pipe slope {:.4} is below minimum {:.4}",
                    pipe.slope.abs(),
                    standards.min_pipe_slope
                ),
                station: None,
            });
        }

        // Minimum cover check
        if let Some(surf) = surface {
            let start_node = network.find_node(pipe.start_node_id);
            let end_node = network.find_node(pipe.end_node_id);
            if let (Some(sn), Some(en)) = (start_node, end_node) {
                let mid_x = (sn.position.x + en.position.x) / 2.0;
                let mid_y = (sn.position.y + en.position.y) / 2.0;
                let mid_invert = (sn.invert_elevation + en.invert_elevation) / 2.0;

                if let Some(ground_z) = surf.elevation_at(mid_x, mid_y) {
                    let cover = ground_z - mid_invert - pipe.diameter / 2.0;
                    if cover < standards.min_pipe_cover {
                        issues.push(ValidationIssue {
                            id: Uuid::new_v4(),
                            object_id: pipe.id,
                            severity: Severity::Error,
                            category: "Minimum Cover".into(),
                            message: format!(
                                "Pipe cover {:.2}m is below minimum {:.2}m",
                                cover, standards.min_pipe_cover
                            ),
                            station: None,
                        });
                    }
                }
            }
        }
    }

    issues
}

pub fn validate_alignment(
    alignment: &Alignment,
    standards: &DesignStandards,
    design_speed: f64,
) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    let min_radius = interpolate_standard(&standards.min_curve_radius, design_speed);

    for (i, segment) in alignment.segments.iter().enumerate() {
        if let AlignmentSegment::Arc { radius, .. } = segment {
            if *radius < min_radius {
                issues.push(ValidationIssue {
                    id: Uuid::new_v4(),
                    object_id: alignment.id,
                    severity: Severity::Error,
                    category: "Curve Radius".into(),
                    message: format!(
                        "Segment {} radius {:.1}m is below minimum {:.1}m for {:.0} km/h",
                        i, radius, min_radius, design_speed
                    ),
                    station: None,
                });
            }
        }
    }

    issues
}

pub fn validate_profile(
    profile: &Profile,
    standards: &DesignStandards,
) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();

    for window in profile.pvis.windows(2) {
        let grade = if (window[1].station - window[0].station).abs() > 1e-12 {
            (window[1].elevation - window[0].elevation) / (window[1].station - window[0].station)
        } else {
            0.0
        };

        if grade.abs() < standards.min_grade {
            issues.push(ValidationIssue {
                id: Uuid::new_v4(),
                object_id: profile.id,
                severity: Severity::Warning,
                category: "Minimum Grade".into(),
                message: format!(
                    "Grade {:.3}% at sta {:.1} is below minimum {:.3}%",
                    grade * 100.0,
                    window[0].station,
                    standards.min_grade * 100.0
                ),
                station: Some(window[0].station),
            });
        }

        if grade.abs() > standards.max_grade {
            issues.push(ValidationIssue {
                id: Uuid::new_v4(),
                object_id: profile.id,
                severity: Severity::Error,
                category: "Maximum Grade".into(),
                message: format!(
                    "Grade {:.1}% at sta {:.1} exceeds maximum {:.1}%",
                    grade * 100.0,
                    window[0].station,
                    standards.max_grade * 100.0
                ),
                station: Some(window[0].station),
            });
        }
    }

    issues
}

fn interpolate_standard(table: &[(f64, f64)], speed: f64) -> f64 {
    if table.is_empty() {
        return 0.0;
    }
    if speed <= table[0].0 {
        return table[0].1;
    }
    if speed >= table.last().unwrap().0 {
        return table.last().unwrap().1;
    }
    for window in table.windows(2) {
        if speed >= window[0].0 && speed <= window[1].0 {
            let t = (speed - window[0].0) / (window[1].0 - window[0].0);
            return window[0].1 + t * (window[1].1 - window[0].1);
        }
    }
    table.last().unwrap().1
}
