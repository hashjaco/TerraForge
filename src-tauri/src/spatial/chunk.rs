use crate::engine::Point3;

use super::rtree::BoundingBox;

#[derive(Debug, Clone)]
pub struct Chunk {
    pub x: i32,
    pub y: i32,
    pub bounds: BoundingBox,
    pub point_indices: Vec<usize>,
    pub loaded: bool,
}

/// Manages spatial partitioning of large point sets into grid-based chunks.
#[derive(Debug)]
pub struct ChunkManager {
    pub chunk_size: f64,
    pub chunks: Vec<Chunk>,
}

impl ChunkManager {
    pub fn new(chunk_size: f64) -> Self {
        Self {
            chunk_size,
            chunks: Vec::new(),
        }
    }

    /// Partition points into spatial chunks.
    pub fn build_from_points(&mut self, points: &[Point3]) {
        self.chunks.clear();

        if points.is_empty() {
            return;
        }

        let mut min_x = f64::MAX;
        let mut min_y = f64::MAX;
        let mut max_x = f64::MIN;
        let mut max_y = f64::MIN;

        for p in points {
            min_x = min_x.min(p.x);
            min_y = min_y.min(p.y);
            max_x = max_x.max(p.x);
            max_y = max_y.max(p.y);
        }

        let cols = ((max_x - min_x) / self.chunk_size).ceil() as i32 + 1;
        let rows = ((max_y - min_y) / self.chunk_size).ceil() as i32 + 1;

        let mut chunk_map: std::collections::HashMap<(i32, i32), Vec<usize>> =
            std::collections::HashMap::new();

        for (i, p) in points.iter().enumerate() {
            let cx = ((p.x - min_x) / self.chunk_size).floor() as i32;
            let cy = ((p.y - min_y) / self.chunk_size).floor() as i32;
            chunk_map.entry((cx, cy)).or_default().push(i);
        }

        for cy in 0..rows {
            for cx in 0..cols {
                if let Some(indices) = chunk_map.get(&(cx, cy)) {
                    self.chunks.push(Chunk {
                        x: cx,
                        y: cy,
                        bounds: BoundingBox::new(
                            min_x + cx as f64 * self.chunk_size,
                            min_y + cy as f64 * self.chunk_size,
                            min_x + (cx + 1) as f64 * self.chunk_size,
                            min_y + (cy + 1) as f64 * self.chunk_size,
                        ),
                        point_indices: indices.clone(),
                        loaded: true,
                    });
                }
            }
        }
    }

    pub fn get_visible_chunks(&self, viewport: &BoundingBox) -> Vec<&Chunk> {
        self.chunks
            .iter()
            .filter(|c| c.bounds.intersects(viewport))
            .collect()
    }

    pub fn chunk_count(&self) -> usize {
        self.chunks.len()
    }
}
