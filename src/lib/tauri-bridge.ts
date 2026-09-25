import { invoke } from "@tauri-apps/api/core";
import type {
  SegmentInput,
  PVIInput,
  SurfaceAnalysis,
  VolumeResult,
  ValidationResult,
} from "./types/civil-objects";

// ---- Response Types ----

interface SurfaceResponse {
  id: string;
  name: string;
  points: number[];
  triangles: number[];
  point_count: number;
  triangle_count: number;
}

interface AlignmentResponse {
  id: string;
  name: string;
  total_length: number;
  sampled_points: number[];
  segment_count: number;
}

interface ProfileResponse {
  id: string;
  name: string;
  alignment_id: string;
  pvi_count: number;
  sampled_points: number[];
}

interface CorridorResponse {
  id: string;
  name: string;
  alignment_id: string;
  profile_id: string;
  vertex_count: number;
  triangle_count: number;
  vertices: number[];
  indices: number[];
}

interface PipeNodeResponse {
  id: string;
  position: [number, number, number];
  node_type: string;
  rim_elevation: number;
  invert_elevation: number;
}

interface PipeSegmentResponse {
  id: string;
  start_node_id: string;
  end_node_id: string;
  diameter: number;
  material: string;
  length: number;
  slope: number;
}

interface PipeNetworkResponse {
  id: string;
  name: string;
  system_type: string;
  node_count: number;
  pipe_count: number;
  nodes: PipeNodeResponse[];
  pipes: PipeSegmentResponse[];
}

interface NetworkAnalysisResponse {
  pipe_hydraulics: {
    pipe_id: string;
    capacity: number;
    velocity: number;
    is_adequate: boolean;
  }[];
  component_count: number;
}

interface FeatureLineResponse {
  id: string;
  name: string;
  vertex_count: number;
  total_length: number;
  vertices: number[];
}

interface ParcelResponse {
  id: string;
  name: string;
  number: string;
  area: number;
  perimeter: number;
  vertices: number[];
}

interface CatchmentResponse {
  id: string;
  name: string;
  area: number;
  runoff_coefficient: number;
  boundary: number[];
}

interface CatchmentAnalysisResponse {
  peak_flow: number;
  volume: number;
  time_to_peak: number;
}

interface ChannelResponse {
  id: string;
  name: string;
  capacity: number;
  velocity: number;
  slope: number;
  centerline: number[];
}

interface PondResponse {
  id: string;
  name: string;
  pond_type: string;
  total_storage: number;
  max_depth: number;
  center: [number, number, number];
}

interface PressureNetworkResponse {
  id: string;
  name: string;
  pipe_count: number;
  fitting_count: number;
  pipes: {
    id: string;
    start: [number, number, number];
    end: [number, number, number];
    diameter: number;
    material: string;
    length: number;
  }[];
}

interface IntersectionResponse {
  id: string;
  name: string;
  intersection_type: string;
  center: [number, number];
  vertices: number[];
  indices: number[];
  curb_return_count: number;
}

interface SurveyDatabaseResponse {
  id: string;
  name: string;
  point_count: number;
  figure_count: number;
  points: {
    number: number;
    position: [number, number, number];
    code: string;
    description: string;
  }[];
  figures: {
    name: string;
    code: string;
    point_count: number;
    is_closed: boolean;
    vertices: number[];
  }[];
}

interface WaterDropResponse {
  path: number[];
}

interface WatershedResponse {
  regions: {
    id: number;
    area: number;
    pour_point: [number, number];
    boundary: number[];
  }[];
}

// ---- Surface Commands ----

export async function createSurface(
  name: string,
  points: [number, number, number][],
  contourInterval?: number,
  breaklines?: { name: string; point_indices: number[] }[]
): Promise<SurfaceResponse> {
  return invoke("create_surface_from_points", {
    input: { name, points, contour_interval: contourInterval, breaklines },
  });
}

export async function createGridSurface(
  name: string,
  minX: number, minY: number,
  maxX: number, maxY: number,
  resolution: number,
  elevations: number[],
  contourInterval?: number
): Promise<SurfaceResponse> {
  return invoke("create_grid_surface", {
    input: {
      name, min_x: minX, min_y: minY, max_x: maxX, max_y: maxY,
      resolution, elevations, contour_interval: contourInterval,
    },
  });
}

export async function getSurfaceData(id: string): Promise<SurfaceResponse> {
  return invoke("get_surface_data", { id });
}

export async function updateSurfacePoint(
  surfaceId: string,
  pointIndex: number,
  position: [number, number, number]
): Promise<SurfaceResponse> {
  return invoke("update_surface_point", {
    input: { surface_id: surfaceId, point_index: pointIndex, position },
  });
}

