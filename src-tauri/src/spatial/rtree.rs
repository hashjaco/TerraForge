use crate::engine::Point2;

#[derive(Debug, Clone)]
pub struct BoundingBox {
    pub min: Point2,
    pub max: Point2,
}

impl BoundingBox {
    pub fn new(min_x: f64, min_y: f64, max_x: f64, max_y: f64) -> Self {
        Self {
            min: Point2::new(min_x, min_y),
            max: Point2::new(max_x, max_y),
        }
    }

    pub fn contains(&self, point: &Point2) -> bool {
        point.x >= self.min.x
            && point.x <= self.max.x
            && point.y >= self.min.y
            && point.y <= self.max.y
    }

    pub fn intersects(&self, other: &BoundingBox) -> bool {
        self.min.x <= other.max.x
            && self.max.x >= other.min.x
            && self.min.y <= other.max.y
            && self.max.y >= other.min.y
    }

    pub fn expand_to_include(&mut self, point: &Point2) {
        self.min.x = self.min.x.min(point.x);
        self.min.y = self.min.y.min(point.y);
        self.max.x = self.max.x.max(point.x);
        self.max.y = self.max.y.max(point.y);
    }

    pub fn center(&self) -> Point2 {
        Point2::new(
            (self.min.x + self.max.x) / 2.0,
            (self.min.y + self.max.y) / 2.0,
        )
    }

    pub fn width(&self) -> f64 {
        self.max.x - self.min.x
    }

    pub fn height(&self) -> f64 {
        self.max.y - self.min.y
    }
}

/// Simple spatial index using a flat list with bounding-box queries.
/// For production, replace with a proper R-tree (e.g., `rstar` crate).
#[derive(Debug)]
pub struct SpatialIndex<T: Clone> {
    pub entries: Vec<(BoundingBox, T)>,
}

impl<T: Clone> SpatialIndex<T> {
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    pub fn insert(&mut self, bounds: BoundingBox, item: T) {
        self.entries.push((bounds, item));
    }

    pub fn query(&self, region: &BoundingBox) -> Vec<&T> {
        self.entries
            .iter()
            .filter(|(bb, _)| bb.intersects(region))
            .map(|(_, item)| item)
            .collect()
    }

    pub fn query_point(&self, point: &Point2) -> Vec<&T> {
        self.entries
            .iter()
            .filter(|(bb, _)| bb.contains(point))
            .map(|(_, item)| item)
            .collect()
    }

    pub fn clear(&mut self) {
        self.entries.clear();
    }
}
