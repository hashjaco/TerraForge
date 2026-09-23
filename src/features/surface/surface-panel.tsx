import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";

export function SurfacePanel() {
  const [name, setName] = useState("Surface 1");
  const [generating, setGenerating] = useState(false);
  const addObject = useProjectStore((s) => s.addObject);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  async function createDemoSurface() {
    setGenerating(true);
    setStatus("Generating terrain...");

    try {
      const points: [number, number, number][] = [];
      for (let x = 0; x <= 100; x += 5) {
        for (let y = 0; y <= 100; y += 5) {
          const z =
            Math.sin(x * 0.05) * 10 +
            Math.cos(y * 0.07) * 8 +
            Math.random() * 2;
          points.push([x, y, z]);
        }
      }

      const result = await bridge.createSurface(name, points, 2.0);
      const analysis = await bridge.analyzeSurface(result.id);

      addObject({
        id: result.id,
        name: result.name,
        type: "surface",
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          points: result.points,
          triangles: result.triangles,
          pointCount: result.point_count,
          triangleCount: result.triangle_count,
          contourInterval: 2.0,
          analysis,
        },
      });

      setStatus(`Surface "${name}" created (${result.point_count} points)`);
    } catch (err) {
      setStatus(`Error: ${err}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Create Surface
      </h3>
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Button
        variant="primary"
        size="sm"
        onClick={createDemoSurface}
        disabled={generating}
        className="w-full"
        data-tutorial-id="create-surface-button"
      >
        {generating ? "Generating..." : "Generate Demo Terrain"}
      </Button>
    </div>
  );
}
