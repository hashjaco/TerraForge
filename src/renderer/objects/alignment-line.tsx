import { Line } from "@react-three/drei";
import { useIsSelected } from "@/stores/selection-store";
import { civilToThree } from "@/renderer/lib/geometry";
import type { AlignmentData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: AlignmentData;
}

const ALIGNMENT_DRAPE_HEIGHT = 0.5;

export function AlignmentLine({ objectId, data }: Props) {
  const isSelected = useIsSelected(objectId);

  const points: [number, number, number][] = [];
  for (let i = 0; i < data.sampledPoints.length; i += 2) {
    points.push(civilToThree(data.sampledPoints[i], data.sampledPoints[i + 1], ALIGNMENT_DRAPE_HEIGHT));
  }

  if (points.length < 2) return null;

  return (
    <group userData={{ objectId }}>
      <Line
        points={points}
        color={isSelected ? "#60a5fa" : "#f59e0b"}
        lineWidth={isSelected ? 3 : 2}
      />
    </group>
  );
}
