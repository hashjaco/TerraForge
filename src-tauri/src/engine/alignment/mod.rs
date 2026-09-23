pub mod horizontal;
pub mod stationing;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::engine::Point2;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AlignmentSegment {
    Line {
        start: Point2,
        end: Point2,
    },
    Arc {
        center: Point2,
        radius: f64,
        start_angle: f64,
        sweep_angle: f64,
    },
    Spiral {
        start: Point2,
        start_direction: f64,
        start_radius: f64,
        end_radius: f64,
        length: f64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Alignment {
    pub id: Uuid,
    pub name: String,
    pub segments: Vec<AlignmentSegment>,
}

impl Alignment {
    pub fn new(name: String, segments: Vec<AlignmentSegment>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            segments,
        }
    }

    pub fn total_length(&self) -> f64 {
        self.segments.iter().map(|s| horizontal::segment_length(s)).sum()
    }

    /// Sample points along the alignment at a given interval for rendering.
    pub fn sample_points(&self, interval: f64) -> Vec<Point2> {
        let mut points = Vec::new();
        let mut cumulative = 0.0;

        for segment in &self.segments {
            let seg_len = horizontal::segment_length(segment);
            let mut local = 0.0;

            while local <= seg_len {
                if let Some(pt) = horizontal::point_at_distance(segment, local) {
                    points.push(pt);
                }
                local += interval;
            }
            cumulative += seg_len;
        }

        if let Some(last_seg) = self.segments.last() {
            let seg_len = horizontal::segment_length(last_seg);
            if let Some(pt) = horizontal::point_at_distance(last_seg, seg_len) {
                if points.last().map_or(true, |last| last.distance_to(&pt) > 1e-6) {
                    points.push(pt);
                }
            }
        }

        let _ = cumulative;
        points
    }

    pub fn flatten_sampled_points(&self, interval: f64) -> Vec<f64> {
        let pts = self.sample_points(interval);
        let mut flat = Vec::with_capacity(pts.len() * 2);
        for p in &pts {
            flat.push(p.x);
            flat.push(p.y);
        }
        flat
    }
}
