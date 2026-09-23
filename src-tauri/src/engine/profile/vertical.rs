use super::PVI;

/// Calculate the elevation at a given station along the profile defined by PVIs.
/// Handles vertical curves (parabolic) at PVI points.
pub fn elevation_at_station(pvis: &[PVI], station: f64) -> f64 {
    if pvis.is_empty() {
        return 0.0;
    }
    if pvis.len() == 1 {
        return pvis[0].elevation;
    }

    // Before first PVI: extend grade from first tangent
    if station <= pvis[0].station {
        let grade = tangent_grade(&pvis[0], &pvis[1]);
        return pvis[0].elevation + grade * (station - pvis[0].station);
    }

    // After last PVI: extend grade from last tangent
    if station >= pvis.last().unwrap().station {
        let n = pvis.len();
        let grade = tangent_grade(&pvis[n - 2], &pvis[n - 1]);
        return pvis[n - 1].elevation + grade * (station - pvis[n - 1].station);
    }

    // Find which segment the station falls in
    for i in 0..pvis.len() - 1 {
        let pvi_curr = &pvis[i];
        let pvi_next = &pvis[i + 1];

        if station >= pvi_curr.station && station <= pvi_next.station {
            let grade_in = if i > 0 {
                tangent_grade(&pvis[i - 1], pvi_curr)
            } else {
                tangent_grade(pvi_curr, pvi_next)
            };

            let grade_out = tangent_grade(pvi_curr, pvi_next);
            let half_curve = pvi_curr.curve_length / 2.0;

            let bvc_station = pvi_curr.station - half_curve;
            let evc_station = pvi_curr.station + half_curve;

            // Check if we're in the vertical curve zone around pvi_curr
            if pvi_curr.curve_length > 0.0 && station >= bvc_station && station <= evc_station {
                let bvc_elev = pvi_curr.elevation - grade_in * half_curve;
                let x = station - bvc_station;
                let a = (grade_out - grade_in) / (2.0 * pvi_curr.curve_length);
                return bvc_elev + grade_in * x + a * x * x;
            }

            // Otherwise on a tangent between PVIs
            return pvi_curr.elevation + grade_out * (station - pvi_curr.station);
        }
    }

    pvis.last().unwrap().elevation
}

fn tangent_grade(from: &PVI, to: &PVI) -> f64 {
    let ds = to.station - from.station;
    if ds.abs() < 1e-12 {
        return 0.0;
    }
    (to.elevation - from.elevation) / ds
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_linear_profile() {
        let pvis = vec![
            PVI { station: 0.0, elevation: 100.0, curve_length: 0.0 },
            PVI { station: 100.0, elevation: 105.0, curve_length: 0.0 },
        ];
        let elev = elevation_at_station(&pvis, 50.0);
        assert!((elev - 102.5).abs() < 1e-6);
    }
}
