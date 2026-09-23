use serde::{Deserialize, Serialize};

use crate::engine::alignment::Alignment;
use crate::engine::corridor::Corridor;
use crate::engine::pipe_network::PipeNetwork;
use crate::engine::profile::Profile;
use crate::engine::surface::{Surface, SurfaceAnalysis, Breakline, SurfaceBoundary, BoundaryType};
use crate::engine::surface::contour;
use crate::engine::surface::volume::{self, VolumeResult};
use crate::engine::surface::watershed;
use crate::engine::{ObjectType, Point2, Point3};

use super::project;

#[derive(Debug, Serialize, Deserialize)]
struct ProjectSaveData {
    surfaces: Vec<Surface>,
    alignments: Vec<Alignment>,
    profiles: Vec<Profile>,
    corridors: Vec<Corridor>,
    pipe_networks: Vec<PipeNetwork>,
}

#[derive(Debug, Serialize)]
pub struct SurfaceResponse {
    pub id: String,
    pub name: String,
    pub points: Vec<f64>,
    pub triangles: Vec<u32>,
    pub point_count: usize,
    pub triangle_count: usize,
}

#[derive(Debug, Deserialize)]
pub struct CreateSurfaceInput {
    pub name: String,
    pub points: Vec<[f64; 3]>,
    pub contour_interval: Option<f64>,
    pub breaklines: Option<Vec<BreaklineInput>>,
}

#[derive(Debug, Deserialize)]
pub struct BreaklineInput {
    pub name: String,
    pub point_indices: Vec<usize>,
}

#[tauri::command]
pub fn create_surface_from_points(input: CreateSurfaceInput) -> Result<SurfaceResponse, String> {
    let points: Vec<Point3> = input
        .points
        .iter()
        .map(|p| Point3::new(p[0], p[1], p[2]))
        .collect();

    let contour_interval = input.contour_interval.unwrap_or(1.0);

    let surface = if let Some(bl_inputs) = input.breaklines {
        let breaklines: Vec<Breakline> = bl_inputs
            .into_iter()
            .map(|b| Breakline {
                name: b.name,
                point_indices: b.point_indices,
            })
            .collect();
        Surface::from_points_with_breaklines(
            input.name,
            points,
            breaklines,
            contour_interval,
        )
    } else {
        Surface::from_points(input.name, points, contour_interval)
    };

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[derive(Debug, Deserialize)]
pub struct CreateGridSurfaceInput {
    pub name: String,
    pub min_x: f64,
    pub min_y: f64,
    pub max_x: f64,
    pub max_y: f64,
    pub resolution: f64,
    pub elevations: Vec<f64>,
    pub contour_interval: Option<f64>,
}

#[tauri::command]
pub fn create_grid_surface(input: CreateGridSurfaceInput) -> Result<SurfaceResponse, String> {
    let surface = Surface::from_grid(
        input.name,
        input.min_x,
        input.min_y,
        input.max_x,
        input.max_y,
        input.resolution,
        &input.elevations,
        input.contour_interval.unwrap_or(1.0),
    );

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[tauri::command]
pub fn get_surface_data(id: String) -> Result<SurfaceResponse, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    Ok(SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    })
}

#[derive(Debug, Deserialize)]
pub struct UpdatePointInput {
    pub surface_id: String,
    pub point_index: usize,
    pub position: [f64; 3],
}

#[tauri::command]
pub fn update_surface_point(input: UpdatePointInput) -> Result<SurfaceResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let mut surfaces = project().surfaces.write();
    let surface = surfaces.get_mut(&uuid).ok_or("Surface not found")?;

    surface.update_point(
        input.point_index,
        Point3::new(input.position[0], input.position[1], input.position[2]),
    );

    Ok(SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    })
}

#[derive(Debug, Deserialize)]
pub struct AddBreaklineInput {
    pub surface_id: String,
    pub name: String,
    pub point_indices: Vec<usize>,
}

#[tauri::command]
pub fn add_surface_breakline(input: AddBreaklineInput) -> Result<SurfaceResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let mut surfaces = project().surfaces.write();
    let surface = surfaces.get_mut(&uuid).ok_or("Surface not found")?;

    let breakline = Breakline {
        name: input.name,
        point_indices: input.point_indices,
    };
    surface.breaklines.push(breakline);
    surface.retrangulate();

    Ok(SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    })
}

