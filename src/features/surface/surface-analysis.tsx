import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import type { SurfaceObject } from "@/lib/types/civil-objects";

export function SurfaceAnalysis() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);

  const surface = selectedIds.length === 1
    ? (objects.get(selectedIds[0]) as SurfaceObject | undefined)
    : undefined;

  if (!surface || surface.type !== "surface") {
    return (
      <div className="p-3">
        <p className="text-xs text-text-muted italic">
          Select a surface to view analysis.
        </p>
      </div>
    );
  }

  const analysis = surface.data.analysis;

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Surface Analysis
      </h3>
      {analysis ? (
        <div className="space-y-1.5">
          <AnalysisRow label="Min Elevation" value={`${analysis.min_elevation.toFixed(2)} m`} />
          <AnalysisRow label="Max Elevation" value={`${analysis.max_elevation.toFixed(2)} m`} />
          <AnalysisRow label="Relief" value={`${(analysis.max_elevation - analysis.min_elevation).toFixed(2)} m`} />
          <AnalysisRow label="Area" value={`${analysis.area.toFixed(1)} m²`} />
          <AnalysisRow label="Avg Slope" value={`${analysis.avg_slope.toFixed(1)}°`} />
        </div>
      ) : (
        <p className="text-xs text-text-muted">No analysis available.</p>
      )}
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="text-text-primary font-mono">{value}</span>
    </div>
  );
}
