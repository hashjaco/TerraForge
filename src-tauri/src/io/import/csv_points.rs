use crate::engine::Point3;

/// Import survey points from a CSV string.
/// Expected format: x,y,z (one point per line, with optional header).
pub fn import_csv_points(csv_content: &str) -> Result<Vec<Point3>, String> {
    let mut points = Vec::new();

    for (i, line) in csv_content.lines().enumerate() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        let parts: Vec<&str> = trimmed.split(',').collect();
        if parts.len() < 3 {
            // Might be a header row
            if i == 0 {
                continue;
            }
            return Err(format!("Line {}: expected at least 3 values (x,y,z)", i + 1));
        }

        let x = parts[0]
            .trim()
            .parse::<f64>()
            .map_err(|_| format!("Line {}: invalid x value '{}'", i + 1, parts[0].trim()))?;
        let y = parts[1]
            .trim()
            .parse::<f64>()
            .map_err(|_| format!("Line {}: invalid y value '{}'", i + 1, parts[1].trim()))?;
        let z = parts[2]
            .trim()
            .parse::<f64>()
            .map_err(|_| format!("Line {}: invalid z value '{}'", i + 1, parts[2].trim()))?;

        points.push(Point3::new(x, y, z));
    }

    Ok(points)
}
