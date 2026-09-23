export type ObjectType =
  | "surface"
  | "alignment"
  | "profile"
  | "corridor"
  | "pipe-network"
  | "feature-line"
  | "parcel"
  | "survey-db"
  | "catchment"
  | "pressure-network"
  | "intersection";

export interface CivilObject {
  id: string;
  name: string;
  type: ObjectType;
  dependencies: string[];
  dependents: string[];
  version: number;
  visible: boolean;
  locked: boolean;
}

// ---- Surface ----

export interface SurfaceObject extends CivilObject {
  type: "surface";
  data: SurfaceData;
}

export interface SurfaceData {
  points: number[];
  triangles: number[];
  pointCount: number;
  triangleCount: number;
  contourInterval: number;
  analysis?: SurfaceAnalysis;
}

export interface SurfaceAnalysis {
  min_elevation: number;
  max_elevation: number;
  area: number;
  volume: number | null;
  avg_slope: number;
}

// ---- Alignment ----

export interface AlignmentObject extends CivilObject {
  type: "alignment";
  data: AlignmentData;
}

export interface AlignmentData {
  totalLength: number;
  sampledPoints: number[];
  segmentCount: number;
}

export interface SegmentInput {
  segment_type: "line" | "arc" | "spiral";
  start?: [number, number];
  end?: [number, number];
  center?: [number, number];
  radius?: number;
  start_angle?: number;
  sweep_angle?: number;
  start_direction?: number;
  start_radius?: number;
  end_radius?: number;
  length?: number;
}

// ---- Profile ----

export interface ProfileObject extends CivilObject {
  type: "profile";
  data: ProfileData;
}

export interface ProfileData {
  alignmentId: string;
  pviCount: number;
  sampledPoints: number[];
}

export interface PVIInput {
  station: number;
  elevation: number;
  curve_length: number;
}

// ---- Corridor ----

export interface CorridorObject extends CivilObject {
  type: "corridor";
  data: CorridorData;
}

export interface CorridorData {
  alignmentId: string;
  profileId: string;
  vertexCount: number;
  triangleCount: number;
  vertices: number[];
  indices: number[];
}

// ---- Pipe Network ----

export interface PipeNetworkObject extends CivilObject {
  type: "pipe-network";
  data: PipeNetworkData;
}

export interface PipeNetworkData {
  systemType: string;
  nodeCount: number;
  pipeCount: number;
  nodes: PipeNodeData[];
  pipes: PipeSegmentData[];
}

export interface PipeNodeData {
  id: string;
  position: [number, number, number];
  node_type: string;
  rim_elevation: number;
  invert_elevation: number;
}

export interface PipeSegmentData {
  id: string;
  start_node_id: string;
  end_node_id: string;
  diameter: number;
  material: string;
  length: number;
  slope: number;
}

// ---- Feature Line ----

export interface FeatureLineObject extends CivilObject {
  type: "feature-line";
  data: FeatureLineData;
}

export interface FeatureLineData {
  vertexCount: number;
  totalLength: number;
  vertices: number[];
}

// ---- Parcel ----

export interface ParcelObject extends CivilObject {
  type: "parcel";
  data: ParcelData;
}

export interface ParcelData {
  number: string;
  area: number;
  perimeter: number;
  vertices: number[];
}

// ---- Catchment ----

export interface CatchmentObject extends CivilObject {
  type: "catchment";
  data: CatchmentData;
}

export interface CatchmentData {
  area: number;
  runoffCoefficient: number;
  boundary: number[];
}

// ---- Pressure Network ----

export interface PressureNetworkObject extends CivilObject {
  type: "pressure-network";
  data: PressureNetworkData;
}

export interface PressureNetworkData {
  pipeCount: number;
  fittingCount: number;
  pipes: PressurePipeData[];
}

export interface PressurePipeData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  diameter: number;
  material: string;
  length: number;
}

// ---- Intersection ----

export interface IntersectionObject extends CivilObject {
  type: "intersection";
  data: IntersectionData;
}

export interface IntersectionData {
  intersectionType: string;
  center: [number, number];
  vertices: number[];
  indices: number[];
  curbReturnCount: number;
}

// ---- Volume Results ----

export interface VolumeResult {
  cut_volume: number;
  fill_volume: number;
  net_volume: number;
  cut_area: number;
  fill_area: number;
}

// ---- Validation ----

export interface ValidationIssue {
  object_id: string;
  severity: "Error" | "Warning" | "Info";
  category: string;
  message: string;
  station: number | null;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  error_count: number;
  warning_count: number;
  info_count: number;
}

// ---- Template ----

export interface TemplateElement {
  type: "lane" | "shoulder" | "curb" | "sidewalk" | "slope" | "ditch";
  width: number;
  slope: number;
  side: "left" | "right";
}

export interface SurveyDbObject extends CivilObject {
  type: "survey-db";
  data: Record<string, unknown>;
}

export type AnyCivilObject =
  | SurfaceObject
  | AlignmentObject
  | ProfileObject
  | CorridorObject
  | PipeNetworkObject
  | FeatureLineObject
  | ParcelObject
  | SurveyDbObject
  | CatchmentObject
  | PressureNetworkObject
  | IntersectionObject;
