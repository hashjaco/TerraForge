use crate::engine::Point3;
use delaunator::{triangulate as delaunay_triangulate, Point};

/// Perform Delaunay triangulation on a set of 3D points (using XY projection).
pub fn triangulate(points: &[Point3]) -> Vec<[u32; 3]> {
    if points.len() < 3 {
        return vec![];
    }

    let del_points: Vec<Point> = points.iter().map(|p| Point { x: p.x, y: p.y }).collect();

    let result = delaunay_triangulate(&del_points);

    let mut triangles = Vec::with_capacity(result.triangles.len() / 3);
    for i in (0..result.triangles.len()).step_by(3) {
        triangles.push([
            result.triangles[i] as u32,
            result.triangles[i + 1] as u32,
            result.triangles[i + 2] as u32,
        ]);
    }

    triangles
}

/// Constrained Delaunay Triangulation: triangulate with breakline enforcement.
/// Breaklines are polylines whose edges must appear in the final triangulation.
/// After standard Delaunay, we enforce constraints by flipping edges that cross breakline segments.
pub fn triangulate_constrained(
    points: &[Point3],
    breaklines: &[Vec<usize>],
) -> Vec<[u32; 3]> {
    let mut triangles = triangulate(points);

    if breaklines.is_empty() || triangles.is_empty() {
        return triangles;
    }

    for breakline in breaklines {
        for window in breakline.windows(2) {
            let (ci, cj) = (window[0] as u32, window[1] as u32);
            enforce_constraint(&mut triangles, points, ci, cj);
        }
    }

    triangles
}

fn enforce_constraint(triangles: &mut Vec<[u32; 3]>, points: &[Point3], ci: u32, cj: u32) {
    let max_iterations = triangles.len() * 3;
    for _ in 0..max_iterations {
        let crossing = find_crossing_edge(triangles, points, ci, cj);
        match crossing {
            Some((tri_a, tri_b, shared_a, shared_b)) => {
                if !flip_edge(triangles, tri_a, tri_b, shared_a, shared_b) {
                    break;
                }
            }
            None => break,
        }
    }
}

fn find_crossing_edge(
    triangles: &[[u32; 3]],
    points: &[Point3],
    ci: u32,
    cj: u32,
) -> Option<(usize, usize, u32, u32)> {
    for (i, tri) in triangles.iter().enumerate() {
        for edge_idx in 0..3 {
            let a = tri[edge_idx];
            let b = tri[(edge_idx + 1) % 3];
            if (a == ci && b == cj) || (a == cj && b == ci) {
                return None; // constraint already present
            }
            if a == ci || a == cj || b == ci || b == cj {
                continue;
            }
            if segments_cross(points, ci, cj, a, b) {
                if let Some(j) = find_adjacent_triangle(triangles, i, a, b) {
                    return Some((i, j, a, b));
                }
            }
        }
    }
    None
}

fn find_adjacent_triangle(triangles: &[[u32; 3]], tri_idx: usize, a: u32, b: u32) -> Option<usize> {
    for (j, tri) in triangles.iter().enumerate() {
        if j == tri_idx {
            continue;
        }
        let has_a = tri.contains(&a);
        let has_b = tri.contains(&b);
        if has_a && has_b {
            return Some(j);
        }
    }
    None
}

fn flip_edge(
    triangles: &mut Vec<[u32; 3]>,
    tri_a: usize,
    tri_b: usize,
    shared_a: u32,
    shared_b: u32,
) -> bool {
    let opp_a = find_opposite_vertex(&triangles[tri_a], shared_a, shared_b);
    let opp_b = find_opposite_vertex(&triangles[tri_b], shared_a, shared_b);

    if opp_a.is_none() || opp_b.is_none() {
        return false;
    }
    let opp_a = opp_a.unwrap();
    let opp_b = opp_b.unwrap();

    triangles[tri_a] = [opp_a, opp_b, shared_a];
    triangles[tri_b] = [opp_a, shared_b, opp_b];
    true
}

