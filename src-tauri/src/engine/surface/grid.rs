use crate::engine::Point3;

/// Generate a regular grid surface from bounds and resolution.
pub fn generate_grid(
    min_x: f64,
    min_y: f64,
    max_x: f64,
    max_y: f64,
    resolution: f64,
    elevation_fn: impl Fn(f64, f64) -> f64,
) -> (Vec<Point3>, Vec<[u32; 3]>) {
    let cols = ((max_x - min_x) / resolution).ceil() as usize + 1;
    let rows = ((max_y - min_y) / resolution).ceil() as usize + 1;

    let mut points = Vec::with_capacity(cols * rows);
    for row in 0..rows {
        for col in 0..cols {
            let x = min_x + col as f64 * resolution;
            let y = min_y + row as f64 * resolution;
            let z = elevation_fn(x, y);
            points.push(Point3::new(x, y, z));
        }
    }

    let mut triangles = Vec::with_capacity((cols - 1) * (rows - 1) * 2);
    for row in 0..rows - 1 {
        for col in 0..cols - 1 {
            let tl = (row * cols + col) as u32;
            let tr = tl + 1;
            let bl = ((row + 1) * cols + col) as u32;
            let br = bl + 1;

            triangles.push([tl, bl, tr]);
            triangles.push([tr, bl, br]);
        }
    }

    (points, triangles)
}
