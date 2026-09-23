import type { AnyCivilObject } from "@/lib/types/civil-objects";

interface Props {
  object: AnyCivilObject;
}

export function PropertyFields({ object }: Props) {
  switch (object.type) {
    case "surface":
      return (
        <div className="space-y-2">
          <PropertyRow label="Points" value={object.data.pointCount} />
          <PropertyRow label="Triangles" value={object.data.triangleCount} />
          <PropertyRow
            label="Contour Interval"
            value={`${object.data.contourInterval}m`}
          />
          {object.data.analysis && (
            <>
              <div className="h-px bg-border my-2" />
              <h4 className="text-[11px] text-text-muted uppercase">
                Analysis
              </h4>
              <PropertyRow
                label="Min Elevation"
                value={`${object.data.analysis.min_elevation.toFixed(2)}m`}
              />
              <PropertyRow
                label="Max Elevation"
                value={`${object.data.analysis.max_elevation.toFixed(2)}m`}
              />
              <PropertyRow
                label="Area"
                value={`${object.data.analysis.area.toFixed(1)} m²`}
              />
              <PropertyRow
                label="Avg Slope"
                value={`${object.data.analysis.avg_slope.toFixed(1)}°`}
              />
            </>
          )}
        </div>
      );

    case "alignment":
      return (
        <div className="space-y-2">
          <PropertyRow
            label="Length"
            value={`${object.data.totalLength.toFixed(2)}m`}
          />
          <PropertyRow label="Segments" value={object.data.segmentCount} />
        </div>
      );

    case "profile":
      return (
        <div className="space-y-2">
          <PropertyRow label="Alignment" value={object.data.alignmentId} />
          <PropertyRow label="PVI Count" value={object.data.pviCount} />
        </div>
      );

    case "corridor":
      return (
        <div className="space-y-2">
          <PropertyRow label="Alignment" value={object.data.alignmentId} />
          <PropertyRow label="Profile" value={object.data.profileId} />
          <PropertyRow label="Vertices" value={object.data.vertexCount} />
          <PropertyRow label="Triangles" value={object.data.triangleCount} />
        </div>
      );

    case "pipe-network":
      return (
        <div className="space-y-2">
          <PropertyRow label="System" value={object.data.systemType} />
          <PropertyRow label="Nodes" value={object.data.nodeCount} />
          <PropertyRow label="Pipes" value={object.data.pipeCount} />
        </div>
      );

    default:
      return null;
  }
}

function PropertyRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-text-muted">{label}</span>
      <span className="text-xs text-text-primary font-mono">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
