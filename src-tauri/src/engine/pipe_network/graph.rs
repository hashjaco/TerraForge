use std::collections::{HashMap, HashSet, VecDeque};
use uuid::Uuid;

use super::PipeNetwork;

/// Analyze the pipe network topology.
pub fn find_connected_components(network: &PipeNetwork) -> Vec<Vec<Uuid>> {
    let mut adjacency: HashMap<Uuid, Vec<Uuid>> = HashMap::new();
    for node in &network.nodes {
        adjacency.entry(node.id).or_default();
    }
    for pipe in &network.pipes {
        adjacency.entry(pipe.start_node_id).or_default().push(pipe.end_node_id);
        adjacency.entry(pipe.end_node_id).or_default().push(pipe.start_node_id);
    }

    let mut visited = HashSet::new();
    let mut components = Vec::new();

    for &node_id in adjacency.keys() {
        if visited.contains(&node_id) {
            continue;
        }

        let mut component = Vec::new();
        let mut queue = VecDeque::new();
        queue.push_back(node_id);
        visited.insert(node_id);

        while let Some(current) = queue.pop_front() {
            component.push(current);
            if let Some(neighbors) = adjacency.get(&current) {
                for &neighbor in neighbors {
                    if visited.insert(neighbor) {
                        queue.push_back(neighbor);
                    }
                }
            }
        }

        components.push(component);
    }

    components
}

/// Trace the downstream path from a node.
pub fn trace_downstream(network: &PipeNetwork, start_node_id: Uuid) -> Vec<Uuid> {
    let mut path = vec![start_node_id];
    let mut current = start_node_id;
    let mut visited = HashSet::new();
    visited.insert(current);

    loop {
        let downstream = network
            .pipes
            .iter()
            .find(|p| p.start_node_id == current && !visited.contains(&p.end_node_id));

        match downstream {
            Some(pipe) => {
                visited.insert(pipe.end_node_id);
                path.push(pipe.end_node_id);
                current = pipe.end_node_id;
            }
            None => break,
        }
    }

    path
}
