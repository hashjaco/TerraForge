pub mod ai;
pub mod alignment;
pub mod corridor;
pub mod drainage;
pub mod grading;
pub mod intersection;
pub mod parcel;
pub mod pipe_network;
pub mod pressure_network;
pub mod profile;
pub mod surface;
pub mod survey;
pub mod validation;

use crate::state::ProjectState;
use once_cell::sync::Lazy;

static PROJECT: Lazy<ProjectState> = Lazy::new(ProjectState::default);

pub fn project() -> &'static ProjectState {
    &PROJECT
}
