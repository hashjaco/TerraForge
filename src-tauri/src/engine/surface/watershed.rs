use crate::engine::{Point2, Point3};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WaterDropPath {
    pub start: Point2,
    pub path: Vec<Point2>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatershedRegion {
    pub id: usize,
    pub boundary: Vec<Point2>,
    pub pour_point: Point2,
    pub area: f64,
}

/// Trace a water drop path across a TIN surface from a starting point.
pub fn trace_water_drop(
    start: Point2,
    points: &[Point3],
    triangles: &[[u32; 3]],
    max_steps: usize,
) -> WaterDropPath {
    let mut path = vec![start];
    let mut current = start;
    let step_size = 0.5;

    for _ in 0..max_steps {
        let gradient = compute_gradient_at(current.x, current.y, points, triangles);
        match gradient {
            Some((gx, gy)) => {
                let len = (gx * gx + gy * gy).sqrt();
                if len < 1e-8 {
                    break; // flat area or local minimum
                }
                // Move in steepest downhill direction (negative gradient)
                let next = Point2::new(
                    current.x - (gx / len) * step_size,
                    current.y - (gy / len) * step_size,
                );
                path.push(next);
                current = next;
            }
            None => break, // outside surface
        }
    }

    WaterDropPath { start, path }
}

/// Delineate watersheds by assigning each triangle to a drainage basin.
pub fn delineate_watersheds(
    points: &[Point3],
    triangles: &[[u32; 3]],
) -> Vec<WatershedRegion> {
    if triangles.is_empty() {
        return Vec::new();
    }

    // Find local minima (triangles where no neighbor is lower)
    let centroids: Vec<(f64, f64, f64)> = triangles
        .iter()
        .map(|tri| {
            let p0 = &points[tri[0] as usize];
            let p1 = &points[tri[1] as usize];
            let p2 = &points[tri[2] as usize];
            (
                (p0.x + p1.x + p2.x) / 3.0,
                (p0.y + p1.y + p2.y) / 3.0,
                (p0.z + p1.z + p2.z) / 3.0,
            )
        })
        .collect();

    // Build adjacency
    let n = triangles.len();
    let mut adjacency: Vec<Vec<usize>> = vec![Vec::new(); n];
    for i in 0..n {
        for j in (i + 1)..n {
            if shared_edge_count(&triangles[i], &triangles[j]) >= 2 {
                adjacency[i].push(j);
                adjacency[j].push(i);
            }
        }
    }

    // Assign each triangle to a basin by flowing downhill
    let mut basin_id: Vec<Option<usize>> = vec![None; n];
    let mut next_basin = 0;

    // Sort triangles by elevation (low to high)
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by(|&a, &b| centroids[a].2.partial_cmp(&centroids[b].2).unwrap());

    for &idx in &order {
        // Find lowest neighbor
        let mut lowest_neighbor = None;
        let mut lowest_elev = centroids[idx].2;
        for &adj in &adjacency[idx] {
            if centroids[adj].2 < lowest_elev {
                lowest_elev = centroids[adj].2;
                lowest_neighbor = Some(adj);
            }
        }

        match lowest_neighbor {
            Some(ln) => {
                if let Some(bid) = basin_id[ln] {
                    basin_id[idx] = Some(bid);
                } else {
                    let bid = next_basin;
                    next_basin += 1;
                    basin_id[idx] = Some(bid);
                    basin_id[ln] = Some(bid);
                }
            }
            None => {
                basin_id[idx] = Some(next_basin);
                next_basin += 1;
            }
        }
    }

    // Build regions
    let mut regions: Vec<WatershedRegion> = Vec::new();
    for bid in 0..next_basin {
        let member_tris: Vec<usize> = (0..n)
            .filter(|&i| basin_id[i] == Some(bid))
            .collect();

        if member_tris.is_empty() {
            continue;
        }

        let mut total_area = 0.0;
        let mut min_elev = f64::MAX;
        let mut pour = Point2::new(0.0, 0.0);

        for &ti in &member_tris {
            let tri = &triangles[ti];
            let p0 = &points[tri[0] as usize];
            let p1 = &points[tri[1] as usize];
            let p2 = &points[tri[2] as usize];
            total_area += triangle_area_2d(p0, p1, p2);

            let elev = centroids[ti].2;
            if elev < min_elev {
                min_elev = elev;
                pour = Point2::new(centroids[ti].0, centroids[ti].1);
            }
        }

        // Build boundary from outermost edges
        let boundary = compute_basin_boundary(&member_tris, triangles, points);

        regions.push(WatershedRegion {
            id: bid,
            boundary,
            pour_point: pour,
            area: total_area,
        });
    }

    regions
}

fn shared_edge_count(a: &[u32; 3], b: &[u32; 3]) -> usize {
    let mut count = 0;
    for &v in a {
        if b.contains(&v) {
            count += 1;
        }
    }
    count
}

fn compute_gradient_at(
    x: f64,
    y: f64,
    points: &[Point3],
    triangles: &[[u32; 3]],
) -> Option<(f64, f64)> {
    for tri in triangles {
        let p0 = &points[tri[0] as usize];
        let p1 = &points[tri[1] as usize];
        let p2 = &points[tri[2] as usize];

        if point_in_triangle_2d(x, y, p0, p1, p2) {
            // Gradient of the plane defined by the triangle
            let ux = p1.x - p0.x;
            let uy = p1.y - p0.y;
            let uz = p1.z - p0.z;
            let vx = p2.x - p0.x;
            let vy = p2.y - p0.y;
            let vz = p2.z - p0.z;

            let nx = uy * vz - uz * vy;
            let ny = uz * vx - ux * vz;
            let nz = ux * vy - uy * vx;

            if nz.abs() < 1e-12 {
                return Some((0.0, 0.0));
            }

            let dz_dx = -nx / nz;
            let dz_dy = -ny / nz;
            return Some((dz_dx, dz_dy));
        }
    }
    None
}

fn point_in_triangle_2d(x: f64, y: f64, p0: &Point3, p1: &Point3, p2: &Point3) -> bool {
    let denom = (p1.y - p2.y) * (p0.x - p2.x) + (p2.x - p1.x) * (p0.y - p2.y);
    if denom.abs() < 1e-12 {
        return false;
    }
    let l1 = ((p1.y - p2.y) * (x - p2.x) + (p2.x - p1.x) * (y - p2.y)) / denom;
    let l2 = ((p2.y - p0.y) * (x - p2.x) + (p0.x - p2.x) * (y - p2.y)) / denom;
    let l3 = 1.0 - l1 - l2;
    let eps = -1e-8;
    l1 >= eps && l2 >= eps && l3 >= eps
}

fn triangle_area_2d(p0: &Point3, p1: &Point3, p2: &Point3) -> f64 {
    ((p1.x - p0.x) * (p2.y - p0.y) - (p2.x - p0.x) * (p1.y - p0.y)).abs() / 2.0
}

fn compute_basin_boundary(
    member_tris: &[usize],
    triangles: &[[u32; 3]],
    points: &[Point3],
) -> Vec<Point2> {
    use std::collections::HashSet;
    let _tri_set: HashSet<usize> = member_tris.iter().copied().collect();
    let mut boundary_edges: Vec<(u32, u32)> = Vec::new();

    for &ti in member_tris {
        let tri = &triangles[ti];
        for e in 0..3 {
            let a = tri[e];
            let b = tri[(e + 1) % 3];
            let edge_shared = member_tris.iter().any(|&other| {
                other != ti && {
                    let ot = &triangles[other];
                    ot.contains(&a) && ot.contains(&b)
                }
            });
            if !edge_shared {
                boundary_edges.push((a, b));
            }
        }
    }

    // Assemble boundary edges into a polygon
    let mut result = Vec::new();
    if boundary_edges.is_empty() {
        return result;
    }

    let current_edge = boundary_edges.remove(0);
    result.push(Point2::new(
        points[current_edge.0 as usize].x,
        points[current_edge.0 as usize].y,
    ));

    let start = current_edge.0;
    let mut current = current_edge.1;
    let max_iter = boundary_edges.len() + 2;

    for _ in 0..max_iter {
        result.push(Point2::new(
            points[current as usize].x,
            points[current as usize].y,
        ));
        if current == start {
            break;
        }
        if let Some(pos) = boundary_edges.iter().position(|e| e.0 == current) {
            let next_edge = boundary_edges.remove(pos);
            current = next_edge.1;
        } else if let Some(pos) = boundary_edges.iter().position(|e| e.1 == current) {
            let next_edge = boundary_edges.remove(pos);
            current = next_edge.0;
        } else {
            break;
        }
    }

    result
}