export async function addSurfaceBreakline(
  surfaceId: string,
  name: string,
  pointIndices: number[]
): Promise<SurfaceResponse> {
  return invoke("add_surface_breakline", {
    input: { surface_id: surfaceId, name, point_indices: pointIndices },
  });
}

export async function addSurfaceBoundary(
  surfaceId: string,
  boundaryType: "outer" | "hide" | "show",
  vertices: [number, number][]
): Promise<SurfaceResponse> {
  return invoke("add_surface_boundary", {
    input: { surface_id: surfaceId, boundary_type: boundaryType, vertices },
  });
}

export async function analyzeSurface(id: string): Promise<SurfaceAnalysis> {
  return invoke("analyze_surface", { id });
}

export async function computeVolume(
  existingSurfaceId: string,
  designSurfaceId: string,
  gridSpacing?: number
): Promise<VolumeResult> {
  return invoke("compute_volume", {
    input: {
      existing_surface_id: existingSurfaceId,
      design_surface_id: designSurfaceId,
      grid_spacing: gridSpacing,
    },
  });
}

export async function computeDatumVolume(
  surfaceId: string,
  datum: number,
  gridSpacing?: number
): Promise<VolumeResult> {
  return invoke("compute_datum_volume", {
    input: { surface_id: surfaceId, datum, grid_spacing: gridSpacing },
  });
}

export async function traceWaterDrop(
  surfaceId: string, x: number, y: number
): Promise<WaterDropResponse> {
  return invoke("trace_water_drop", { surface_id: surfaceId, x, y });
}

export async function delineateWatersheds(
  surfaceId: string
): Promise<WatershedResponse> {
  return invoke("delineate_watersheds", { surface_id: surfaceId });
}

// ---- Alignment Commands ----

export async function createAlignment(
  name: string, segments: SegmentInput[]
): Promise<AlignmentResponse> {
  return invoke("create_alignment", { input: { name, segments } });
}

export async function getAlignmentData(id: string): Promise<AlignmentResponse> {
  return invoke("get_alignment_data", { id });
}

export async function updateAlignment(
  id: string, segments: SegmentInput[]
): Promise<AlignmentResponse> {
  return invoke("update_alignment", { id, segments });
}

export async function sampleAlignment(id: string, interval: number): Promise<number[]> {
  return invoke("sample_alignment", { id, interval });
}

// ---- Profile Commands ----

export async function createProfile(
  name: string, alignmentId: string, pvis: PVIInput[]
): Promise<ProfileResponse> {
  return invoke("create_profile", {
    input: { name, alignment_id: alignmentId, pvis },
  });
}

export async function getProfileData(id: string): Promise<ProfileResponse> {
  return invoke("get_profile_data", { id });
}

export async function updateProfile(id: string, pvis: PVIInput[]): Promise<ProfileResponse> {
  return invoke("update_profile", { id, pvis });
}

export async function sampleExistingGround(
  surfaceId: string, alignmentId: string, interval: number
): Promise<number[]> {
  return invoke("sample_existing_ground", {
    surface_id: surfaceId, alignment_id: alignmentId, interval,
  });
}

// ---- Corridor Commands ----

export async function createCorridor(
  name: string, alignmentId: string, profileId: string, frequency?: number
): Promise<CorridorResponse> {
  return invoke("create_corridor", {
    input: { name, alignment_id: alignmentId, profile_id: profileId, frequency },
  });
}

export async function getCorridorData(id: string): Promise<CorridorResponse> {
  return invoke("get_corridor_data", { id });
}

export async function updateCorridor(id: string, frequency?: number): Promise<CorridorResponse> {
  return invoke("update_corridor", { id, frequency });
}

export async function rebuildCorridor(id: string): Promise<CorridorResponse> {
  return invoke("rebuild_corridor", { id });
}

// ---- Pipe Network Commands ----

export async function createPipeNetwork(
  name: string, systemType: string
): Promise<PipeNetworkResponse> {
  return invoke("create_pipe_network", {
    input: { name, system_type: systemType },
  });
}

export async function getPipeNetworkData(id: string): Promise<PipeNetworkResponse> {
  return invoke("get_pipe_network_data", { id });
}

export async function addPipeNode(
  networkId: string, position: [number, number, number],
  nodeType: string, rimElevation: number, invertElevation: number
): Promise<PipeNetworkResponse> {
  return invoke("add_pipe_node", {
    input: {
      network_id: networkId, position, node_type: nodeType,
      rim_elevation: rimElevation, invert_elevation: invertElevation,
    },
  });
}

