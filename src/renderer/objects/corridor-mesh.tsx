import { useRef } from "react";
import * as THREE from "three";
import { useSelectionStore } from "@/stores/selection-store";
import type { CorridorData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: CorridorData;
}

export function CorridorMesh({ objectId, data }: Props) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const isSelected = selectedIds.includes(objectId);

  if (!data.vertices.length || !data.indices.length) return null;

  const geo = new THREE.BufferGeometry();
  const raw = data.vertices;
  // Swap Y and Z: civil (X,Y,Z-up) → Three.js (X,Y-up,Z)
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i += 3) {
    positions[i] = raw[i];
    positions[i + 1] = raw[i + 2];
    positions[i + 2] = raw[i + 1];
  }
  const indices = new Uint32Array(data.indices);

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();

  return (
    <group userData={{ objectId }}>
      <mesh ref={meshRef} geometry={geo}>
        <meshStandardMaterial
          color={isSelected ? "#3b82f6" : "#6b7280"}
          side={THREE.DoubleSide}
          flatShading
        />
      </mesh>
    </group>
  );
}
