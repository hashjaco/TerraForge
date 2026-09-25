import * as THREE from "three";
import { buildIndexedGeometry } from "@/renderer/lib/geometry";
import { useDisposable } from "@/renderer/lib/use-disposable";
import type { IntersectionData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: IntersectionData;
}

export function IntersectionMesh({ objectId, data }: Props) {
  const geometry = useDisposable(
    () => buildIndexedGeometry(data.vertices, data.indices),
    [data.vertices, data.indices],
  );

  if (!geometry) return null;

  return (
    <group userData={{ objectId }}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#a78bfa"
          side={THREE.DoubleSide}
          transparent
          opacity={0.7}
        />
      </mesh>
    </group>
  );
}