export async function addPipeSegment(
  networkId: string, startNodeId: string, endNodeId: string,
  diameter: number, material: string
): Promise<PipeNetworkResponse> {
  return invoke("add_pipe_segment", {
    input: {
      network_id: networkId, start_node_id: startNodeId,
      end_node_id: endNodeId, diameter, material,
    },
  });
}

export async function analyzeNetwork(id: string): Promise<NetworkAnalysisResponse> {
  return invoke("analyze_network", { id });
}

// ---- Feature Line / Grading Commands ----

export async function createFeatureLine(
  name: string, vertices: [number, number, number][]
): Promise<FeatureLineResponse> {
  return invoke("create_feature_line", { input: { name, vertices } });
}

export async function getFeatureLineData(id: string): Promise<FeatureLineResponse> {
  return invoke("get_feature_line_data", { id });
}

export async function extractFeatureLineFromSurface(
  name: string, surfaceId: string, path: [number, number][]
): Promise<FeatureLineResponse> {
  return invoke("extract_feature_line_from_surface", {
    input: { name, surface_id: surfaceId, path },
  });
}

export async function createGrading(
  name: string, featureLineId: string, targetType: string,
  targetValue: number, cutSlope: number, fillSlope: number,
  side: string, targetSurfaceId?: string
): Promise<{ id: string; name: string; projected_points: number[] }> {
  return invoke("create_grading", {
    input: {
      name, feature_line_id: featureLineId, target_type: targetType,
      target_value: targetValue, cut_slope: cutSlope, fill_slope: fillSlope,
      side, target_surface_id: targetSurfaceId,
    },
  });
}

// ---- Parcel Commands ----

export async function createParcel(
  name: string, number: string, vertices: [number, number][]
): Promise<ParcelResponse> {
  return invoke("create_parcel", { input: { name, number, vertices } });
}

export async function getParcelData(id: string): Promise<ParcelResponse> {
  return invoke("get_parcel_data", { id });
}

export async function subdivideParcel(
  parcelId: string, frontageWidth: number, edgeIndex: number
): Promise<{ parcels: ParcelResponse[] }> {
  return invoke("subdivide_parcel", {
    input: { parcel_id: parcelId, frontage_width: frontageWidth, edge_index: edgeIndex },
  });
}

export async function importGeoJsonParcels(content: string): Promise<ParcelResponse[]> {
  return invoke("import_geojson_parcels", { content });
}

// ---- Survey Commands ----

export async function createSurveyDatabase(name: string): Promise<SurveyDatabaseResponse> {
  return invoke("create_survey_database", { input: { name } });
}

export async function addSurveyPoint(
  databaseId: string, position: [number, number, number],
  code: string, description: string
): Promise<SurveyDatabaseResponse> {
  return invoke("add_survey_point", {
    input: { database_id: databaseId, position, code, description },
  });
}

export async function importSurveyPoints(
  databaseId: string,
  points: { position: [number, number, number]; code: string; description: string }[]
): Promise<SurveyDatabaseResponse> {
  return invoke("import_survey_points", {
    input: { database_id: databaseId, points },
  });
}

export async function runFieldToFinish(databaseId: string): Promise<SurveyDatabaseResponse> {
  return invoke("run_field_to_finish", { database_id: databaseId });
}

// ---- Drainage Commands ----

export async function createCatchment(
  name: string, boundary: [number, number][], runoffCoefficient: number
): Promise<CatchmentResponse> {
  return invoke("create_catchment", {
    input: { name, boundary, runoff_coefficient: runoffCoefficient },
  });
}

export async function analyzeCatchment(
  id: string, rainfallIntensity: number
): Promise<CatchmentAnalysisResponse> {
  return invoke("analyze_catchment", { id, rainfall_intensity: rainfallIntensity });
}

export async function createChannel(
  name: string, centerline: [number, number, number][],
  sectionType: string, depth: number,
  opts?: { bottomWidth?: number; sideSlope?: number; manningsN?: number }
): Promise<ChannelResponse> {
  return invoke("create_channel", {
    input: {
      name, centerline, section_type: sectionType, depth,
      bottom_width: opts?.bottomWidth, side_slope: opts?.sideSlope,
      mannings_n: opts?.manningsN,
    },
  });
}

export async function createPond(
  name: string, center: [number, number, number],
  pondType: string, stageStorage: [number, number][], maxDepth: number
): Promise<PondResponse> {
  return invoke("create_pond", {
    input: {
      name, center, pond_type: pondType,
      stage_storage: stageStorage, max_depth: maxDepth,
    },
  });
}

