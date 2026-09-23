use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::engine::Point2;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Parcel {
    pub id: Uuid,
    pub name: String,
    pub number: String,
    pub vertices: Vec<Point2>,
    pub area: f64,
    pub perimeter: f64,
    pub site_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Site {
    pub id: Uuid,
    pub name: String,
    pub parcels: Vec<Uuid>,
    pub alignments: Vec<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SubdivisionMethod {
    Frontage { frontage_width: f64 },
    Sliding { ratio: f64 },
    FreeForm,
}

impl Parcel {
    pub fn new(name: String, number: String, vertices: Vec<Point2>) -> Self {
        let area = compute_polygon_area(&vertices);
        let perimeter = compute_polygon_perimeter(&vertices);
        Self {
            id: Uuid::new_v4(),
            name,
            number,
            vertices,
            area,
            perimeter,
            site_id: None,
        }
    }

    pub fn recalculate(&mut self) {
        self.area = compute_polygon_area(&self.vertices);
        self.perimeter = compute_polygon_perimeter(&self.vertices);
    }

    pub fn contains_point(&self, point: &Point2) -> bool {
        point_in_polygon_2d(point, &self.vertices)
    }

    /// Subdivide this parcel using the frontage method along one edge.
    pub fn subdivide_frontage(
        &self,
        frontage_width: f64,
        edge_start_idx: usize,
    ) -> Vec<Parcel> {
        let n = self.vertices.len();
        if n < 3 || edge_start_idx >= n {
            return vec![self.clone()];
        }

        let edge_end_idx = (edge_start_idx + 1) % n;
        let start = &self.vertices[edge_start_idx];
        let end = &self.vertices[edge_end_idx];
        let edge_len = start.distance_to(end);

        let num_lots = (edge_len / frontage_width).floor() as usize;
        if num_lots <= 1 {
            return vec![self.clone()];
        }

        let dir_x = (end.x - start.x) / edge_len;
        let dir_y = (end.y - start.y) / edge_len;

        let mut parcels = Vec::new();
        for i in 0..num_lots {
            let lot_start_x = start.x + dir_x * frontage_width * i as f64;
            let lot_start_y = start.y + dir_y * frontage_width * i as f64;
            let lot_end_x = start.x + dir_x * frontage_width * (i + 1) as f64;
            let lot_end_y = start.y + dir_y * frontage_width * (i + 1) as f64;

            // Create a rectangular lot (simplified)
            let perp_x = -dir_y;
            let perp_y = dir_x;
            let depth = self.area / edge_len;

            let verts = vec![
                Point2::new(lot_start_x, lot_start_y),
                Point2::new(lot_end_x, lot_end_y),
                Point2::new(lot_end_x + perp_x * depth, lot_end_y + perp_y * depth),
                Point2::new(lot_start_x + perp_x * depth, lot_start_y + perp_y * depth),
            ];

            parcels.push(Parcel::new(
                format!("{}-{}", self.name, i + 1),
                format!("{}-{}", self.number, i + 1),
                verts,
            ));
        }

        parcels
    }
}

impl Site {
    pub fn new(name: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            parcels: Vec::new(),
            alignments: Vec::new(),
        }
    }
}

fn compute_polygon_area(vertices: &[Point2]) -> f64 {
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

fn compute_polygon_perimeter(vertices: &[Point2]) -> f64 {
    let n = vertices.len();
    if n < 2 {
        return 0.0;
    }
    let mut perimeter = 0.0;
    for i in 0..n {
        let j = (i + 1) % n;
        perimeter += vertices[i].distance_to(&vertices[j]);
    }
    perimeter
}

fn point_in_polygon_2d(point: &Point2, polygon: &[Point2]) -> bool {
    let n = polygon.len();
    if n < 3 {
        return false;
    }
    let mut inside = false;
    let mut j = n - 1;
    for i in 0..n {
        if ((polygon[i].y > point.y) != (polygon[j].y > point.y))
            && (point.x
                < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)
                    / (polygon[j].y - polygon[i].y)
                    + polygon[i].x)
        {
            inside = !inside;
        }
        j = i;
    }
    inside
}
