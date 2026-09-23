use std::collections::{HashMap, HashSet, VecDeque};

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::engine::ObjectType;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepNode {
    pub id: Uuid,
    pub object_type: ObjectType,
    pub name: String,
    pub dirty: bool,
    pub version: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepGraph {
    pub nodes: HashMap<Uuid, DepNode>,
    /// Edges: key depends on each value in the set
    pub dependencies: HashMap<Uuid, HashSet<Uuid>>,
    /// Reverse edges: key is depended upon by each value in the set
    pub dependents: HashMap<Uuid, HashSet<Uuid>>,
}

impl DepGraph {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            dependencies: HashMap::new(),
            dependents: HashMap::new(),
        }
    }

    pub fn add_node(&mut self, id: Uuid, object_type: ObjectType, name: String) {
        self.nodes.insert(
            id,
            DepNode {
                id,
                object_type,
                name,
                dirty: false,
                version: 0,
            },
        );
        self.dependencies.entry(id).or_default();
        self.dependents.entry(id).or_default();
    }

    pub fn remove_node(&mut self, id: Uuid) {
        if let Some(deps) = self.dependencies.remove(&id) {
            for dep in deps {
                if let Some(set) = self.dependents.get_mut(&dep) {
                    set.remove(&id);
                }
            }
        }
        if let Some(depnts) = self.dependents.remove(&id) {
            for dep in depnts {
                if let Some(set) = self.dependencies.get_mut(&dep) {
                    set.remove(&id);
                }
            }
        }
        self.nodes.remove(&id);
    }

    /// Add an edge: `dependent` depends on `dependency`.
    pub fn add_edge(&mut self, dependent: Uuid, dependency: Uuid) -> Result<(), &'static str> {
        if self.would_create_cycle(dependent, dependency) {
            return Err("Adding this dependency would create a cycle");
        }

        self.dependencies.entry(dependent).or_default().insert(dependency);
        self.dependents.entry(dependency).or_default().insert(dependent);
        Ok(())
    }

    pub fn remove_edge(&mut self, dependent: Uuid, dependency: Uuid) {
        if let Some(set) = self.dependencies.get_mut(&dependent) {
            set.remove(&dependency);
        }
        if let Some(set) = self.dependents.get_mut(&dependency) {
            set.remove(&dependent);
        }
    }

    /// Check if adding an edge would create a cycle.
    fn would_create_cycle(&self, dependent: Uuid, dependency: Uuid) -> bool {
        if dependent == dependency {
            return true;
        }
        // Check if `dependent` is reachable from `dependency` via existing edges
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        queue.push_back(dependent);

        while let Some(current) = queue.pop_front() {
            if current == dependency {
                return false; // this direction is fine
            }
            if !visited.insert(current) {
                continue;
            }
            if let Some(deps) = self.dependents.get(&current) {
                for &dep in deps {
                    queue.push_back(dep);
                }
            }
        }

        // Check reverse: can we reach `dependent` from `dependency`?
        visited.clear();
        queue.push_back(dependency);
        while let Some(current) = queue.pop_front() {
            if current == dependent {
                return true;
            }
            if !visited.insert(current) {
                continue;
            }
            if let Some(deps) = self.dependents.get(&current) {
                for &dep in deps {
                    queue.push_back(dep);
                }
            }
        }

        false
    }

    /// Topological sort of all nodes.
    pub fn topological_sort(&self) -> Vec<Uuid> {
        let mut in_degree: HashMap<Uuid, usize> = HashMap::new();
        for &id in self.nodes.keys() {
            in_degree.insert(id, 0);
        }
        for (id, deps) in &self.dependencies {
            in_degree.insert(*id, deps.len());
        }

        let mut queue: VecDeque<Uuid> = in_degree
            .iter()
            .filter(|(_, &deg)| deg == 0)
            .map(|(&id, _)| id)
            .collect();

        let mut sorted = Vec::new();

        while let Some(id) = queue.pop_front() {
            sorted.push(id);
            if let Some(deps) = self.dependents.get(&id) {
                for &dep in deps {
                    if let Some(deg) = in_degree.get_mut(&dep) {
                        *deg = deg.saturating_sub(1);
                        if *deg == 0 {
                            queue.push_back(dep);
                        }
                    }
                }
            }
        }

        sorted
    }

    /// Get all nodes that depend on the given node (directly or transitively).
    pub fn get_all_dependents(&self, id: Uuid) -> Vec<Uuid> {
        let mut result = Vec::new();
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();

        if let Some(deps) = self.dependents.get(&id) {
            for &dep in deps {
                queue.push_back(dep);
            }
        }

        while let Some(current) = queue.pop_front() {
            if !visited.insert(current) {
                continue;
            }
            result.push(current);
            if let Some(deps) = self.dependents.get(&current) {
                for &dep in deps {
                    if !visited.contains(&dep) {
                        queue.push_back(dep);
                    }
                }
            }
        }

        result
    }

    /// Get the direct dependencies of a node.
    pub fn get_dependencies(&self, id: Uuid) -> Vec<Uuid> {
        self.dependencies
            .get(&id)
            .map(|s| s.iter().copied().collect())
            .unwrap_or_default()
    }

    /// Get the direct dependents of a node.
    pub fn get_direct_dependents(&self, id: Uuid) -> Vec<Uuid> {
        self.dependents
            .get(&id)
            .map(|s| s.iter().copied().collect())
            .unwrap_or_default()
    }

    /// Serialize the graph for the frontend.
    pub fn to_frontend_graph(&self) -> FrontendGraph {
        let nodes: Vec<FrontendNode> = self
            .nodes
            .values()
            .map(|n| FrontendNode {
                id: n.id.to_string(),
                name: n.name.clone(),
                object_type: format!("{:?}", n.object_type),
                dirty: n.dirty,
                version: n.version,
                dependencies: self.get_dependencies(n.id).iter().map(|d| d.to_string()).collect(),
                dependents: self.get_direct_dependents(n.id).iter().map(|d| d.to_string()).collect(),
            })
            .collect();

        FrontendGraph { nodes }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct FrontendNode {
    pub id: String,
    pub name: String,
    pub object_type: String,
    pub dirty: bool,
    pub version: u64,
    pub dependencies: Vec<String>,
    pub dependents: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FrontendGraph {
    pub nodes: Vec<FrontendNode>,
}