export async function createUndergroundStorage(
  name: string, position: [number, number, number],
  storageType: string, length: number,
  opts?: { width?: number; height?: number; diameter?: number; count?: number }
): Promise<{ id: string; name: string; volume: number }> {
  return invoke("create_underground_storage", {
    input: {
      name, position, storage_type: storageType, length,
      width: opts?.width, height: opts?.height,
      diameter: opts?.diameter, count: opts?.count,
    },
  });
}

// ---- Pressure Network Commands ----

export async function createPressureNetwork(name: string): Promise<PressureNetworkResponse> {
  return invoke("create_pressure_network", { input: { name } });
}

export async function addPressurePipe(
  networkId: string, start: [number, number, number],
  end: [number, number, number], diameter: number, material: string
): Promise<PressureNetworkResponse> {
  return invoke("add_pressure_pipe", {
    input: { network_id: networkId, start, end, diameter, material },
  });
}

export async function checkPressureNetwork(
  networkId: string
): Promise<{ checks: { pipe_id: string; check_type: string; passed: boolean; message: string }[] }> {
  return invoke("check_pressure_network", { network_id: networkId });
}

// ---- Intersection Commands ----

export async function createIntersection(
  name: string, center: [number, number], intersectionType: string,
  alignmentIds: string[],
  opts?: { curbReturnRadius?: number; roundaboutDiameter?: number; circulatoryWidth?: number }
): Promise<IntersectionResponse> {
  return invoke("create_intersection", {
    input: {
      name, center, intersection_type: intersectionType,
      alignment_ids: alignmentIds,
      curb_return_radius: opts?.curbReturnRadius,
      roundabout_diameter: opts?.roundaboutDiameter,
      circulatory_width: opts?.circulatoryWidth,
    },
  });
}

export async function getIntersectionData(id: string): Promise<IntersectionResponse> {
  return invoke("get_intersection_data", { id });
}

// ---- Validation Commands ----

export async function validateProject(): Promise<ValidationResult> {
  return invoke("validate_project");
}

export async function validatePipeNetwork(id: string): Promise<ValidationResult> {
  return invoke("validate_pipe_network", { id });
}

export type LlmProvider = "anthropic" | "openai" | "xai";

export interface LlmConfig {
  provider: LlmProvider;
  model: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export async function explainValidation(config: LlmConfig): Promise<string> {
  return invoke("explain_validation", { config });
}

export async function aiChat(config: LlmConfig, messages: ChatTurn[]): Promise<string> {
  return invoke("ai_chat", { config, messages });
}

export async function setLlmApiKey(provider: LlmProvider, key: string): Promise<void> {
  return invoke("set_llm_api_key", { provider, key });
}

export async function clearLlmApiKey(provider: LlmProvider): Promise<void> {
  return invoke("clear_llm_api_key", { provider });
}

export async function hasLlmApiKey(provider: LlmProvider): Promise<boolean> {
  return invoke("has_llm_api_key", { provider });
}

export async function listLlmModels(provider: LlmProvider): Promise<string[]> {
  return invoke("list_llm_models", { provider });
}

// ---- Import/Export Commands ----

export async function importDxfFile(content: string): Promise<SurfaceResponse> {
  return invoke("import_dxf_file", { content });
}

export async function exportDxfFile(surfaceId: string): Promise<string> {
  return invoke("export_dxf_file", { surface_id: surfaceId });
}

export async function importLandXmlFile(content: string): Promise<SurfaceResponse> {
  return invoke("import_landxml_file", { content });
}

export async function exportLandXmlFile(surfaceId: string): Promise<string> {
  return invoke("export_landxml_file", { surface_id: surfaceId });
}

export async function importGeotiffFile(data: number[]): Promise<SurfaceResponse> {
  return invoke("import_geotiff_file", { data });
}

export async function importGeoJsonFile(content: string): Promise<SurfaceResponse> {
  return invoke("import_geojson_file", { content });
}

export async function exportIfcFile(): Promise<string> {
  return invoke("export_ifc_file");
}

// ---- Contour Commands ----

export interface ContourLineResponse {
  elevation: number;
  vertices: number[];
}

export async function generateContours(
  surfaceId: string, interval: number
): Promise<ContourLineResponse[]> {
  return invoke("generate_contours", {
    input: { surface_id: surfaceId, interval },
  });
}

// ---- Object Deletion ----

export async function deleteObject(id: string, objectType: string): Promise<void> {
  return invoke("delete_object", { id, object_type: objectType });
}

// ---- File Save/Load ----

export interface ProjectSnapshot {
  name: string;
  surface_count: number;
  alignment_count: number;
  profile_count: number;
  corridor_count: number;
  pipe_network_count: number;
}

export async function saveProject(path: string): Promise<void> {
  return invoke("save_project", { path });
}

export async function loadProject(path: string): Promise<ProjectSnapshot> {
  return invoke("load_project", { path });
}
