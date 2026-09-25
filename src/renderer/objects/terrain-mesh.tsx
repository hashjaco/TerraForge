import * as THREE from "three";
import { useIsSelected } from "@/stores/selection-store";
import { buildSurfaceGeometry } from "@/renderer/lib/geometry";
import { useDisposable } from "@/renderer/lib/use-disposable";
import type { SurfaceData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: SurfaceData;
}

export function TerrainMesh({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);
  const minElev = data.analysis?.min_elevation ?? 0;
  const maxElev = data.analysis?.max_elevation ?? 100;
  const geometry = useDisposable(
    () => buildSurfaceGeometry(data.points, data.triangles, minElev, maxElev),
    [data.points, data.triangles, minElev, maxElev],
  );

  if (!geometry) return null;

  return (
    <group userData={{ objectId }}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          vertexColors
          side={THREE.DoubleSide}
          roughness={0.92}
          metalness={0}
          emissive={isSelected ? "#1d4ed8" : "#000000"}
          emissiveIntensity={isSelected ? 0.18 : 0}
        />
      </mesh>
    </group>
  );
}
