import { useRef } from "react";
import * as THREE from "three";
import { useSelectionStore } from "@/stores/selection-store";
import type { SurfaceData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: SurfaceData;
}

export function TerrainMesh({ objectId, data }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const isSelected = selectedIds.includes(objectId);

  if (!data.points.length || !data.triangles.length) return null;

  const geo = new THREE.BufferGeometry();
  const raw = data.points;
  // Swap Y and Z: civil (X,Y,Z-up) → Three.js (X,Y-up,Z)
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) {
    positions[i] = raw[i];
    positions[i + 1] = raw[i + 2];
    positions[i + 2] = raw[i + 1];
  }
  const indices = new Uint32Array(data.triangles);

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  const minElev = data.analysis?.min_elevation ?? 0;
  const maxElev = data.analysis?.max_elevation ?? 100;
  const range = maxElev - minElev || 1;
  const colors = new Float32Array(positions.length);

  for (let i = 0; i < positions.length; i += 3) {
    const elevation = positions[i + 1];
    const t = (elevation - minElev) / range;
    colors[i] = 0.2 + t * 0.5;
    colors[i + 1] = 0.5 - t * 0.2;
    colors[i + 2] = 0.1 + t * 0.1;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return (
    <group userData={{ objectId }}>
      <mesh ref={meshRef} geometry={geo}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          wireframe={false}
          emissive={isSelected ? "#1d4ed8" : "#000000"}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </mesh>
    </group>
  );
}
