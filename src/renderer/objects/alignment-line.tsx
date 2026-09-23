import { Line } from "@react-three/drei";
import { useSelectionStore } from "@/stores/selection-store";
import type { AlignmentData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: AlignmentData;
}

export function AlignmentLine({ objectId, data }: Props) {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const isSelected = selectedIds.includes(objectId);

  if (!data.sampledPoints.length) return null;

  // Swap Y→Z so alignment lies on the XZ ground plane (Y-up in Three.js)
  const points: [number, number, number][] = [];
  for (let i = 0; i < data.sampledPoints.length; i += 2) {
    points.push([data.sampledPoints[i], 0.5, data.sampledPoints[i + 1]]);
  }

  if (points.length < 2) return null;

  return (
    <group userData={{ objectId }}>
      <Line
        points={points}
        color={isSelected ? "#60a5fa" : "#f59e0b"}
        lineWidth={2}
      />
    </group>
  );
}