#[derive(Debug, Deserialize)]
pub struct AddBoundaryInput {
    pub surface_id: String,
    pub boundary_type: String,
    pub vertices: Vec<[f64; 2]>,
}

#[tauri::command]
pub fn add_surface_boundary(input: AddBoundaryInput) -> Result<SurfaceResponse, String> {
    let uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let mut surfaces = project().surfaces.write();
    let surface = surfaces.get_mut(&uuid).ok_or("Surface not found")?;

    let boundary_type = match input.boundary_type.to_lowercase().as_str() {
        "outer" => BoundaryType::Outer,
        "hide" => BoundaryType::Hide,
        "show" => BoundaryType::Show,
        _ => return Err("Invalid boundary type. Use: outer, hide, or show".into()),
    };

    let vertices: Vec<Point2> = input.vertices.iter().map(|v| Point2::new(v[0], v[1])).collect();
    let boundary = SurfaceBoundary {
        boundary_type,
        vertices,
    };
    surface.add_boundary(boundary);

    Ok(SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    })
}

#[tauri::command]
pub fn analyze_surface(id: String) -> Result<SurfaceAnalysis, String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;
    Ok(surface.analyze())
}

#[derive(Debug, Serialize)]
pub struct ContourLineResponse {
    pub elevation: f64,
    pub vertices: Vec<f64>,
}

#[derive(Debug, Deserialize)]
pub struct GenerateContoursInput {
    pub surface_id: String,
    pub interval: f64,
}

#[tauri::command]
pub fn generate_contours(input: GenerateContoursInput) -> Result<Vec<ContourLineResponse>, String> {
    let uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    let analysis = surface.analyze();
    let contour_lines = contour::generate_contours(
        &surface.points,
        &surface.triangles,
        input.interval,
        analysis.min_elevation,
        analysis.max_elevation,
    );

    let response: Vec<ContourLineResponse> = contour_lines
        .into_iter()
        .map(|c| {
            let mut verts = Vec::with_capacity(c.vertices.len() * 2);
            for v in &c.vertices {
                verts.push(v.x);
                verts.push(v.y);
            }
            ContourLineResponse {
                elevation: c.elevation,
                vertices: verts,
            }
        })
        .collect();

    Ok(response)
}

// ---- Volume Calculations ----

#[derive(Debug, Deserialize)]
pub struct VolumeInput {
    pub existing_surface_id: String,
    pub design_surface_id: String,
    pub grid_spacing: Option<f64>,
}

