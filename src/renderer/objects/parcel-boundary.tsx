import { Line } from "@react-three/drei";
import { useIsSelected } from "@/stores/selection-store";
import { civilToThree } from "@/renderer/lib/geometry";
import type { ParcelData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: ParcelData;
}

const PARCEL_DRAPE_HEIGHT = 0.1;

export function ParcelBoundary({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);

  const points: [number, number, number][] = [];
  for (let i = 0; i < data.vertices.length; i += 2) {
    points.push(civilToThree(data.vertices[i], data.vertices[i + 1], PARCEL_DRAPE_HEIGHT));
  }
  if (points.length < 3) return null;
  points.push(points[0]);

  return (
    <group userData={{ objectId }}>
      <Line points={points} color={isSelected ? "#60a5fa" : "#4ecdc4"} lineWidth={2} />
    </group>
  );
}
