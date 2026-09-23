use uuid::Uuid;

use super::dag::DepGraph;

/// Mark a node as dirty and propagate to all dependents.
/// Returns the list of dirty node IDs in topological order (for recomputation).
pub fn mark_dirty_and_propagate(graph: &mut DepGraph, changed_id: Uuid) -> Vec<Uuid> {
    if let Some(node) = graph.nodes.get_mut(&changed_id) {
        node.dirty = true;
        node.version += 1;
    }

    let dependents = graph.get_all_dependents(changed_id);
    for &dep_id in &dependents {
        if let Some(node) = graph.nodes.get_mut(&dep_id) {
            node.dirty = true;
        }
    }

    // Return in topological order
    let topo = graph.topological_sort();
    let mut dirty_set: std::collections::HashSet<Uuid> = dependents.into_iter().collect();
    dirty_set.insert(changed_id);

    topo.into_iter().filter(|id| dirty_set.contains(id)).collect()
}

/// Clear dirty flags for a set of nodes (after recomputation).
pub fn clear_dirty(graph: &mut DepGraph, ids: &[Uuid]) {
    for id in ids {
        if let Some(node) = graph.nodes.get_mut(id) {
            node.dirty = false;
        }
    }
}

/// Find independent groups of dirty nodes that can be processed in parallel.
/// Two dirty nodes are independent if neither depends on the other.
pub fn find_parallel_groups(graph: &DepGraph, dirty_ids: &[Uuid]) -> Vec<Vec<Uuid>> {
    let mut groups: Vec<Vec<Uuid>> = Vec::new();
    let mut assigned: std::collections::HashSet<Uuid> = std::collections::HashSet::new();

    for &id in dirty_ids {
        if assigned.contains(&id) {
            continue;
        }

        let deps = graph.get_dependencies(id);
        let has_unprocessed_dep = deps.iter().any(|d| dirty_ids.contains(d) && !assigned.contains(d));

        if has_unprocessed_dep {
            continue;
        }

        // Find all nodes at this "level" (no dirty dependencies remaining)
        let mut group = vec![id];
        assigned.insert(id);

        for &other in dirty_ids {
            if assigned.contains(&other) {
                continue;
            }
            let other_deps = graph.get_dependencies(other);
            let other_has_dep = other_deps.iter().any(|d| dirty_ids.contains(d) && !assigned.contains(d));
            if !other_has_dep {
                group.push(other);
                assigned.insert(other);
            }
        }

        groups.push(group);
    }

    // Add remaining nodes
    for &id in dirty_ids {
        if !assigned.contains(&id) {
            groups.push(vec![id]);
        }
    }

    groups
}
