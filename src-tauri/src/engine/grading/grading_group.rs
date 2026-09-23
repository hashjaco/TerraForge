use crate::engine::Point3;
use crate::engine::surface::Surface;

use super::{GradingGroup, GradingObject, FeatureLine};

/// Generate a projected TIN surface from all gradings in a group.
pub fn generate_group_surface(
    group: &GradingGroup,
    gradings: &[&GradingObject],
    feature_lines: &[&FeatureLine],
) -> Option<Surface> {
    let mut all_points: Vec<Point3> = Vec::new();

    for (grading, fl) in gradings.iter().zip(feature_lines.iter()) {
        all_points.extend_from_slice(&fl.vertices);
        all_points.extend_from_slice(&grading.projected_points);
    }

    if all_points.len() < 3 {
        return None;
    }

    let surface = Surface::from_points(
        format!("{} Surface", group.name),
        all_points,
        1.0,
    );

    Some(surface)
}
