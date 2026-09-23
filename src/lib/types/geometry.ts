export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox2D {
  min: Vector2;
  max: Vector2;
}

export interface BoundingBox3D {
  min: Vector3;
  max: Vector3;
}