#[tauri::command]
pub fn compute_volume(input: VolumeInput) -> Result<VolumeResult, String> {
    let existing_uuid = uuid::Uuid::parse_str(&input.existing_surface_id).map_err(|e| e.to_string())?;
    let design_uuid = uuid::Uuid::parse_str(&input.design_surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();

    let existing = surfaces.get(&existing_uuid).ok_or("Existing surface not found")?;
    let design = surfaces.get(&design_uuid).ok_or("Design surface not found")?;

    let spacing = input.grid_spacing.unwrap_or(1.0);
    Ok(volume::surface_to_surface_volume(existing, design, spacing))
}

#[derive(Debug, Deserialize)]
pub struct DatumVolumeInput {
    pub surface_id: String,
    pub datum: f64,
    pub grid_spacing: Option<f64>,
}

#[tauri::command]
pub fn compute_datum_volume(input: DatumVolumeInput) -> Result<VolumeResult, String> {
    let uuid = uuid::Uuid::parse_str(&input.surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    let spacing = input.grid_spacing.unwrap_or(1.0);
    Ok(volume::surface_to_datum_volume(surface, input.datum, spacing))
}

// ---- Watershed Analysis ----

#[derive(Debug, Serialize)]
pub struct WaterDropResponse {
    pub path: Vec<f64>,
}

#[tauri::command]
pub fn trace_water_drop(surface_id: String, x: f64, y: f64) -> Result<WaterDropResponse, String> {
    let uuid = uuid::Uuid::parse_str(&surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    let start = Point2::new(x, y);
    let path = watershed::trace_water_drop(start, &surface.points, &surface.triangles, 1000);

    let mut flat = Vec::with_capacity(path.path.len() * 2);
    for p in &path.path {
        flat.push(p.x);
        flat.push(p.y);
    }

    Ok(WaterDropResponse { path: flat })
}

#[derive(Debug, Serialize)]
pub struct WatershedResponse {
    pub regions: Vec<WatershedRegionResponse>,
}

#[derive(Debug, Serialize)]
pub struct WatershedRegionResponse {
    pub id: usize,
    pub area: f64,
    pub pour_point: [f64; 2],
    pub boundary: Vec<f64>,
}

#[tauri::command]
pub fn delineate_watersheds(surface_id: String) -> Result<WatershedResponse, String> {
    let uuid = uuid::Uuid::parse_str(&surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    let regions = watershed::delineate_watersheds(&surface.points, &surface.triangles);

    let response = WatershedResponse {
        regions: regions
            .into_iter()
            .map(|r| {
                let mut boundary_flat = Vec::with_capacity(r.boundary.len() * 2);
                for p in &r.boundary {
                    boundary_flat.push(p.x);
                    boundary_flat.push(p.y);
                }
                WatershedRegionResponse {
                    id: r.id,
                    area: r.area,
                    pour_point: [r.pour_point.x, r.pour_point.y],
                    boundary: boundary_flat,
                }
            })
            .collect(),
    };

    Ok(response)
}

// ---- Import/Export Commands ----

#[tauri::command]
pub fn import_dxf_file(content: String) -> Result<SurfaceResponse, String> {
    let points = crate::io::import::dxf::import_dxf(&content)?;
    let surface = Surface::from_points("DXF Import".into(), points, 1.0);

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[tauri::command]
pub fn export_dxf_file(surface_id: String) -> Result<String, String> {
    let uuid = uuid::Uuid::parse_str(&surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    Ok(crate::io::import::dxf::export_dxf(
        &surface.points,
        &surface.triangles,
        &[],
    ))
}

#[tauri::command]
pub fn import_landxml_file(content: String) -> Result<SurfaceResponse, String> {
    let data = crate::io::import::landxml::import_landxml(&content)?;
    let surface = if !data.faces.is_empty() {
        let mut s = Surface::from_points(
            if data.surface_name.is_empty() {
                "LandXML Import".into()
            } else {
                data.surface_name
            },
            data.points,
            1.0,
        );
        s.triangles = data.faces;
        s
    } else {
        Surface::from_points(
            if data.surface_name.is_empty() {
                "LandXML Import".into()
            } else {
                data.surface_name
            },
            data.points,
            1.0,
        )
    };

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[tauri::command]
pub fn export_landxml_file(surface_id: String) -> Result<String, String> {
    let uuid = uuid::Uuid::parse_str(&surface_id).map_err(|e| e.to_string())?;
    let surfaces = project().surfaces.read();
    let surface = surfaces.get(&uuid).ok_or("Surface not found")?;

    Ok(crate::io::import::landxml::export_landxml(
        &project().name,
        &surface.name,
        &surface.points,
        &surface.triangles,
        &[],
    ))
}

#[tauri::command]
pub fn import_geotiff_file(data: Vec<u8>) -> Result<SurfaceResponse, String> {
    let grid_data = crate::io::import::geotiff::import_geotiff(&data)?;
    let surface = Surface::from_grid(
        "GeoTIFF Import".into(),
        grid_data.xll,
        grid_data.yll,
        grid_data.xll + grid_data.ncols as f64 * grid_data.cellsize,
        grid_data.yll + grid_data.nrows as f64 * grid_data.cellsize,
        grid_data.cellsize,
        &grid_data.elevations,
        1.0,
    );

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[tauri::command]
pub fn import_geojson_file(content: String) -> Result<SurfaceResponse, String> {
    let points = crate::io::import::shapefile_import::import_geojson_points(&content)?;
    let surface = Surface::from_points("GeoJSON Import".into(), points, 1.0);

    let response = SurfaceResponse {
        id: surface.id.to_string(),
        name: surface.name.clone(),
        points: surface.flatten_points(),
        triangles: surface.flatten_triangles(),
        point_count: surface.points.len(),
        triangle_count: surface.triangles.len(),
    };

    let id = surface.id;
    {
        let mut graph = project().graph.write();
        graph.add_node(id, ObjectType::Surface, surface.name.clone());
    }
    project().surfaces.write().insert(id, surface);

    Ok(response)
}

#[tauri::command]
pub fn export_ifc_file() -> Result<String, String> {
    let surfaces = project().surfaces.read();
    let alignments = project().alignments.read();

    let surf_refs: Vec<&Surface> = surfaces.values().collect();
    let align_refs: Vec<&Alignment> = alignments.values().collect();

    Ok(crate::io::export::ifc::export_ifc(
        &project().name,
        &surf_refs,
        &align_refs,
    ))
}

// ---- Delete and Save/Load ----

#[tauri::command]
pub fn delete_object(id: String, object_type: String) -> Result<(), String> {
    let uuid = uuid::Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    {
        let mut graph = project().graph.write();
        graph.remove_node(uuid);
    }

    match object_type.as_str() {
        "surface" => { project().surfaces.write().remove(&uuid); }
        "alignment" => { project().alignments.write().remove(&uuid); }
        "profile" => { project().profiles.write().remove(&uuid); }
        "corridor" => { project().corridors.write().remove(&uuid); }
        "pipe-network" => { project().pipe_networks.write().remove(&uuid); }
        "feature-line" => { project().feature_lines.write().remove(&uuid); }
        "parcel" => { project().parcels.write().remove(&uuid); }
        "catchment" => { project().catchments.write().remove(&uuid); }
        "pressure-network" => { project().pressure_networks.write().remove(&uuid); }
        "intersection" => { project().intersections.write().remove(&uuid); }
        _ => return Err(format!("Unknown object type: {}", object_type)),
    }

    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ProjectSnapshot {
    pub name: String,
    pub surface_count: usize,
    pub alignment_count: usize,
    pub profile_count: usize,
    pub corridor_count: usize,
    pub pipe_network_count: usize,
}

#[tauri::command]
pub fn save_project(path: String) -> Result<(), String> {
    let state = project();
    let mut terra = crate::io::terra_file::TerraFile::new(state.name.clone());

    let surfaces = state.surfaces.read();
    let alignments = state.alignments.read();
    let profiles = state.profiles.read();
    let corridors = state.corridors.read();
    let networks = state.pipe_networks.read();

    terra.metadata.object_count =
        surfaces.len() + alignments.len() + profiles.len() + corridors.len() + networks.len();

    let blob = rmp_serde::to_vec(&ProjectSaveData {
        surfaces: surfaces.values().cloned().collect(),
        alignments: alignments.values().cloned().collect(),
        profiles: profiles.values().cloned().collect(),
        corridors: corridors.values().cloned().collect(),
        pipe_networks: networks.values().cloned().collect(),
    })
    .map_err(|e| e.to_string())?;

    terra.geometry_blob = blob;
    terra
        .save(std::path::Path::new(&path))
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn load_project(path: String) -> Result<ProjectSnapshot, String> {
    let terra = crate::io::terra_file::TerraFile::load(std::path::Path::new(&path))
        .map_err(|e| e.to_string())?;

    let data: ProjectSaveData =
        rmp_serde::from_slice(&terra.geometry_blob).map_err(|e| e.to_string())?;

    let state = project();

    {
        let mut surfaces = state.surfaces.write();
        surfaces.clear();
        for s in &data.surfaces {
            surfaces.insert(s.id, s.clone());
        }
    }
    {
        let mut alignments = state.alignments.write();
        alignments.clear();
        for a in &data.alignments {
            alignments.insert(a.id, a.clone());
        }
    }
    {
        let mut profiles = state.profiles.write();
        profiles.clear();
        for p in &data.profiles {
            profiles.insert(p.id, p.clone());
        }
    }
    {
        let mut corridors = state.corridors.write();
        corridors.clear();
        for c in &data.corridors {
            corridors.insert(c.id, c.clone());
        }
    }
    {
        let mut networks = state.pipe_networks.write();
        networks.clear();
        for n in &data.pipe_networks {
            networks.insert(n.id, n.clone());
        }
    }

    Ok(ProjectSnapshot {
        name: terra.project_name,
        surface_count: data.surfaces.len(),
        alignment_count: data.alignments.len(),
        profile_count: data.profiles.len(),
        corridor_count: data.corridors.len(),
        pipe_network_count: data.pipe_networks.len(),
    })
}
