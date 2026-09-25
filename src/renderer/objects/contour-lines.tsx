import { useEffect, useState } from "react";
import { Line } from "@react-three/drei";
import type { SurfaceData } from "@/lib/types/civil-objects";
import { generateContours, type ContourLineResponse } from "@/lib/tauri-bridge";
import { civilToThree } from "@/renderer/lib/geometry";

interface Props {
  objectId: string;
  data: SurfaceData;
}

const MAJOR_CONTOUR_EVERY = 5;
const MAJOR_COLOR: [number, number, number] = [0.96, 0.62, 0.04];
const MINOR_COLOR: [number, number, number] = [0.47, 0.44, 0.42];
const CONTOUR_LIFT = 0.05;

// All contours of a surface go into one LineSegments2 so they cost a single draw call.
function toSegments(contours: ContourLineResponse[]) {
  const points: [number, number, number][] = [];
  const colors: [number, number, number][] = [];
  for (const contour of contours) {
    const v = contour.vertices;
    const isMajor = Math.abs(contour.elevation % MAJOR_CONTOUR_EVERY) < 0.01;
    const color = isMajor ? MAJOR_COLOR : MINOR_COLOR;
    for (let j = 0; j + 3 < v.length; j += 2) {
      points.push(civilToThree(v[j], v[j + 1], contour.elevation + CONTOUR_LIFT));
      points.push(civilToThree(v[j + 2], v[j + 3], contour.elevation + CONTOUR_LIFT));
      colors.push(color, color);
    }
  }
  return { points, colors };
}

export function ContourLines({ objectId, data }: Props) {
  const [contours, setContours] = useState<ContourLineResponse[]>([]);

  useEffect(() => {
    if (data.pointCount < 3) return;

    let cancelled = false;

    generateContours(objectId, data.contourInterval || 1)
      .then((result) => {
        if (!cancelled) setContours(result);
      })
      .catch(() => {
        // Tauri IPC is unavailable in browser-only dev mode.
      });

    return () => {
      cancelled = true;
    };
  }, [objectId, data.pointCount, data.contourInterval]);

  const { points, colors } = toSegments(contours);
  if (points.length < 2) return null;

  return <Line segments points={points} vertexColors={colors} lineWidth={1} transparent opacity={0.9} />;
}
