/// Calculate minimum pipe diameter for a given design flow using Manning's equation.
/// Assumes full-flow, circular pipe.
/// Q = (1/n) * (pi*D²/4) * (D/4)^(2/3) * S^(1/2)
/// Solving for D: D = ((Q * n * 4^(5/3)) / (pi * S^(1/2)))^(3/8)  (approximately)
pub fn minimum_diameter(design_flow: f64, slope: f64, mannings_n: f64) -> f64 {
    if design_flow <= 0.0 || slope <= 0.0 || mannings_n <= 0.0 {
        return 0.0;
    }

    let numerator = design_flow * mannings_n * 4.0_f64.powf(5.0 / 3.0);
    let denominator = std::f64::consts::PI * slope.sqrt();

    (numerator / denominator).powf(3.0 / 8.0)
}

/// Standard pipe sizes in meters.
pub const STANDARD_SIZES: &[f64] = &[
    0.150, 0.200, 0.250, 0.300, 0.375, 0.450, 0.525, 0.600, 0.675, 0.750, 0.900, 1.050, 1.200,
    1.350, 1.500, 1.650, 1.800, 2.100, 2.400,
];

/// Select the next standard pipe size >= the minimum required diameter.
pub fn select_standard_size(min_diameter: f64) -> f64 {
    for &size in STANDARD_SIZES {
        if size >= min_diameter {
            return size;
        }
    }
    *STANDARD_SIZES.last().unwrap_or(&min_diameter)
}
