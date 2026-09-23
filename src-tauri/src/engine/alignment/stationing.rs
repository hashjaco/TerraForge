use super::{horizontal, Alignment};

pub struct StationInfo {
    pub station: f64,
    pub segment_index: usize,
    pub distance_in_segment: f64,
}

/// Convert a station value to a segment index + distance within that segment.
pub fn station_to_segment(alignment: &Alignment, station: f64) -> Option<StationInfo> {
    let mut cumulative = 0.0;

    for (i, segment) in alignment.segments.iter().enumerate() {
        let seg_len = horizontal::segment_length(segment);
        if station <= cumulative + seg_len + 1e-10 {
            return Some(StationInfo {
                station,
                segment_index: i,
                distance_in_segment: (station - cumulative).max(0.0),
            });
        }
        cumulative += seg_len;
    }

    None
}

/// Get an array of station values at a given interval along the entire alignment.
pub fn generate_stations(alignment: &Alignment, interval: f64) -> Vec<f64> {
    let total = alignment.total_length();
    let mut stations = Vec::new();
    let mut s = 0.0;

    while s <= total {
        stations.push(s);
        s += interval;
    }

    if stations.last().map_or(true, |&last| (last - total).abs() > 1e-6) {
        stations.push(total);
    }

    stations
}
