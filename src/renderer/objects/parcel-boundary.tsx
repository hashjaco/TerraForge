import { useMemo } from "react";
import { Line } from "@react-three/drei";
import type { ParcelData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: ParcelData;
}

export function ParcelBoundary({ objectId, data }: Props) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < data.vertices.length; i += 2) {
      pts.push([data.vertices[i], 0.1, -data.vertices[i + 1]]);
    }
    if (pts.length >= 3) {
      pts.push(pts[0]);
    }
    return pts;
  }, [data.vertices]);

  if (points.length < 3) return null;

  return <Line points={points} color="#4ecdc4" lineWidth={2} />;
}
