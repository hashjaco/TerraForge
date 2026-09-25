import * as THREE from "three";

// Civil data is right-handed Z-up (X east, Y north). Three.js is right-handed
// Y-up, so north maps to -Z; a plain Y/Z swap would mirror the scene.
export function civilToThree(x: number, y: number, z: number): [number, number, number] {
  return [x, z, -y];
}

export function civilPointsToThree(raw: ArrayLike<number>): Float32Array {
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) {
    positions[i] = raw[i];
    positions[i + 1] = raw[i + 2];
    positions[i + 2] = -raw[i + 1];
  }
  return positions;
}

// Hypsometric ramp, low → high: lowland green, upland olive, ochre, rock, snow.
const RAMP: [number, number, number, number][] = [
  [0.0, 0.12, 0.32, 0.22],
  [0.3, 0.33, 0.47, 0.24],
  [0.55, 0.62, 0.55, 0.31],
  [0.8, 0.55, 0.45, 0.38],
  [1.0, 0.92, 0.92, 0.9],
];

export function elevationColor(t: number, out: Float32Array, offset: number) {
  const clamped = Math.min(1, Math.max(0, t));
  let i = 1;
  while (i < RAMP.length - 1 && RAMP[i][0] < clamped) i++;
  const [t0, r0, g0, b0] = RAMP[i - 1];
  const [t1, r1, g1, b1] = RAMP[i];
  const f = (clamped - t0) / (t1 - t0);
  out[offset] = r0 + (r1 - r0) * f;
  out[offset + 1] = g0 + (g1 - g0) * f;
  out[offset + 2] = b0 + (b1 - b0) * f;
}

export function buildIndexedGeometry(
  vertices: ArrayLike<number>,
  indices: ArrayLike<number>,
): THREE.BufferGeometry | null {
  if (!vertices.length || !indices.length) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(civilPointsToThree(vertices), 3));
  geo.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

export function buildSurfaceGeometry(
  points: ArrayLike<number>,
  triangles: ArrayLike<number>,
  minElev: number,
  maxElev: number,
): THREE.BufferGeometry | null {
  const geo = buildIndexedGeometry(points, triangles);
  if (!geo) return null;
  const positions = geo.getAttribute("position").array as Float32Array;
  const range = maxElev - minElev || 1;
  const colors = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    elevationColor((positions[i + 1] - minElev) / range, colors, i);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}
