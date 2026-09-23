use super::PipeSegment;

/// Manning's equation for gravity pipe flow capacity (Q in m³/s).
/// Q = (1/n) * A * R^(2/3) * S^(1/2)
/// For a full-flow circular pipe:
///   A = pi * D² / 4
///   R = D / 4
pub fn mannings_full_flow(pipe: &PipeSegment, mannings_n: f64) -> f64 {
    let d = pipe.diameter;
    let s = pipe.slope.abs();

    if s < 1e-12 || d < 1e-12 || mannings_n < 1e-12 {
        return 0.0;
    }

    let area = std::f64::consts::PI * d * d / 4.0;
    let hydraulic_radius = d / 4.0;

    (1.0 / mannings_n) * area * hydraulic_radius.powf(2.0 / 3.0) * s.sqrt()
}

/// Calculate flow velocity for full-flow conditions (m/s).
pub fn flow_velocity(pipe: &PipeSegment, mannings_n: f64) -> f64 {
    let d = pipe.diameter;
    let s = pipe.slope.abs();

    if s < 1e-12 || d < 1e-12 || mannings_n < 1e-12 {
        return 0.0;
    }

    let hydraulic_radius = d / 4.0;
    (1.0 / mannings_n) * hydraulic_radius.powf(2.0 / 3.0) * s.sqrt()
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PipeHydraulics {
    pub pipe_id: uuid::Uuid,
    pub capacity: f64,
    pub velocity: f64,
    pub is_adequate: bool,
}

/// Analyze hydraulics for a single pipe.
pub fn analyze_pipe(pipe: &PipeSegment, mannings_n: f64, design_flow: f64) -> PipeHydraulics {
    let capacity = mannings_full_flow(pipe, mannings_n);
    let velocity = flow_velocity(pipe, mannings_n);

    PipeHydraulics {
        pipe_id: pipe.id,
        capacity,
        velocity,
        is_adequate: capacity >= design_flow,
    }
}
