import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSurface } from "@/lib/tauri-bridge";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";

function parseCsvPoints(csv: string): [number, number, number][] {
  const points: [number, number, number][] = [];
  const lines = csv.trim().split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;

    const parts = trimmed.split(/[,\s\t]+/).map(Number);
    if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
      points.push([parts[0], parts[1], parts[2]]);
    }
  }
  return points;
}

export function SurfaceImport() {
  const [format, setFormat] = useState<"csv" | "dxf" | "landxml">("csv");
  const [importing, setImporting] = useState(false);
  const addObject = useProjectStore((s) => s.addObject);

  async function handleBrowse() {
    if (format !== "csv") return;

    try {
      setImporting(true);
      const { open } = await import("@tauri-apps/plugin-dialog");
      const filePath = await open({
        filters: [{ name: "CSV Files", extensions: ["csv", "txt"] }],
        multiple: false,
      });

      if (!filePath || typeof filePath !== "string") {
        setImporting(false);
        return;
      }

      const { readTextFile } = await import("@tauri-apps/plugin-fs");
      const content = await readTextFile(filePath);
      const points = parseCsvPoints(content);

      if (points.length < 3) {
        useUIStore.getState().setStatusMessage("Need at least 3 points to create a surface");
        setImporting(false);
        return;
      }

      const response = await createSurface(`Imported Surface (${points.length} pts)`, points);

      addObject({
        id: response.id,
        name: response.name,
        type: "surface",
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          points: response.points,
          triangles: response.triangles,
          pointCount: response.point_count,
          triangleCount: response.triangle_count,
          contourInterval: 5,
        },
      });

      useUIStore.getState().setStatusMessage(
        `Imported ${points.length} points → ${response.triangle_count} triangles`
      );
    } catch (err) {
      useUIStore.getState().setStatusMessage(`Import failed: ${err}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Import Points
      </h3>

      <div className="flex gap-1">
        {(["csv", "dxf", "landxml"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-2 py-1 text-xs rounded ${
              format === f
                ? "bg-primary-800 text-primary-200"
                : "bg-surface-overlay text-text-secondary hover:text-text-primary"
            }`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted">
        {format === "csv" && "Import points from CSV file (x,y,z per line)"}
        {format === "dxf" && "DXF import (coming soon)"}
        {format === "landxml" && "LandXML import (coming soon)"}
      </p>

      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        onClick={handleBrowse}
        disabled={format !== "csv" || importing}
      >
        {importing ? "Importing..." : "Browse File..."}
      </Button>
    </div>
  );
}
