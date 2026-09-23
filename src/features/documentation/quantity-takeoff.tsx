import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { computeVolume, computeDatumVolume } from "@/lib/tauri-bridge";
import type { VolumeResult } from "@/lib/types/civil-objects";

export function QuantityTakeoff() {
  const objects = useProjectStore((s) => s.objects);
  const [result, setResult] = useState<VolumeResult | null>(null);
  const [existingSurfaceId, setExistingSurfaceId] = useState("");
  const [designSurfaceId, setDesignSurfaceId] = useState("");
  const [gridSpacing, setGridSpacing] = useState(1.0);
  const [mode, setMode] = useState<"surface" | "datum">("surface");
  const [datum, setDatum] = useState(0);
  const [loading, setLoading] = useState(false);

  const surfaces = Array.from(objects.values()).filter(
    (o) => o.type === "surface"
  );

  const handleCompute = async () => {
    setLoading(true);
    try {
      if (mode === "surface") {
        if (!existingSurfaceId || !designSurfaceId) return;
        const vol = await computeVolume(
          existingSurfaceId,
          designSurfaceId,
          gridSpacing
        );
        setResult(vol);
      } else {
        if (!existingSurfaceId) return;
        const vol = await computeDatumVolume(
          existingSurfaceId,
          datum,
          gridSpacing
        );
        setResult(vol);
      }
    } catch (err) {
      console.error("Volume computation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Quantity Takeoff / Earthwork
      </h3>

      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            className={`px-2 py-1 text-xs rounded ${
              mode === "surface"
                ? "bg-accent text-white"
                : "bg-surface-secondary text-text-muted"
            }`}
            onClick={() => setMode("surface")}
          >
            Surface vs Surface
          </button>
          <button
            className={`px-2 py-1 text-xs rounded ${
              mode === "datum"
                ? "bg-accent text-white"
                : "bg-surface-secondary text-text-muted"
            }`}
            onClick={() => setMode("datum")}
          >
            Surface vs Datum
          </button>
        </div>

        <label className="block text-xs text-text-muted">
          {mode === "surface" ? "Existing Ground Surface" : "Surface"}
        </label>
        <select
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={existingSurfaceId}
          onChange={(e) => setExistingSurfaceId(e.target.value)}
        >
          <option value="">Select surface...</option>
          {surfaces.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {mode === "surface" ? (
          <>
            <label className="block text-xs text-text-muted">
              Design Surface
            </label>
            <select
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={designSurfaceId}
              onChange={(e) => setDesignSurfaceId(e.target.value)}
            >
              <option value="">Select surface...</option>
              {surfaces.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label className="block text-xs text-text-muted">
              Datum Elevation (m)
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={datum}
              onChange={(e) => setDatum(parseFloat(e.target.value) || 0)}
            />
          </>
        )}

        <label className="block text-xs text-text-muted">
          Grid Spacing (m)
        </label>
        <input
          type="number"
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={gridSpacing}
          onChange={(e) => setGridSpacing(parseFloat(e.target.value) || 1)}
          min={0.1}
          step={0.5}
        />

        <button
          className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
          onClick={handleCompute}
          disabled={loading || !existingSurfaceId}
        >
          {loading ? "Computing..." : "Compute Volumes"}
        </button>
      </div>

      {result && (
        <div className="space-y-1.5 border-t border-border pt-2">
          <h4 className="text-xs font-semibold text-text-secondary">
            Results
          </h4>
          <VolumeRow label="Cut Volume" value={`${result.cut_volume.toFixed(1)} m³`} />
          <VolumeRow label="Fill Volume" value={`${result.fill_volume.toFixed(1)} m³`} />
          <VolumeRow
            label="Net Volume"
            value={`${result.net_volume.toFixed(1)} m³`}
            highlight
          />
          <VolumeRow label="Cut Area" value={`${result.cut_area.toFixed(1)} m²`} />
          <VolumeRow label="Fill Area" value={`${result.fill_area.toFixed(1)} m²`} />
        </div>
      )}
    </div>
  );
}

function VolumeRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className={highlight ? "text-text-primary font-medium" : "text-text-muted"}>
        {label}
      </span>
      <span className="text-text-primary font-mono">{value}</span>
    </div>
  );
}