fn find_opposite_vertex(tri: &[u32; 3], a: u32, b: u32) -> Option<u32> {
    for &v in tri {
        if v != a && v != b {
            return Some(v);
        }
    }
    None
}

fn segments_cross(points: &[Point3], a: u32, b: u32, c: u32, d: u32) -> bool {
    let pa = &points[a as usize];
    let pb = &points[b as usize];
    let pc = &points[c as usize];
    let pd = &points[d as usize];

    let d1 = cross_2d(pc, pd, pa);
    let d2 = cross_2d(pc, pd, pb);
    let d3 = cross_2d(pa, pb, pc);
    let d4 = cross_2d(pa, pb, pd);

    if ((d1 > 0.0 && d2 < 0.0) || (d1 < 0.0 && d2 > 0.0))
        && ((d3 > 0.0 && d4 < 0.0) || (d3 < 0.0 && d4 > 0.0))
    {
        return true;
    }

    false
}

fn cross_2d(a: &Point3, b: &Point3, c: &Point3) -> f64 {
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/// Filter triangles to only those within a boundary polygon.
pub fn clip_to_boundary(
    triangles: &[[u32; 3]],
    points: &[Point3],
    boundary: &[(f64, f64)],
) -> Vec<[u32; 3]> {
    triangles
        .iter()
        .filter(|tri| {
            let cx = (points[tri[0] as usize].x
                + points[tri[1] as usize].x
                + points[tri[2] as usize].x)
                / 3.0;
            let cy = (points[tri[0] as usize].y
                + points[tri[1] as usize].y
                + points[tri[2] as usize].y)
                / 3.0;
            point_in_polygon(cx, cy, boundary)
        })
        .copied()
        .collect()
}

fn point_in_polygon(x: f64, y: f64, polygon: &[(f64, f64)]) -> bool {
    let n = polygon.len();
    if n < 3 {
        return false;
    }
    let mut inside = false;
    let mut j = n - 1;
    for i in 0..n {
        let (xi, yi) = polygon[i];
        let (xj, yj) = polygon[j];
        if ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
        j = i;
    }
    inside
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_triangulate_simple() {
        let points = vec![
            Point3::new(0.0, 0.0, 10.0),
            Point3::new(10.0, 0.0, 12.0),
            Point3::new(5.0, 10.0, 15.0),
            Point3::new(10.0, 10.0, 11.0),
        ];
        let triangles = triangulate(&points);
        assert!(!triangles.is_empty());
        assert_eq!(triangles.len(), 2);
    }

    #[test]
    fn test_triangulate_too_few_points() {
        let points = vec![Point3::new(0.0, 0.0, 10.0), Point3::new(1.0, 1.0, 11.0)];
        let triangles = triangulate(&points);
        assert!(triangles.is_empty());
    }

    #[test]
    fn test_constrained_triangulation() {
        let points = vec![
            Point3::new(0.0, 0.0, 10.0),
            Point3::new(10.0, 0.0, 12.0),
            Point3::new(10.0, 10.0, 15.0),
            Point3::new(0.0, 10.0, 11.0),
            Point3::new(5.0, 5.0, 13.0),
        ];
        let breaklines = vec![vec![0, 2]];
        let triangles = triangulate_constrained(&points, &breaklines);
        assert!(!triangles.is_empty());
    }

    #[test]
    fn test_boundary_clipping() {
        let points = vec![
            Point3::new(0.0, 0.0, 0.0),
            Point3::new(10.0, 0.0, 0.0),
            Point3::new(10.0, 10.0, 0.0),
            Point3::new(0.0, 10.0, 0.0),
        ];
        let triangles = triangulate(&points);
        let boundary = vec![(0.0, 0.0), (5.0, 0.0), (5.0, 10.0), (0.0, 10.0)];
        let clipped = clip_to_boundary(&triangles, &points, &boundary);
        assert!(clipped.len() <= triangles.len());
    }
}
