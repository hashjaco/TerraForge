use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::{Point2, Point3};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum IntersectionType {
    ThreeWay,
    FourWay,
    Roundabout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Intersection {
    pub id: Uuid,
    pub name: String,
    pub center: Point2,
    pub intersection_type: IntersectionType,
    pub alignment_ids: Vec<Uuid>,
    pub curb_returns: Vec<CurbReturn>,
    pub roundabout_params: Option<RoundaboutParams>,
    pub generated_points: Vec<Point3>,
    pub generated_triangles: Vec<[u32; 3]>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurbReturn {
    pub radius: f64,
    pub fillet_type: FilletType,
    pub corner_index: usize,
    pub points: Vec<Point2>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum FilletType {
    Circular,
    ThreeCenter,
    Compound,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundaboutParams {
    pub inscribed_diameter: f64,
    pub circulatory_width: f64,
    pub apron_width: f64,
    pub entry_width: f64,
    pub exit_width: f64,
    pub num_segments: usize,
}

impl Intersection {
    pub fn new_three_way(
        name: String,
        center: Point2,
        alignment_ids: Vec<Uuid>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            center,
            intersection_type: IntersectionType::ThreeWay,
            alignment_ids,
            curb_returns: Vec::new(),
            roundabout_params: None,
            generated_points: Vec::new(),
            generated_triangles: Vec::new(),
        }
    }

    pub fn new_four_way(
        name: String,
        center: Point2,
        alignment_ids: Vec<Uuid>,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            center,
            intersection_type: IntersectionType::FourWay,
            alignment_ids,
            curb_returns: Vec::new(),
            roundabout_params: None,
            generated_points: Vec::new(),
            generated_triangles: Vec::new(),
        }
    }

    pub fn new_roundabout(
        name: String,
        center: Point2,
        alignment_ids: Vec<Uuid>,
        params: RoundaboutParams,
    ) -> Self {
        let mut intersection = Self {
            id: Uuid::new_v4(),
            name,
            center,
            intersection_type: IntersectionType::Roundabout,
            alignment_ids,
            curb_returns: Vec::new(),
            roundabout_params: Some(params),
            generated_points: Vec::new(),
            generated_triangles: Vec::new(),
        };
        intersection.generate_roundabout_geometry();
        intersection
    }

    pub fn add_curb_return(&mut self, radius: f64, corner_index: usize) {
        let num_pts = 12;
        let mut points = Vec::with_capacity(num_pts);

        for i in 0..=num_pts {
            let angle = std::f64::consts::FRAC_PI_2 * i as f64 / num_pts as f64;
            let offset_angle = corner_index as f64 * std::f64::consts::FRAC_PI_2;
            let total_angle = offset_angle + angle;
            points.push(Point2::new(
                self.center.x + radius * total_angle.cos(),
                self.center.y + radius * total_angle.sin(),
            ));
        }

        self.curb_returns.push(CurbReturn {
            radius,
            fillet_type: FilletType::Circular,
            corner_index,
            points,
        });
    }

    fn generate_roundabout_geometry(&mut self) {
        let params = match &self.roundabout_params {
            Some(p) => p.clone(),
            None => return,
        };

        let outer_radius = params.inscribed_diameter / 2.0;
        let inner_radius = outer_radius - params.circulatory_width;
        let num_segs = params.num_segments.max(16);

        self.generated_points.clear();
        self.generated_triangles.clear();

        // Generate outer ring points
        for i in 0..num_segs {
            let angle = 2.0 * std::f64::consts::PI * i as f64 / num_segs as f64;
            self.generated_points.push(Point3::new(
                self.center.x + outer_radius * angle.cos(),
                self.center.y + outer_radius * angle.sin(),
                0.0,
            ));
        }

        // Generate inner ring points
        for i in 0..num_segs {
            let angle = 2.0 * std::f64::consts::PI * i as f64 / num_segs as f64;
            self.generated_points.push(Point3::new(
                self.center.x + inner_radius * angle.cos(),
                self.center.y + inner_radius * angle.sin(),
                0.0,
            ));
        }

        // Triangulate the ring
        for i in 0..num_segs {
            let next = (i + 1) % num_segs;
            let outer_i = i as u32;
            let outer_next = next as u32;
            let inner_i = (num_segs + i) as u32;
            let inner_next = (num_segs + next) as u32;

            self.generated_triangles.push([outer_i, inner_i, outer_next]);
            self.generated_triangles.push([outer_next, inner_i, inner_next]);
        }
    }

    pub fn flatten_points(&self) -> Vec<f64> {
        let mut flat = Vec::with_capacity(self.generated_points.len() * 3);
        for p in &self.generated_points {
            flat.push(p.x);
            flat.push(p.y);
            flat.push(p.z);
        }
        flat
    }

    pub fn flatten_triangles(&self) -> Vec<u32> {
        let mut flat = Vec::with_capacity(self.generated_triangles.len() * 3);
        for t in &self.generated_triangles {
            flat.push(t[0]);
            flat.push(t[1]);
            flat.push(t[2]);
        }
        flat
    }
}
