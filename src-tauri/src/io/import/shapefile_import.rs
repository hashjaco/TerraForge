use crate::engine::{Point2, Point3};

/// Import point data from a GeoJSON string.
pub fn import_geojson_points(content: &str) -> Result<Vec<Point3>, String> {
    let geojson: serde_json::Value =
        serde_json::from_str(content).map_err(|e| format!("Invalid GeoJSON: {}", e))?;

    let mut points = Vec::new();

    let features = geojson
        .get("features")
        .and_then(|f| f.as_array())
        .ok_or("No features array found")?;

    for feature in features {
        let geometry = feature.get("geometry").ok_or("Feature missing geometry")?;
        let geo_type = geometry
            .get("type")
            .and_then(|t| t.as_str())
            .unwrap_or("");
        let coordinates = geometry.get("coordinates");

        match geo_type {
            "Point" => {
                if let Some(coords) = coordinates.and_then(|c| c.as_array()) {
                    let x = coords.first().and_then(|v| v.as_f64()).unwrap_or(0.0);
                    let y = coords.get(1).and_then(|v| v.as_f64()).unwrap_or(0.0);
                    let z = coords.get(2).and_then(|v| v.as_f64()).unwrap_or(0.0);
                    points.push(Point3::new(x, y, z));
                }
            }
            "MultiPoint" => {
                if let Some(coord_arrays) = coordinates.and_then(|c| c.as_array()) {
                    for coord in coord_arrays {
                        if let Some(c) = coord.as_array() {
                            let x = c.first().and_then(|v| v.as_f64()).unwrap_or(0.0);
                            let y = c.get(1).and_then(|v| v.as_f64()).unwrap_or(0.0);
                            let z = c.get(2).and_then(|v| v.as_f64()).unwrap_or(0.0);
                            points.push(Point3::new(x, y, z));
                        }
                    }
                }
            }
            _ => {}
        }
    }

    if points.is_empty() {
        Err("No point features found in GeoJSON".into())
    } else {
        Ok(points)
    }
}

/// Import polygon boundaries from GeoJSON (for parcels).
pub fn import_geojson_polygons(content: &str) -> Result<Vec<GeoJsonPolygon>, String> {
    let geojson: serde_json::Value =
        serde_json::from_str(content).map_err(|e| format!("Invalid GeoJSON: {}", e))?;

    let mut polygons = Vec::new();

    let features = geojson
        .get("features")
        .and_then(|f| f.as_array())
        .ok_or("No features array found")?;

    for feature in features {
        let geometry = feature.get("geometry").ok_or("Feature missing geometry")?;
        let geo_type = geometry
            .get("type")
            .and_then(|t| t.as_str())
            .unwrap_or("");
        let properties = feature.get("properties");
        let name = properties
            .and_then(|p| p.get("name"))
            .and_then(|n| n.as_str())
            .unwrap_or("Imported")
            .to_string();

        if geo_type == "Polygon" {
            if let Some(rings) = geometry.get("coordinates").and_then(|c| c.as_array()) {
                if let Some(outer_ring) = rings.first().and_then(|r| r.as_array()) {
                    let vertices: Vec<Point2> = outer_ring
                        .iter()
                        .filter_map(|coord| {
                            let c = coord.as_array()?;
                            let x = c.first()?.as_f64()?;
                            let y = c.get(1)?.as_f64()?;
                            Some(Point2::new(x, y))
                        })
                        .collect();

                    if vertices.len() >= 3 {
                        polygons.push(GeoJsonPolygon { name, vertices });
                    }
                }
            }
        }
    }

    if polygons.is_empty() {
        Err("No polygon features found in GeoJSON".into())
    } else {
        Ok(polygons)
    }
}

#[derive(Debug, Clone)]
pub struct GeoJsonPolygon {
    pub name: String,
    pub vertices: Vec<Point2>,
}
