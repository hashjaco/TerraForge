use serde::Serialize;
use crate::engine::validation::{self, ValidationIssue, Severity};
use super::project;

#[derive(Debug, Serialize)]
pub struct ValidationResponse {
    pub issues: Vec<ValidationIssueResponse>,
    pub error_count: usize,
    pub warning_count: usize,
    pub info_count: usize,
}

#[derive(Debug, Serialize)]
pub struct ValidationIssueResponse {
    pub object_id: String,
    pub severity: String,
    pub category: String,
    pub message: String,
    pub station: Option<f64>,
}

#[tauri::command]
pub fn validate_project() -> Result<ValidationResponse, String> {
    let standards = project().design_standards.read().clone();
    let mut all_issues: Vec<ValidationIssue> = Vec::new();

    // Validate pipe networks
    {
        let networks = project().pipe_networks.read();
        let surfaces = project().surfaces.read();
        let first_surface = surfaces.values().next();

        for network in networks.values() {
            let issues = validation::validate_pipe_network(network, first_surface, &standards);
            all_issues.extend(issues);
        }
    }

    // Validate alignments
    {
        let alignments = project().alignments.read();
        for alignment in alignments.values() {
            let issues = validation::validate_alignment(alignment, &standards, 60.0);
            all_issues.extend(issues);
        }
    }

    // Validate profiles
    {
        let profiles = project().profiles.read();
        for profile in profiles.values() {
            let issues = validation::validate_profile(profile, &standards);
            all_issues.extend(issues);
        }
    }

    let error_count = all_issues.iter().filter(|i| i.severity == Severity::Error).count();
    let warning_count = all_issues.iter().filter(|i| i.severity == Severity::Warning).count();
    let info_count = all_issues.iter().filter(|i| i.severity == Severity::Info).count();

    Ok(ValidationResponse {
        issues: all_issues.iter().map(|i| ValidationIssueResponse {
            object_id: i.object_id.to_string(),
            severity: format!("{:?}", i.severity),
            category: i.category.clone(),
            message: i.message.clone(),
            station: i.station,
        }).collect(),
        error_count,
        warning_count,
        info_count,
    })
}

#[tauri::command]
pub fn validate_pipe_network(id: String) -> Result<ValidationResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let networks = project().pipe_networks.read();
    let network = networks.get(&uuid).ok_or("Pipe network not found")?;
    let standards = project().design_standards.read().clone();

    let surfaces = project().surfaces.read();
    let first_surface = surfaces.values().next();

    let issues = validation::validate_pipe_network(network, first_surface, &standards);

    let error_count = issues.iter().filter(|i| i.severity == Severity::Error).count();
    let warning_count = issues.iter().filter(|i| i.severity == Severity::Warning).count();
    let info_count = issues.iter().filter(|i| i.severity == Severity::Info).count();

    Ok(ValidationResponse {
        issues: issues.iter().map(|i| ValidationIssueResponse {
            object_id: i.object_id.to_string(),
            severity: format!("{:?}", i.severity),
            category: i.category.clone(),
            message: i.message.clone(),
            station: i.station,
        }).collect(),
        error_count,
        warning_count,
        info_count,
    })
}
