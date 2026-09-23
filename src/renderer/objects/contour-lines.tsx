import { useEffect, useState } from "react";
import { Line } from "@react-three/drei";
import type { SurfaceData } from "@/lib/types/civil-objects";
import { generateContours, type ContourLineResponse } from "@/lib/tauri-bridge";

interface Props {
  objectId: string;
  data: SurfaceData;
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
        // Tauri may not be available during dev (browser-only mode)
      });

    return () => {
      cancelled = true;
    };
  }, [objectId, data.pointCount, data.contourInterval]);

  if (contours.length === 0) return <group />;

  return (
    <group>
      {contours.map((contour, i) => {
        if (contour.vertices.length < 4) return null;

        // Swap Y and Z: civil (X,Y,Z-up) → Three.js (X,Y-up,Z)
        const points: [number, number, number][] = [];
        for (let j = 0; j < contour.vertices.length; j += 2) {
          points.push([contour.vertices[j], contour.elevation, contour.vertices[j + 1]]);
        }

        if (points.length < 2) return null;

        const isMajor = Math.abs(contour.elevation % 5) < 0.01;

        return (
          <Line
            key={`${objectId}-contour-${i}`}
            points={points}
            color={isMajor ? "#f59e0b" : "#78716c"}
            lineWidth={isMajor ? 1.5 : 0.75}
          />
        );
      })}
    </group>
  );
}
