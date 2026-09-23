use crate::engine::Point3;

use super::{Surface, SurfaceAnalysis};

pub fn analyze_surface(surface: &Surface) -> SurfaceAnalysis {
    let points = &surface.points;

    if points.is_empty() {
        return SurfaceAnalysis {
            min_elevation: 0.0,
            max_elevation: 0.0,
            area: 0.0,
            volume: None,
            avg_slope: 0.0,
        };
    }

    let mut min_elev = f64::MAX;
    let mut max_elev = f64::MIN;
    for p in points {
        min_elev = min_elev.min(p.z);
        max_elev = max_elev.max(p.z);
    }

    let mut total_area = 0.0;
    let mut total_slope = 0.0;
    let tri_count = surface.triangles.len() as f64;

    for tri in &surface.triangles {
        let p0 = &points[tri[0] as usize];
        let p1 = &points[tri[1] as usize];
        let p2 = &points[tri[2] as usize];

        total_area += triangle_area_3d(p0, p1, p2);
        total_slope += triangle_slope(p0, p1, p2);
    }

    let avg_slope = if tri_count > 0.0 {
        total_slope / tri_count
    } else {
        0.0
    };

    SurfaceAnalysis {
        min_elevation: min_elev,
        max_elevation: max_elev,
        area: total_area,
        volume: None,
        avg_slope,
    }
}

fn triangle_area_3d(p0: &Point3, p1: &Point3, p2: &Point3) -> f64 {
    let ux = p1.x - p0.x;
    let uy = p1.y - p0.y;
    let uz = p1.z - p0.z;
    let vx = p2.x - p0.x;
    let vy = p2.y - p0.y;
    let vz = p2.z - p0.z;

    let cx = uy * vz - uz * vy;
    let cy = uz * vx - ux * vz;
    let cz = ux * vy - uy * vx;

    0.5 * (cx * cx + cy * cy + cz * cz).sqrt()
}

fn triangle_slope(p0: &Point3, p1: &Point3, p2: &Point3) -> f64 {
    let ux = p1.x - p0.x;
    let uy = p1.y - p0.y;
    let uz = p1.z - p0.z;
    let vx = p2.x - p0.x;
    let vy = p2.y - p0.y;
    let vz = p2.z - p0.z;

    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    let len = (nx * nx + ny * ny + nz * nz).sqrt();

    if len < 1e-12 {
        return 0.0;
    }

    let cos_angle = (nz / len).abs();
    if cos_angle < 1e-12 {
        return 90.0;
    }

    cos_angle.acos().to_degrees()
}
