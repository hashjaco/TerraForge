import { Line } from "@react-three/drei";
import { useIsSelected } from "@/stores/selection-store";
import { civilToThree } from "@/renderer/lib/geometry";
import type { FeatureLineData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: FeatureLineData;
}

export function FeatureLineMesh({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);

  const points: [number, number, number][] = [];
  for (let i = 0; i < data.vertices.length; i += 3) {
    points.push(civilToThree(data.vertices[i], data.vertices[i + 1], data.vertices[i + 2]));
  }

  if (points.length < 2) return null;

  return (
    <group userData={{ objectId }}>
      <Line points={points} color={isSelected ? "#60a5fa" : "#ff6b35"} lineWidth={2} />
    </group>
  );
}
