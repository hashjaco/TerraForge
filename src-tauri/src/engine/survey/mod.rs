use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::Point3;

/// A COGO (Coordinate Geometry) point with survey metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CogoPoint {
    pub id: Uuid,
    pub number: u32,
    pub position: Point3,
    pub raw_description: String,
    pub full_description: String,
    pub code: String,
    pub is_adjusted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurveyFigure {
    pub name: String,
    pub code: String,
    pub point_numbers: Vec<u32>,
    pub vertices: Vec<Point3>,
    pub is_closed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurveyDatabase {
    pub id: Uuid,
    pub name: String,
    pub points: Vec<CogoPoint>,
    pub figures: Vec<SurveyFigure>,
    pub next_point_number: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldBook {
    pub instrument_point: Point3,
    pub observations: Vec<FieldObservation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldObservation {
    pub point_number: u32,
    pub horizontal_angle: f64,
    pub vertical_angle: f64,
    pub slope_distance: f64,
    pub prism_height: f64,
    pub code: String,
    pub description: String,
}

impl CogoPoint {
    pub fn new(number: u32, position: Point3, code: String, description: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            number,
            position,
            raw_description: description.clone(),
            full_description: description,
            code,
            is_adjusted: false,
        }
    }
}

impl SurveyDatabase {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            points: Vec::new(),
            figures: Vec::new(),
            next_point_number: 1,
        }
    }

    pub fn add_point(&mut self, position: Point3, code: String, description: String) -> u32 {
        let number = self.next_point_number;
        self.next_point_number += 1;
        self.points.push(CogoPoint::new(number, position, code, description));
        number
    }

    pub fn find_point(&self, number: u32) -> Option<&CogoPoint> {
        self.points.iter().find(|p| p.number == number)
    }

    pub fn find_points_by_code(&self, code: &str) -> Vec<&CogoPoint> {
        self.points.iter().filter(|p| p.code == code).collect()
    }

    /// Field-to-finish: automatically create figures from coded points.
    /// Points with the same code that have sequential numbers are connected.
    pub fn field_to_finish(&mut self) {
        use std::collections::HashMap;

        let mut code_groups: HashMap<String, Vec<&CogoPoint>> = HashMap::new();
        for point in &self.points {
            if !point.code.is_empty() {
                code_groups
                    .entry(point.code.clone())
                    .or_default()
                    .push(point);
            }
        }

        self.figures.clear();
        for (code, mut points) in code_groups {
            points.sort_by_key(|p| p.number);

            let mut figure_points = Vec::new();
            let mut figure_numbers = Vec::new();

            for point in &points {
                figure_points.push(point.position);
                figure_numbers.push(point.number);
            }

            if figure_points.len() >= 2 {
                let is_closed = figure_points.first().map(|f| {
                    figure_points.last().map_or(false, |l| f.distance_to(l) < 0.01)
                }).unwrap_or(false);

                self.figures.push(SurveyFigure {
                    name: code.clone(),
                    code: code.clone(),
                    point_numbers: figure_numbers,
                    vertices: figure_points,
                    is_closed,
                });
            }
        }
    }

    /// Process field book observations into COGO points.
    pub fn process_field_book(&mut self, field_book: &FieldBook) {
        for obs in &field_book.observations {
            let horiz_dist = obs.slope_distance * obs.vertical_angle.to_radians().sin();
            let vert_dist = obs.slope_distance * obs.vertical_angle.to_radians().cos();

            let angle_rad = obs.horizontal_angle.to_radians();
            let x = field_book.instrument_point.x + horiz_dist * angle_rad.sin();
            let y = field_book.instrument_point.y + horiz_dist * angle_rad.cos();
            let z = field_book.instrument_point.z + vert_dist - obs.prism_height;

            let position = Point3::new(x, y, z);
            self.add_point(position, obs.code.clone(), obs.description.clone());
        }
    }
}
