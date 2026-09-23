use crate::engine::alignment::horizontal;
use crate::engine::alignment::Alignment;
use crate::engine::profile::Profile;
use crate::engine::Point3;

use super::template::{Side, Template};
use super::Corridor;

/// Build the corridor mesh by sweeping the template along the alignment+profile.
pub fn build_corridor_mesh(
    corridor: &mut Corridor,
    alignment: &Alignment,
    profile: &Profile,
) {
    let total_length = alignment.total_length();
    let mut stations: Vec<f64> = Vec::new();
    let mut s = 0.0;
    while s <= total_length {
        stations.push(s);
        s += corridor.frequency;
    }
    if stations.last().map_or(true, |&last| (last - total_length).abs() > 1e-6) {
        stations.push(total_length);
    }

    let mut all_vertices: Vec<Point3> = Vec::new();
    let mut all_indices: Vec<[u32; 3]> = Vec::new();

    let mut prev_section: Option<Vec<Point3>> = None;

    for &station in &stations {
        let template = find_template_at_station(corridor, station);
        let elevation = profile.elevation_at(station);

        let (center_pos, direction) = alignment_point_and_direction(alignment, station);

        let section = generate_cross_section(
            &template,
            center_pos.x,
            center_pos.y,
            elevation,
            direction,
        );

        if let Some(ref prev) = prev_section {
            let base = all_vertices.len() as u32;
            let n = section.len() as u32;

            all_vertices.extend_from_slice(prev);
            all_vertices.extend_from_slice(&section);

            for i in 0..n - 1 {
                let p0 = base + i;
                let p1 = base + i + 1;
                let p2 = base + n + i;
                let p3 = base + n + i + 1;

                all_indices.push([p0, p2, p1]);
                all_indices.push([p1, p2, p3]);
            }
        }

        prev_section = Some(section);
    }

    corridor.mesh_vertices = all_vertices;
    corridor.mesh_indices = all_indices;
}

fn find_template_at_station(corridor: &Corridor, station: f64) -> Template {
    let mut best = None;
    for assignment in &corridor.template_assignments {
        if assignment.station <= station {
            best = Some(&assignment.template);
        }
    }
    best.cloned().unwrap_or_else(Template::basic_road)
}

fn alignment_point_and_direction(
    alignment: &Alignment,
    station: f64,
) -> (crate::engine::Point2, f64) {
    let mut cumulative = 0.0;

    for segment in &alignment.segments {
        let seg_len = horizontal::segment_length(segment);
        if station <= cumulative + seg_len + 1e-10 {
            let local_dist = (station - cumulative).max(0.0);
            let pt = horizontal::point_at_distance(segment, local_dist)
                .unwrap_or(crate::engine::Point2::new(0.0, 0.0));
            let dir = horizontal::direction_at_distance(segment, local_dist);
            return (pt, dir);
        }
        cumulative += seg_len;
    }

    if let Some(last) = alignment.segments.last() {
        let len = horizontal::segment_length(last);
        let pt = horizontal::point_at_distance(last, len)
            .unwrap_or(crate::engine::Point2::new(0.0, 0.0));
        let dir = horizontal::direction_at_distance(last, len);
        (pt, dir)
    } else {
        (crate::engine::Point2::new(0.0, 0.0), 0.0)
    }
}

fn generate_cross_section(
    template: &Template,
    center_x: f64,
    center_y: f64,
    center_z: f64,
    direction: f64,
) -> Vec<Point3> {
    let perp = direction + std::f64::consts::FRAC_PI_2;
    let cos_p = perp.cos();
    let sin_p = perp.sin();

    let mut left_points: Vec<(f64, f64)> = Vec::new();
    let mut right_points: Vec<(f64, f64)> = Vec::new();

    let mut left_offset = 0.0_f64;
    let mut left_elev = 0.0_f64;
    let mut right_offset = 0.0_f64;
    let mut right_elev = 0.0_f64;

    for elem in &template.elements {
        match elem.side {
            Side::Left => {
                left_points.push((left_offset, left_elev));
                let (new_off, delta_e) = elem.cross_section_point(left_offset);
                left_offset = new_off;
                left_elev += delta_e;
            }
            Side::Right => {
                right_points.push((right_offset, right_elev));
                let (new_off, delta_e) = elem.cross_section_point(right_offset);
                right_offset = new_off;
                right_elev += delta_e;
            }
        }
    }

    left_points.push((left_offset, left_elev));
    right_points.push((right_offset, right_elev));

    left_points.reverse();

    let mut section_points = Vec::new();
    for (offset, elev) in left_points.iter().chain(right_points.iter()) {
        section_points.push(Point3::new(
            center_x + offset * cos_p,
            center_y + offset * sin_p,
            center_z + elev,
        ));
    }

    section_points
}
