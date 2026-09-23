use crate::engine::Point3;
use crate::engine::alignment::Alignment;
use crate::engine::alignment::horizontal;
use crate::engine::profile::Profile;
use crate::engine::surface::Surface;

use super::FeatureLine;
use super::FeatureLineSource;

/// Extract a feature line from a surface along a polyline path.
pub fn extract_from_surface(
    name: String,
    surface: &Surface,
    path: &[(f64, f64)],
) -> FeatureLine {
    let mut vertices = Vec::new();
    for &(x, y) in path {
        let z = surface.elevation_at(x, y).unwrap_or(0.0);
        vertices.push(Point3::new(x, y, z));
    }
    let mut fl = FeatureLine::new(name, vertices);
    fl.source = FeatureLineSource::ExtractedFromSurface(surface.id);
    fl
}

/// Extract a feature line from a corridor along a specific offset.
pub fn extract_from_corridor_offset(
    name: String,
    alignment: &Alignment,
    profile: &Profile,
    offset: f64,
    interval: f64,
    corridor_id: uuid::Uuid,
) -> FeatureLine {
    let total_length = alignment.total_length();
    let mut vertices = Vec::new();
    let mut station = 0.0;

    while station <= total_length {
        let mut cumulative = 0.0;
        for segment in &alignment.segments {
            let seg_len = horizontal::segment_length(segment);
            if cumulative + seg_len >= station {
                let local = station - cumulative;
                if let Some(pt) = horizontal::point_at_distance(segment, local) {
                    let dir = horizontal::direction_at_distance(segment, local);
                    let perp = dir + std::f64::consts::FRAC_PI_2;
                    let z = profile.elevation_at(station);
                    vertices.push(Point3::new(
                        pt.x + offset * perp.cos(),
                        pt.y + offset * perp.sin(),
                        z,
                    ));
                }
                break;
            }
            cumulative += seg_len;
        }
        station += interval;
    }

    let mut fl = FeatureLine::new(name, vertices);
    fl.source = FeatureLineSource::ExtractedFromCorridor(corridor_id);
    fl
}
