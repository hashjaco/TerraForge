import { useMemo } from "react";
import * as THREE from "three";
import type { IntersectionData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: IntersectionData;
}

export function IntersectionMesh({ objectId, data }: Props) {
  const geometry = useMemo(() => {
    if (data.vertices.length === 0 || data.indices.length === 0) return null;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(data.vertices.length);

    for (let i = 0; i < data.vertices.length; i += 3) {
      positions[i] = data.vertices[i];
      positions[i + 1] = data.vertices[i + 2];
      positions[i + 2] = -data.vertices[i + 1];
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setIndex(Array.from(data.indices));
    geo.computeVertexNormals();
    return geo;
  }, [data.vertices, data.indices]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#a78bfa"
        side={THREE.DoubleSide}
        transparent
        opacity={0.7}
      />
    </mesh>
  );
}
