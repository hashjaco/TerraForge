use crate::engine::{Point2, Point3};

/// Generate contour lines at a given interval from a triangulated surface.
/// Returns a vec of contour polylines, each at a specific elevation.
pub fn generate_contours(
    points: &[Point3],
    triangles: &[[u32; 3]],
    interval: f64,
    min_elev: f64,
    max_elev: f64,
) -> Vec<ContourLine> {
    let mut contours = Vec::new();
    let mut elevation = (min_elev / interval).ceil() * interval;

    while elevation <= max_elev {
        let mut segments: Vec<(Point2, Point2)> = Vec::new();

        for tri in triangles {
            let p0 = &points[tri[0] as usize];
            let p1 = &points[tri[1] as usize];
            let p2 = &points[tri[2] as usize];

            let edges = [(p0, p1), (p1, p2), (p2, p0)];
            let mut intersections = Vec::new();

            for (a, b) in &edges {
                if let Some(pt) = intersect_edge(a, b, elevation) {
                    intersections.push(pt);
                }
            }

            if intersections.len() == 2 {
                segments.push((intersections[0], intersections[1]));
            }
        }

        if !segments.is_empty() {
            let polylines = assemble_polylines(segments);
            for vertices in polylines {
                contours.push(ContourLine {
                    elevation,
                    vertices,
                });
            }
        }

        elevation += interval;
    }

    contours
}

#[derive(Debug, Clone)]
pub struct ContourLine {
    pub elevation: f64,
    pub vertices: Vec<Point2>,
}

fn intersect_edge(a: &Point3, b: &Point3, elevation: f64) -> Option<Point2> {
    if (a.z - elevation) * (b.z - elevation) > 0.0 {
        return None;
    }
    if (a.z - elevation).abs() < 1e-10 && (b.z - elevation).abs() < 1e-10 {
        return None;
    }

    let t = (elevation - a.z) / (b.z - a.z);
    if !(0.0..=1.0).contains(&t) {
        return None;
    }

    Some(Point2::new(a.x + t * (b.x - a.x), a.y + t * (b.y - a.y)))
}

fn assemble_polylines(segments: Vec<(Point2, Point2)>) -> Vec<Vec<Point2>> {
    let mut result = Vec::new();
    let mut used = vec![false; segments.len()];

    for i in 0..segments.len() {
        if used[i] {
            continue;
        }
        used[i] = true;
        let mut polyline = vec![segments[i].0, segments[i].1];

        loop {
            let mut found = false;
            for j in 0..segments.len() {
                if used[j] {
                    continue;
                }
                let last = *polyline.last().unwrap();
                if distance_2d(&last, &segments[j].0) < 1e-6 {
                    polyline.push(segments[j].1);
                    used[j] = true;
                    found = true;
                } else if distance_2d(&last, &segments[j].1) < 1e-6 {
                    polyline.push(segments[j].0);
                    used[j] = true;
                    found = true;
                }
            }
            if !found {
                break;
            }
        }

        result.push(polyline);
    }

    result
}

fn distance_2d(a: &Point2, b: &Point2) -> f64 {
    ((a.x - b.x).powi(2) + (a.y - b.y).powi(2)).sqrt()
}
