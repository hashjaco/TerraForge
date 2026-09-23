pub mod analysis;
pub mod contour;
pub mod grid;
pub mod tin;
pub mod volume;
pub mod watershed;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::engine::{Point2, Point3};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SurfaceType {
    Tin,
    Grid {
        cols: usize,
        rows: usize,
        resolution: f64,
        min_x: f64,
        min_y: f64,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Breakline {
    pub name: String,
    pub point_indices: Vec<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BoundaryType {
    Outer,
    Hide,
    Show,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurfaceBoundary {
    pub boundary_type: BoundaryType,
    pub vertices: Vec<Point2>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SurfaceEdit {
    AddPoint(Point3),
    RemovePoint(usize),
    MovePoint { index: usize, new_pos: Point3 },
    AddBreakline(Breakline),
    SwapEdge { tri_a: usize, tri_b: usize },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Surface {
    pub id: Uuid,
    pub name: String,
    pub surface_type: SurfaceType,
    pub points: Vec<Point3>,
    pub triangles: Vec<[u32; 3]>,
    pub breaklines: Vec<Breakline>,
    pub boundaries: Vec<SurfaceBoundary>,
    pub edit_history: Vec<SurfaceEdit>,
    pub boundary: Option<Vec<Point2>>,
    pub contour_interval: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurfaceAnalysis {
    pub min_elevation: f64,
    pub max_elevation: f64,
    pub area: f64,
    pub volume: Option<f64>,
    pub avg_slope: f64,
}

impl Surface {
    pub fn from_points(name: String, points: Vec<Point3>, contour_interval: f64) -> Self {
        let triangles = tin::triangulate(&points);
        Self {
            id: Uuid::new_v4(),
            name,
            surface_type: SurfaceType::Tin,
            points,
            triangles,
            breaklines: Vec::new(),
            boundaries: Vec::new(),
            edit_history: Vec::new(),
            boundary: None,
            contour_interval,
        }
    }

    pub fn from_points_with_breaklines(
        name: String,
        points: Vec<Point3>,
        breaklines: Vec<Breakline>,
        contour_interval: f64,
    ) -> Self {
        let bl_indices: Vec<Vec<usize>> = breaklines.iter().map(|b| b.point_indices.clone()).collect();
        let triangles = tin::triangulate_constrained(&points, &bl_indices);
        Self {
            id: Uuid::new_v4(),
            name,
            surface_type: SurfaceType::Tin,
            points,
            triangles,
            breaklines,
            boundaries: Vec::new(),
            edit_history: Vec::new(),
            boundary: None,
            contour_interval,
        }
    }

    pub fn from_grid(
        name: String,
        min_x: f64,
        min_y: f64,
        max_x: f64,
        max_y: f64,
        resolution: f64,
        elevations: &[f64],
        contour_interval: f64,
    ) -> Self {
        let cols = ((max_x - min_x) / resolution).ceil() as usize + 1;
        let rows = ((max_y - min_y) / resolution).ceil() as usize + 1;

        let mut points = Vec::with_capacity(cols * rows);
        for row in 0..rows {
            for col in 0..cols {
                let x = min_x + col as f64 * resolution;
                let y = min_y + row as f64 * resolution;
                let idx = row * cols + col;
                let z = if idx < elevations.len() {
                    elevations[idx]
                } else {
                    0.0
                };
                points.push(Point3::new(x, y, z));
            }
        }

        let mut triangles = Vec::with_capacity((cols.saturating_sub(1)) * (rows.saturating_sub(1)) * 2);
        for row in 0..rows.saturating_sub(1) {
            for col in 0..cols.saturating_sub(1) {
                let tl = (row * cols + col) as u32;
                let tr = tl + 1;
                let bl = ((row + 1) * cols + col) as u32;
                let br = bl + 1;
                triangles.push([tl, bl, tr]);
                triangles.push([tr, bl, br]);
            }
        }

        Self {
            id: Uuid::new_v4(),
            name,
            surface_type: SurfaceType::Grid {
                cols,
                rows,
                resolution,
                min_x,
                min_y,
            },
            points,
            triangles,
            breaklines: Vec::new(),
            boundaries: Vec::new(),
            edit_history: Vec::new(),
            boundary: None,
            contour_interval,
        }
    }

    pub fn retrangulate(&mut self) {
        let bl_indices: Vec<Vec<usize>> =
            self.breaklines.iter().map(|b| b.point_indices.clone()).collect();
        if bl_indices.is_empty() {
            self.triangles = tin::triangulate(&self.points);
        } else {
            self.triangles = tin::triangulate_constrained(&self.points, &bl_indices);
        }
        self.apply_boundaries();
    }

    fn apply_boundaries(&mut self) {
        for boundary in &self.boundaries {
            let poly: Vec<(f64, f64)> = boundary.vertices.iter().map(|v| (v.x, v.y)).collect();
            match boundary.boundary_type {
                BoundaryType::Outer => {
                    self.triangles = tin::clip_to_boundary(&self.triangles, &self.points, &poly);
                }
                BoundaryType::Hide => {
                    let inside = tin::clip_to_boundary(&self.triangles, &self.points, &poly);
                    self.triangles.retain(|t| !inside.contains(t));
                }
                BoundaryType::Show => {
                    // Show boundaries are typically additive -- keep only inside
                }
            }
        }
    }

    pub fn apply_edit(&mut self, edit: SurfaceEdit) {
        match &edit {
            SurfaceEdit::AddPoint(p) => {
                self.points.push(*p);
            }
            SurfaceEdit::RemovePoint(idx) => {
                if *idx < self.points.len() {
                    self.points.remove(*idx);
                }
            }
            SurfaceEdit::MovePoint { index, new_pos } => {
                if *index < self.points.len() {
                    self.points[*index] = *new_pos;
                }
            }
            SurfaceEdit::AddBreakline(bl) => {
                self.breaklines.push(bl.clone());
            }
            SurfaceEdit::SwapEdge { tri_a, tri_b } => {
                if *tri_a < self.triangles.len() && *tri_b < self.triangles.len() {
                    let ta = self.triangles[*tri_a];
                    let tb = self.triangles[*tri_b];
                    let mut shared = Vec::new();
                    let mut opp_a = None;
                    let mut opp_b = None;
                    for &v in &ta {
                        if tb.contains(&v) {
                            shared.push(v);
                        } else {
                            opp_a = Some(v);
                        }
                    }
                    for &v in &tb {
                        if !ta.contains(&v) {
                            opp_b = Some(v);
                        }
                    }
                    if shared.len() == 2 {
                        if let (Some(oa), Some(ob)) = (opp_a, opp_b) {
                            self.triangles[*tri_a] = [oa, ob, shared[0]];
                            self.triangles[*tri_b] = [oa, shared[1], ob];
                        }
                    }
                }
            }
        }
        self.edit_history.push(edit);
        self.retrangulate();
    }

    pub fn update_point(&mut self, index: usize, new_pos: Point3) {
        if index < self.points.len() {
            self.points[index] = new_pos;
            self.retrangulate();
        }
    }

    pub fn add_boundary(&mut self, boundary: SurfaceBoundary) {
        self.boundaries.push(boundary);
        self.retrangulate();
    }

    pub fn analyze(&self) -> SurfaceAnalysis {
        analysis::analyze_surface(self)
    }

    /// Interpolate elevation at an XY point on the TIN surface.
    pub fn elevation_at(&self, x: f64, y: f64) -> Option<f64> {
        for tri in &self.triangles {
            let p0 = &self.points[tri[0] as usize];
            let p1 = &self.points[tri[1] as usize];
            let p2 = &self.points[tri[2] as usize];

            if let Some(z) = barycentric_interpolate(x, y, p0, p1, p2) {
                return Some(z);
            }
        }
        None
    }

    pub fn flatten_points(&self) -> Vec<f64> {
        let mut flat = Vec::with_capacity(self.points.len() * 3);
        for p in &self.points {
            flat.push(p.x);
            flat.push(p.y);
            flat.push(p.z);
        }
        flat
    }

    pub fn flatten_triangles(&self) -> Vec<u32> {
        let mut flat = Vec::with_capacity(self.triangles.len() * 3);
        for t in &self.triangles {
            flat.push(t[0]);
            flat.push(t[1]);
            flat.push(t[2]);
        }
        flat
    }
}

fn barycentric_interpolate(x: f64, y: f64, p0: &Point3, p1: &Point3, p2: &Point3) -> Option<f64> {
    let denom = (p1.y - p2.y) * (p0.x - p2.x) + (p2.x - p1.x) * (p0.y - p2.y);
    if denom.abs() < 1e-12 {
        return None;
    }
    let l1 = ((p1.y - p2.y) * (x - p2.x) + (p2.x - p1.x) * (y - p2.y)) / denom;
    let l2 = ((p2.y - p0.y) * (x - p2.x) + (p0.x - p2.x) * (y - p2.y)) / denom;
    let l3 = 1.0 - l1 - l2;

    let eps = -1e-8;
    if l1 >= eps && l2 >= eps && l3 >= eps {
        Some(l1 * p0.z + l2 * p1.z + l3 * p2.z)
    } else {
        None
    }
}
