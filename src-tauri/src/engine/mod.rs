pub mod alignment;
pub mod corridor;
pub mod crs;
pub mod drainage;
pub mod grading;
pub mod intersection;
pub mod parcel;
pub mod pipe_network;
pub mod pressure_network;
pub mod profile;
pub mod surface;
pub mod survey;
pub mod validation;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point2 {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct Point3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

impl Point2 {
    pub fn new(x: f64, y: f64) -> Self {
        Self { x, y }
    }

    pub fn distance_to(&self, other: &Point2) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2)).sqrt()
    }
}

impl Point3 {
    pub fn new(x: f64, y: f64, z: f64) -> Self {
        Self { x, y, z }
    }

    pub fn to_2d(&self) -> Point2 {
        Point2::new(self.x, self.y)
    }

    pub fn distance_to(&self, other: &Point3) -> f64 {
        ((self.x - other.x).powi(2) + (self.y - other.y).powi(2) + (self.z - other.z).powi(2))
            .sqrt()
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ObjectType {
    Surface,
    Alignment,
    Profile,
    Corridor,
    PipeNetwork,
    FeatureLine,
    Parcel,
    CogoPoint,
    Catchment,
    PressureNetwork,
    Intersection,
}
