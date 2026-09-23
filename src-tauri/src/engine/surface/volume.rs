use serde::{Deserialize, Serialize};

use super::Surface;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeResult {
    pub cut_volume: f64,
    pub fill_volume: f64,
    pub net_volume: f64,
    pub cut_area: f64,
    pub fill_area: f64,
}

/// Compute cut/fill volumes between two surfaces using the grid sampling method.
/// Samples both surfaces on a regular grid and computes prismatic volumes.
pub fn surface_to_surface_volume(
    existing: &Surface,
    design: &Surface,
    grid_spacing: f64,
) -> VolumeResult {
    let (min_x, max_x, min_y, max_y) = common_extent(existing, design);

    let mut cut_volume = 0.0;
    let mut fill_volume = 0.0;
    let mut cut_area = 0.0;
    let mut fill_area = 0.0;
    let cell_area = grid_spacing * grid_spacing;

    let mut x = min_x;
    while x <= max_x {
        let mut y = min_y;
        while y <= max_y {
            let existing_z = existing.elevation_at(x, y);
            let design_z = design.elevation_at(x, y);

            if let (Some(ez), Some(dz)) = (existing_z, design_z) {
                let diff = dz - ez;
                if diff > 0.0 {
                    fill_volume += diff * cell_area;
                    fill_area += cell_area;
                } else if diff < 0.0 {
                    cut_volume += (-diff) * cell_area;
                    cut_area += cell_area;
                }
            }
            y += grid_spacing;
        }
        x += grid_spacing;
    }

    VolumeResult {
        cut_volume,
        fill_volume,
        net_volume: fill_volume - cut_volume,
        cut_area,
        fill_area,
    }
}

/// Compute volumes using the average end area method from cross sections.
/// Each section is a tuple of (station, cut_area, fill_area).
pub fn average_end_area_volume(sections: &[(f64, f64, f64)]) -> VolumeResult {
    let mut cut_volume = 0.0;
    let mut fill_volume = 0.0;
    let mut total_cut_area = 0.0;
    let mut total_fill_area = 0.0;

    for window in sections.windows(2) {
        let (s1, cut1, fill1) = window[0];
        let (s2, cut2, fill2) = window[1];
        let dist = (s2 - s1).abs();

        cut_volume += (cut1 + cut2) / 2.0 * dist;
        fill_volume += (fill1 + fill2) / 2.0 * dist;
        total_cut_area += (cut1 + cut2) / 2.0;
        total_fill_area += (fill1 + fill2) / 2.0;
    }

    VolumeResult {
        cut_volume,
        fill_volume,
        net_volume: fill_volume - cut_volume,
        cut_area: total_cut_area,
        fill_area: total_fill_area,
    }
}

/// Compute volume between a surface and a reference elevation (datum).
pub fn surface_to_datum_volume(surface: &Surface, datum: f64, grid_spacing: f64) -> VolumeResult {
    let (min_x, max_x, min_y, max_y) = surface_extent(surface);

    let mut cut_volume = 0.0;
    let mut fill_volume = 0.0;
    let mut cut_area = 0.0;
    let mut fill_area = 0.0;
    let cell_area = grid_spacing * grid_spacing;

    let mut x = min_x;
    while x <= max_x {
        let mut y = min_y;
        while y <= max_y {
            if let Some(z) = surface.elevation_at(x, y) {
                let diff = z - datum;
                if diff > 0.0 {
                    cut_volume += diff * cell_area;
                    cut_area += cell_area;
                } else if diff < 0.0 {
                    fill_volume += (-diff) * cell_area;
                    fill_area += cell_area;
                }
            }
            y += grid_spacing;
        }
        x += grid_spacing;
    }

    VolumeResult {
        cut_volume,
        fill_volume,
        net_volume: cut_volume - fill_volume,
        cut_area,
        fill_area,
    }
}

fn surface_extent(surface: &Surface) -> (f64, f64, f64, f64) {
    let mut min_x = f64::MAX;
    let mut max_x = f64::MIN;
    let mut min_y = f64::MAX;
    let mut max_y = f64::MIN;

    for p in &surface.points {
        min_x = min_x.min(p.x);
        max_x = max_x.max(p.x);
        min_y = min_y.min(p.y);
        max_y = max_y.max(p.y);
    }

    (min_x, max_x, min_y, max_y)
}

fn common_extent(a: &Surface, b: &Surface) -> (f64, f64, f64, f64) {
    let (a_min_x, a_max_x, a_min_y, a_max_y) = surface_extent(a);
    let (b_min_x, b_max_x, b_min_y, b_max_y) = surface_extent(b);

    (
        a_min_x.max(b_min_x),
        a_max_x.min(b_max_x),
        a_min_y.max(b_min_y),
        a_max_y.min(b_max_y),
    )
}
