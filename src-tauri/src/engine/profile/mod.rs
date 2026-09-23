pub mod vertical;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A Point of Vertical Intersection defining the profile geometry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PVI {
    pub station: f64,
    pub elevation: f64,
    pub curve_length: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Profile {
    pub id: Uuid,
    pub name: String,
    pub alignment_id: Uuid,
    pub pvis: Vec<PVI>,
    pub surface_id: Option<Uuid>,
}

impl Profile {
    pub fn new(name: String, alignment_id: Uuid, pvis: Vec<PVI>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            alignment_id,
            pvis,
            surface_id: None,
        }
    }

    /// Sample profile elevation at a given station.
    pub fn elevation_at(&self, station: f64) -> f64 {
        vertical::elevation_at_station(&self.pvis, station)
    }

    /// Sample points along the profile at an interval for rendering.
    pub fn sample_points(&self, start_station: f64, end_station: f64, interval: f64) -> Vec<(f64, f64)> {
        let mut points = Vec::new();
        let mut s = start_station;
        while s <= end_station {
            points.push((s, self.elevation_at(s)));
            s += interval;
        }
        if points.last().map_or(true, |&(last_s, _)| (last_s - end_station).abs() > 1e-6) {
            points.push((end_station, self.elevation_at(end_station)));
        }
        points
    }

    pub fn flatten_sampled(&self, start: f64, end: f64, interval: f64) -> Vec<f64> {
        let pts = self.sample_points(start, end, interval);
        let mut flat = Vec::with_capacity(pts.len() * 2);
        for (s, e) in pts {
            flat.push(s);
            flat.push(e);
        }
        flat
    }
}
