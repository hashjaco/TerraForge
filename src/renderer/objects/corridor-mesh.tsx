import * as THREE from "three";
import { useIsSelected } from "@/stores/selection-store";
import { buildIndexedGeometry } from "@/renderer/lib/geometry";
import { useDisposable } from "@/renderer/lib/use-disposable";
import type { CorridorData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: CorridorData;
}

export function CorridorMesh({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);
  const geometry = useDisposable(
    () => buildIndexedGeometry(data.vertices, data.indices),
    [data.vertices, data.indices],
  );

  if (!geometry) return null;

  return (
    <group userData={{ objectId }}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={isSelected ? "#3b82f6" : "#6b7280"}
          side={THREE.DoubleSide}
          roughness={0.8}
          metalness={0.05}
          flatShading
        />
      </mesh>
    </group>
  );
}
