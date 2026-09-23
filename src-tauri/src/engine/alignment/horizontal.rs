use crate::engine::Point2;

use super::AlignmentSegment;

pub fn segment_length(segment: &AlignmentSegment) -> f64 {
    match segment {
        AlignmentSegment::Line { start, end } => start.distance_to(end),
        AlignmentSegment::Arc {
            radius,
            sweep_angle,
            ..
        } => (radius * sweep_angle).abs(),
        AlignmentSegment::Spiral { length, .. } => *length,
    }
}

pub fn point_at_distance(segment: &AlignmentSegment, distance: f64) -> Option<Point2> {
    match segment {
        AlignmentSegment::Line { start, end } => {
            let len = start.distance_to(end);
            if len < 1e-12 {
                return Some(*start);
            }
            let t = (distance / len).clamp(0.0, 1.0);
            Some(Point2::new(
                start.x + t * (end.x - start.x),
                start.y + t * (end.y - start.y),
            ))
        }
        AlignmentSegment::Arc {
            center,
            radius,
            start_angle,
            sweep_angle,
        } => {
            let arc_len = (radius * sweep_angle).abs();
            if arc_len < 1e-12 {
                return Some(Point2::new(
                    center.x + radius * start_angle.cos(),
                    center.y + radius * start_angle.sin(),
                ));
            }
            let t = (distance / arc_len).clamp(0.0, 1.0);
            let angle = start_angle + t * sweep_angle;
            Some(Point2::new(
                center.x + radius * angle.cos(),
                center.y + radius * angle.sin(),
            ))
        }
        AlignmentSegment::Spiral {
            start,
            start_direction,
            start_radius,
            end_radius,
            length,
        } => {
            if *length < 1e-12 {
                return Some(*start);
            }
            let t = (distance / length).clamp(0.0, 1.0);
            let s = t * length;

            // Clothoid approximation using Fresnel integrals (first-order)
            let a_sq = if (end_radius - start_radius).abs() > 1e-12 {
                length * start_radius * end_radius / (end_radius - start_radius).abs()
            } else {
                length * start_radius
            };

            let curvature_rate = if a_sq > 1e-12 { 1.0 / a_sq } else { 0.0 };
            let theta = start_direction + curvature_rate * s * s / 2.0;

            Some(Point2::new(
                start.x + s * theta.cos(),
                start.y + s * theta.sin(),
            ))
        }
    }
}

/// Compute the direction (tangent angle in radians) at a distance along a segment.
pub fn direction_at_distance(segment: &AlignmentSegment, distance: f64) -> f64 {
    match segment {
        AlignmentSegment::Line { start, end } => {
            (end.y - start.y).atan2(end.x - start.x)
        }
        AlignmentSegment::Arc {
            start_angle,
            sweep_angle,
            radius,
            ..
        } => {
            let arc_len = (radius * sweep_angle).abs();
            let t = if arc_len > 1e-12 {
                (distance / arc_len).clamp(0.0, 1.0)
            } else {
                0.0
            };
            let angle = start_angle + t * sweep_angle;
            if *sweep_angle >= 0.0 {
                angle + std::f64::consts::FRAC_PI_2
            } else {
                angle - std::f64::consts::FRAC_PI_2
            }
        }
        AlignmentSegment::Spiral {
            start_direction,
            start_radius,
            end_radius,
            length,
            ..
        } => {
            let a_sq = if (end_radius - start_radius).abs() > 1e-12 {
                length * start_radius * end_radius / (end_radius - start_radius).abs()
            } else {
                length * start_radius
            };
            let curvature_rate = if a_sq > 1e-12 { 1.0 / a_sq } else { 0.0 };
            let s = distance.clamp(0.0, *length);
            start_direction + curvature_rate * s * s / 2.0
        }
    }
}
