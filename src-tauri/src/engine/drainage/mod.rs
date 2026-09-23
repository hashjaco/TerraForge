use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::{Point2, Point3};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Catchment {
    pub id: Uuid,
    pub name: String,
    pub boundary: Vec<Point2>,
    pub area: f64,
    pub runoff_coefficient: f64,
    pub time_of_concentration: f64,
    pub discharge_target: DischargeTarget,
    pub method: RunoffMethod,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DischargeTarget {
    PipeStructure(Uuid),
    Pond(Uuid),
    UndergroundStorage(Uuid),
    Outlet,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum RunoffMethod {
    Rational,
    ModifiedRational { storm_duration: f64 },
    ScsMethod { curve_number: f64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Channel {
    pub id: Uuid,
    pub name: String,
    pub centerline: Vec<Point3>,
    pub cross_section: ChannelSection,
    pub mannings_n: f64,
    pub slope: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ChannelSection {
    Trapezoidal {
        bottom_width: f64,
        side_slope: f64,
        depth: f64,
    },
    VDitch {
        side_slope: f64,
        depth: f64,
    },
    Rectangular {
        width: f64,
        depth: f64,
    },
    Irregular {
        stations: Vec<f64>,
        elevations: Vec<f64>,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pond {
    pub id: Uuid,
    pub name: String,
    pub center: Point3,
    pub pond_type: PondType,
    pub stage_storage: Vec<(f64, f64)>,
    pub inflows: Vec<Uuid>,
    pub outflows: Vec<Uuid>,
    pub outlet_elevation: f64,
    pub max_depth: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum PondType {
    Detention,
    Retention,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UndergroundStorage {
    pub id: Uuid,
    pub name: String,
    pub position: Point3,
    pub storage_type: StorageType,
    pub volume: f64,
    pub inflows: Vec<Uuid>,
    pub outflows: Vec<Uuid>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum StorageType {
    BoxChamber { width: f64, height: f64, length: f64 },
    PipeArch { diameter: f64, length: f64, count: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CatchmentAnalysis {
    pub peak_flow: f64,
    pub volume: f64,
    pub time_to_peak: f64,
}

impl Catchment {
    pub fn new(name: String, boundary: Vec<Point2>, runoff_coefficient: f64) -> Self {
        let area = compute_area(&boundary);
        Self {
            id: Uuid::new_v4(),
            name,
            boundary,
            area,
            runoff_coefficient,
            time_of_concentration: 10.0, // minutes
            discharge_target: DischargeTarget::Outlet,
            method: RunoffMethod::Rational,
        }
    }

    /// Rational Method: Q = C * i * A
    /// where Q = peak flow (m³/s), C = runoff coefficient, i = rainfall intensity (mm/hr),
    /// A = area (hectares)
    pub fn compute_rational_flow(&self, rainfall_intensity: f64) -> CatchmentAnalysis {
        let area_hectares = self.area / 10_000.0;
        let peak_flow = self.runoff_coefficient * rainfall_intensity * area_hectares / 360.0;
        let volume = peak_flow * self.time_of_concentration * 60.0;

        CatchmentAnalysis {
            peak_flow,
            volume,
            time_to_peak: self.time_of_concentration,
        }
    }

    /// Modified Rational Method for storage design
    pub fn compute_modified_rational(
        &self,
        rainfall_intensity: f64,
        storm_duration: f64,
    ) -> CatchmentAnalysis {
        let area_hectares = self.area / 10_000.0;
        let peak_flow = self.runoff_coefficient * rainfall_intensity * area_hectares / 360.0;
        let volume = peak_flow * storm_duration * 60.0;

        CatchmentAnalysis {
            peak_flow,
            volume,
            time_to_peak: self.time_of_concentration.min(storm_duration),
        }
    }
}

impl Channel {
    pub fn new(name: String, centerline: Vec<Point3>, cross_section: ChannelSection) -> Self {
        let slope = if centerline.len() >= 2 {
            let start = &centerline[0];
            let end = centerline.last().unwrap();
            let dx = end.x - start.x;
            let dy = end.y - start.y;
            let horiz = (dx * dx + dy * dy).sqrt();
            if horiz > 1e-12 {
                (start.z - end.z) / horiz
            } else {
                0.0
            }
        } else {
            0.0
        };

        Self {
            id: Uuid::new_v4(),
            name,
            centerline,
            cross_section,
            mannings_n: 0.03,
            slope,
        }
    }

    /// Manning's equation for open channel flow: Q = (1/n) * A * R^(2/3) * S^(1/2)
    pub fn compute_capacity(&self) -> f64 {
        let (area, wetted_perimeter) = self.cross_section.hydraulic_properties();
        if wetted_perimeter < 1e-12 || self.slope <= 0.0 {
            return 0.0;
        }
        let hydraulic_radius = area / wetted_perimeter;
        (1.0 / self.mannings_n) * area * hydraulic_radius.powf(2.0 / 3.0) * self.slope.sqrt()
    }

    pub fn compute_velocity(&self) -> f64 {
        let (area, wetted_perimeter) = self.cross_section.hydraulic_properties();
        if wetted_perimeter < 1e-12 || area < 1e-12 || self.slope <= 0.0 {
            return 0.0;
        }
        let hydraulic_radius = area / wetted_perimeter;
        (1.0 / self.mannings_n) * hydraulic_radius.powf(2.0 / 3.0) * self.slope.sqrt()
    }
}

impl ChannelSection {
    pub fn hydraulic_properties(&self) -> (f64, f64) {
        match self {
            ChannelSection::Trapezoidal {
                bottom_width,
                side_slope,
                depth,
            } => {
                let area = (bottom_width + side_slope * depth) * depth;
                let wetted = bottom_width + 2.0 * depth * (1.0 + side_slope * side_slope).sqrt();
                (area, wetted)
            }
            ChannelSection::VDitch { side_slope, depth } => {
                let area = side_slope * depth * depth;
                let wetted = 2.0 * depth * (1.0 + side_slope * side_slope).sqrt();
                (area, wetted)
            }
            ChannelSection::Rectangular { width, depth } => {
                let area = width * depth;
                let wetted = width + 2.0 * depth;
                (area, wetted)
            }
            ChannelSection::Irregular {
                stations,
                elevations,
            } => {
                if stations.len() < 2 || stations.len() != elevations.len() {
                    return (0.0, 0.0);
                }
                let min_elev = elevations.iter().cloned().fold(f64::MAX, f64::min);
                let mut area = 0.0;
                let mut wetted = 0.0;
                for i in 0..stations.len() - 1 {
                    let dx = stations[i + 1] - stations[i];
                    let h1 = elevations[i] - min_elev;
                    let h2 = elevations[i + 1] - min_elev;
                    area += (h1 + h2) / 2.0 * dx;
                    let dh = h2 - h1;
                    wetted += (dx * dx + dh * dh).sqrt();
                }
                (area, wetted)
            }
        }
    }
}

impl Pond {
    pub fn new(name: String, center: Point3, pond_type: PondType) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            center,
            pond_type,
            stage_storage: Vec::new(),
            inflows: Vec::new(),
            outflows: Vec::new(),
            outlet_elevation: center.z,
            max_depth: 3.0,
        }
    }

    pub fn storage_at_elevation(&self, elevation: f64) -> f64 {
        if self.stage_storage.is_empty() {
            return 0.0;
        }
        for window in self.stage_storage.windows(2) {
            let (e1, s1) = window[0];
            let (e2, s2) = window[1];
            if elevation >= e1 && elevation <= e2 {
                let t = (elevation - e1) / (e2 - e1);
                return s1 + t * (s2 - s1);
            }
        }
        self.stage_storage.last().map_or(0.0, |&(_, s)| s)
    }

    pub fn total_storage(&self) -> f64 {
        self.stage_storage.last().map_or(0.0, |&(_, s)| s)
    }
}

impl UndergroundStorage {
    pub fn new(name: String, position: Point3, storage_type: StorageType) -> Self {
        let volume = match storage_type {
            StorageType::BoxChamber { width, height, length } => width * height * length,
            StorageType::PipeArch { diameter, length, count } => {
                std::f64::consts::PI * (diameter / 2.0).powi(2) * length * count as f64
            }
        };

        Self {
            id: Uuid::new_v4(),
            name,
            position,
            storage_type,
            volume,
            inflows: Vec::new(),
            outflows: Vec::new(),
        }
    }
}

fn compute_area(vertices: &[Point2]) -> f64 {
    let n = vertices.len();
    if n < 3 {
        return 0.0;
    }
    let mut area = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        area += vertices[i].x * vertices[j].y;
        area -= vertices[j].x * vertices[i].y;
    }
    (area / 2.0).abs()
}
