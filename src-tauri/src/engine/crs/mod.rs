use serde::{Deserialize, Serialize};
use crate::engine::{Point2, Point3};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CoordinateSystem {
    pub name: String,
    pub epsg_code: u32,
    pub proj_string: String,
    pub units: LinearUnit,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum LinearUnit {
    Meters,
    Feet,
    UsSurveyFeet,
}

impl LinearUnit {
    pub fn to_meters(&self, value: f64) -> f64 {
        match self {
            LinearUnit::Meters => value,
            LinearUnit::Feet => value * 0.3048,
            LinearUnit::UsSurveyFeet => value * 0.304800609601,
        }
    }

    pub fn from_meters(&self, value: f64) -> f64 {
        match self {
            LinearUnit::Meters => value,
            LinearUnit::Feet => value / 0.3048,
            LinearUnit::UsSurveyFeet => value / 0.304800609601,
        }
    }
}

impl CoordinateSystem {
    pub fn wgs84() -> Self {
        Self {
            name: "WGS 84".into(),
            epsg_code: 4326,
            proj_string: "+proj=longlat +datum=WGS84 +no_defs".into(),
            units: LinearUnit::Meters,
        }
    }

    pub fn utm_zone(zone: u8, north: bool) -> Self {
        let hemisphere = if north { "+north" } else { "+south" };
        Self {
            name: format!("UTM Zone {}{}", zone, if north { "N" } else { "S" }),
            epsg_code: if north { 32600 + zone as u32 } else { 32700 + zone as u32 },
            proj_string: format!(
                "+proj=utm +zone={} {} +datum=WGS84 +units=m +no_defs",
                zone, hemisphere
            ),
            units: LinearUnit::Meters,
        }
    }

    pub fn state_plane(name: &str, epsg: u32, proj_string: &str) -> Self {
        Self {
            name: name.into(),
            epsg_code: epsg,
            proj_string: proj_string.into(),
            units: LinearUnit::UsSurveyFeet,
        }
    }
}

/// Transform a point from one CRS to another.
/// Uses a simplified approach; for full accuracy, integrate the `proj` crate's
/// runtime pipeline. This provides the command interface and data model.
pub fn transform_point(
    point: Point3,
    from: &CoordinateSystem,
    to: &CoordinateSystem,
) -> Result<Point3, String> {
    if from.epsg_code == to.epsg_code {
        return Ok(point);
    }

    // Convert to meters first
    let x_m = from.units.to_meters(point.x);
    let y_m = from.units.to_meters(point.y);

    // Convert to target units
    let x_out = to.units.from_meters(x_m);
    let y_out = to.units.from_meters(y_m);

    Ok(Point3::new(x_out, y_out, point.z))
}

/// Transform a batch of points between coordinate systems.
pub fn transform_points(
    points: &[Point3],
    from: &CoordinateSystem,
    to: &CoordinateSystem,
) -> Result<Vec<Point3>, String> {
    points.iter().map(|p| transform_point(*p, from, to)).collect()
}

/// Project settings for CRS
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectCrs {
    pub coordinate_system: CoordinateSystem,
    pub vertical_datum: String,
    pub local_origin: Option<Point2>,
    pub rotation: f64,
    pub scale_factor: f64,
}

impl Default for ProjectCrs {
    fn default() -> Self {
        Self {
            coordinate_system: CoordinateSystem::wgs84(),
            vertical_datum: "NAVD88".into(),
            local_origin: None,
            rotation: 0.0,
            scale_factor: 1.0,
        }
    }
}

/// Apply local coordinate transformation (translation, rotation, scale)
pub fn apply_local_transform(
    point: Point3,
    origin: &Point2,
    rotation_rad: f64,
    scale: f64,
) -> Point3 {
    let dx = point.x - origin.x;
    let dy = point.y - origin.y;
    let cos_r = rotation_rad.cos();
    let sin_r = rotation_rad.sin();
    Point3::new(
        (dx * cos_r - dy * sin_r) * scale + origin.x,
        (dx * sin_r + dy * cos_r) * scale + origin.y,
        point.z,
    )
}
