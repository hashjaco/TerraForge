import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { FeatureLineData } from "@/lib/types/civil-objects";

interface Props {
  objectId: string;
  data: FeatureLineData;
}

export function FeatureLineMesh({ objectId, data }: Props) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < data.vertices.length; i += 3) {
      pts.push([
        data.vertices[i],
        data.vertices[i + 2],
        -data.vertices[i + 1],
      ]);
    }
    return pts;
  }, [data.vertices]);

  if (points.length < 2) return null;

  return <Line points={points} color="#ff6b35" lineWidth={2} />;
}
