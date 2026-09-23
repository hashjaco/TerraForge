use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::Point3;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PressureNetwork {
    pub id: Uuid,
    pub name: String,
    pub pipes: Vec<PressurePipe>,
    pub fittings: Vec<Fitting>,
    pub appurtenances: Vec<Appurtenance>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PressurePipe {
    pub id: Uuid,
    pub start: Point3,
    pub end: Point3,
    pub diameter: f64,
    pub material: PipeMaterial,
    pub pressure_class: f64,
    pub length: f64,
    pub deflection_angle: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PipeMaterial {
    DuctileIron,
    Pvc,
    Hdpe,
    Steel,
    CopperTubing,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Fitting {
    pub id: Uuid,
    pub position: Point3,
    pub fitting_type: FittingType,
    pub diameter: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FittingType {
    Elbow45,
    Elbow90,
    Tee,
    Cross,
    Reducer,
    Cap,
    Valve,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Appurtenance {
    pub id: Uuid,
    pub position: Point3,
    pub app_type: AppurtenanceType,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum AppurtenanceType {
    FireHydrant,
    GateValve,
    AirRelease,
    BlowOff,
    PressureReducing,
    Meter,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PressureAnalysis {
    pub pipe_id: Uuid,
    pub flow_rate: f64,
    pub velocity: f64,
    pub head_loss: f64,
    pub pressure_start: f64,
    pub pressure_end: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DesignCheck {
    pub pipe_id: Uuid,
    pub check_type: DesignCheckType,
    pub passed: bool,
    pub message: String,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum DesignCheckType {
    MinimumCover,
    MaxDeflection,
    MinVelocity,
    MaxVelocity,
    PressureLoss,
}

impl PressureNetwork {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            pipes: Vec::new(),
            fittings: Vec::new(),
            appurtenances: Vec::new(),
        }
    }

    pub fn add_pipe(&mut self, start: Point3, end: Point3, diameter: f64, material: PipeMaterial) -> Uuid {
        let dx = end.x - start.x;
        let dy = end.y - start.y;
        let dz = end.z - start.z;
        let length = (dx * dx + dy * dy + dz * dz).sqrt();

        let id = Uuid::new_v4();
        self.pipes.push(PressurePipe {
            id,
            start,
            end,
            diameter,
            material,
            pressure_class: 150.0,
            length,
            deflection_angle: 0.0,
        });
        id
    }

    pub fn add_fitting(&mut self, position: Point3, fitting_type: FittingType, diameter: f64) -> Uuid {
        let id = Uuid::new_v4();
        self.fittings.push(Fitting {
            id,
            position,
            fitting_type,
            diameter,
        });
        id
    }

    pub fn add_appurtenance(&mut self, position: Point3, app_type: AppurtenanceType) -> Uuid {
        let id = Uuid::new_v4();
        self.appurtenances.push(Appurtenance {
            id,
            position,
            app_type,
        });
        id
    }

    /// Hazen-Williams head loss: h_f = (10.67 * Q^1.852 * L) / (C^1.852 * D^4.87)
    pub fn analyze_pipe(&self, pipe: &PressurePipe, flow_rate: f64) -> PressureAnalysis {
        let c_factor: f64 = match pipe.material {
            PipeMaterial::DuctileIron => 130.0,
            PipeMaterial::Pvc => 150.0,
            PipeMaterial::Hdpe => 140.0,
            PipeMaterial::Steel => 120.0,
            PipeMaterial::CopperTubing => 135.0,
        };

        let d_m = pipe.diameter;
        let area = std::f64::consts::PI * (d_m / 2.0).powi(2);
        let velocity = if area > 1e-12 { flow_rate / area } else { 0.0 };

        let head_loss = if d_m > 1e-12 && c_factor > 0.0 {
            10.67_f64 * flow_rate.powf(1.852) * pipe.length
                / (c_factor.powf(1.852) * d_m.powf(4.87))
        } else {
            0.0
        };

        PressureAnalysis {
            pipe_id: pipe.id,
            flow_rate,
            velocity,
            head_loss,
            pressure_start: 0.0,
            pressure_end: 0.0,
        }
    }

    pub fn run_design_checks(&self, ground_surface: Option<&crate::engine::surface::Surface>) -> Vec<DesignCheck> {
        let mut checks = Vec::new();
        let min_cover = 1.2; // meters
        let max_deflection = 5.0; // degrees
        let _min_velocity = 0.3; // m/s
        let _max_velocity = 3.0; // m/s

        for pipe in &self.pipes {
            // Minimum cover check
            if let Some(surface) = ground_surface {
                let mid_x = (pipe.start.x + pipe.end.x) / 2.0;
                let mid_y = (pipe.start.y + pipe.end.y) / 2.0;
                let mid_z = (pipe.start.z + pipe.end.z) / 2.0;
                if let Some(ground_z) = surface.elevation_at(mid_x, mid_y) {
                    let cover = ground_z - mid_z - pipe.diameter / 2.0;
                    checks.push(DesignCheck {
                        pipe_id: pipe.id,
                        check_type: DesignCheckType::MinimumCover,
                        passed: cover >= min_cover,
                        message: format!("Cover: {:.2}m (min: {:.2}m)", cover, min_cover),
                    });
                }
            }

            // Deflection check
            checks.push(DesignCheck {
                pipe_id: pipe.id,
                check_type: DesignCheckType::MaxDeflection,
                passed: pipe.deflection_angle.abs() <= max_deflection,
                message: format!(
                    "Deflection: {:.1}° (max: {:.1}°)",
                    pipe.deflection_angle, max_deflection
                ),
            });
        }

        checks
    }
}
