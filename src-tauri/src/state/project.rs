use std::collections::HashMap;

use parking_lot::RwLock;
use uuid::Uuid;

use crate::engine::alignment::Alignment;
use crate::engine::corridor::Corridor;
use crate::engine::crs::ProjectCrs;
use crate::engine::drainage::{Catchment, Channel, Pond, UndergroundStorage};
use crate::engine::grading::{FeatureLine, GradingGroup, GradingObject};
use crate::engine::intersection::Intersection;
use crate::engine::parcel::{Parcel, Site};
use crate::engine::pipe_network::PipeNetwork;
use crate::engine::pressure_network::PressureNetwork;
use crate::engine::profile::Profile;
use crate::engine::surface::Surface;
use crate::engine::survey::SurveyDatabase;
use crate::engine::validation::DesignStandards;
use crate::graph::DepGraph;

/// Central project state holding all civil objects and the dependency graph.
pub struct ProjectState {
    pub name: String,
    pub surfaces: RwLock<HashMap<Uuid, Surface>>,
    pub alignments: RwLock<HashMap<Uuid, Alignment>>,
    pub profiles: RwLock<HashMap<Uuid, Profile>>,
    pub corridors: RwLock<HashMap<Uuid, Corridor>>,
    pub pipe_networks: RwLock<HashMap<Uuid, PipeNetwork>>,
    pub feature_lines: RwLock<HashMap<Uuid, FeatureLine>>,
    pub grading_objects: RwLock<HashMap<Uuid, GradingObject>>,
    pub grading_groups: RwLock<HashMap<Uuid, GradingGroup>>,
    pub parcels: RwLock<HashMap<Uuid, Parcel>>,
    pub sites: RwLock<HashMap<Uuid, Site>>,
    pub survey_databases: RwLock<HashMap<Uuid, SurveyDatabase>>,
    pub catchments: RwLock<HashMap<Uuid, Catchment>>,
    pub channels: RwLock<HashMap<Uuid, Channel>>,
    pub ponds: RwLock<HashMap<Uuid, Pond>>,
    pub underground_storage: RwLock<HashMap<Uuid, UndergroundStorage>>,
    pub pressure_networks: RwLock<HashMap<Uuid, PressureNetwork>>,
    pub intersections: RwLock<HashMap<Uuid, Intersection>>,
    pub graph: RwLock<DepGraph>,
    pub crs: RwLock<ProjectCrs>,
    pub design_standards: RwLock<DesignStandards>,
}

impl ProjectState {
    pub fn new(name: String) -> Self {
        Self {
            name,
            surfaces: RwLock::new(HashMap::new()),
            alignments: RwLock::new(HashMap::new()),
            profiles: RwLock::new(HashMap::new()),
            corridors: RwLock::new(HashMap::new()),
            pipe_networks: RwLock::new(HashMap::new()),
            feature_lines: RwLock::new(HashMap::new()),
            grading_objects: RwLock::new(HashMap::new()),
            grading_groups: RwLock::new(HashMap::new()),
            parcels: RwLock::new(HashMap::new()),
            sites: RwLock::new(HashMap::new()),
            survey_databases: RwLock::new(HashMap::new()),
            catchments: RwLock::new(HashMap::new()),
            channels: RwLock::new(HashMap::new()),
            ponds: RwLock::new(HashMap::new()),
            underground_storage: RwLock::new(HashMap::new()),
            pressure_networks: RwLock::new(HashMap::new()),
            intersections: RwLock::new(HashMap::new()),
            graph: RwLock::new(DepGraph::new()),
            crs: RwLock::new(ProjectCrs::default()),
            design_standards: RwLock::new(DesignStandards::default()),
        }
    }
}

impl Default for ProjectState {
    fn default() -> Self {
        Self::new("Untitled Project".into())
    }
}
