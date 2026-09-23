import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import {
  createFeatureLine,
  createGrading,
  extractFeatureLineFromSurface,
} from "@/lib/tauri-bridge";

export function GradingPanel() {
  const objects = useProjectStore((s) => s.objects);
  const addObject = useProjectStore((s) => s.addObject);
  const [activeTab, setActiveTab] = useState<"feature-line" | "grading">(
    "feature-line"
  );

  const surfaces = Array.from(objects.values()).filter(
    (o) => o.type === "surface"
  );
  const featureLines = Array.from(objects.values()).filter(
    (o) => o.type === "feature-line"
  );

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Grading Tools
      </h3>

      <div className="flex gap-1">
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "feature-line"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("feature-line")}
        >
          Feature Lines
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "grading"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("grading")}
        >
          Grading
        </button>
      </div>

      {activeTab === "feature-line" && (
        <FeatureLineCreator surfaces={surfaces} onCreated={addObject} />
      )}
      {activeTab === "grading" && (
        <GradingCreator
          featureLines={featureLines}
          surfaces={surfaces}
          onCreated={addObject}
        />
      )}
    </div>
  );
}

function FeatureLineCreator({
  surfaces,
  onCreated,
}: {
  surfaces: any[];
  onCreated: (obj: any) => void;
}) {
  const [name, setName] = useState("Feature Line 1");
  const [vertexInput, setVertexInput] = useState("");

  const handleCreate = async () => {
    const lines = vertexInput.trim().split("\n");
    const vertices: [number, number, number][] = lines
      .map((line) => {
        const parts = line.split(/[,\s\t]+/).map(Number);
        if (parts.length >= 3) return [parts[0], parts[1], parts[2]] as [number, number, number];
        return null;
      })
      .filter(Boolean) as [number, number, number][];

    if (vertices.length < 2) return;

    try {
      const result = await createFeatureLine(name, vertices);
      onCreated({
        id: result.id,
        name: result.name,
        type: "feature-line" as const,
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          vertexCount: result.vertex_count,
          totalLength: result.total_length,
          vertices: result.vertices,
        },
      });
    } catch (err) {
      console.error("Failed to create feature line:", err);
    }
  };

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Feature line name"
      />
      <textarea
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded h-20 font-mono"
        value={vertexInput}
        onChange={(e) => setVertexInput(e.target.value)}
        placeholder="x, y, z (one vertex per line)"
      />
      <button
        className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90"
        onClick={handleCreate}
      >
        Create Feature Line
      </button>
    </div>
  );
}

function GradingCreator({
  featureLines,
  surfaces,
  onCreated,
}: {
  featureLines: any[];
  surfaces: any[];
  onCreated: (obj: any) => void;
}) {
  const [name, setName] = useState("Grading 1");
  const [featureLineId, setFeatureLineId] = useState("");
  const [targetType, setTargetType] = useState("elevation");
  const [targetValue, setTargetValue] = useState(0);
  const [cutSlope, setCutSlope] = useState(2);
  const [fillSlope, setFillSlope] = useState(3);
  const [side, setSide] = useState("both");

  const handleCreate = async () => {
    if (!featureLineId) return;
    try {
      await createGrading(
        name,
        featureLineId,
        targetType,
        targetValue,
        cutSlope,
        fillSlope,
        side
      );
    } catch (err) {
      console.error("Failed to create grading:", err);
    }
  };

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Grading name"
      />

      <label className="block text-xs text-text-muted">Feature Line</label>
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={featureLineId}
        onChange={(e) => setFeatureLineId(e.target.value)}
      >
        <option value="">Select...</option>
        {featureLines.map((fl) => (
          <option key={fl.id} value={fl.id}>{fl.name}</option>
        ))}
      </select>

      <label className="block text-xs text-text-muted">Target</label>
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={targetType}
        onChange={(e) => setTargetType(e.target.value)}
      >
        <option value="elevation">Elevation</option>
        <option value="relative">Relative Elevation</option>
        <option value="distance">Distance</option>
        <option value="surface">Surface</option>
      </select>

      <input
        type="number"
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={targetValue}
        onChange={(e) => setTargetValue(parseFloat(e.target.value) || 0)}
        placeholder="Target value"
      />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted">Cut Slope</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={cutSlope}
            onChange={(e) => setCutSlope(parseFloat(e.target.value) || 2)}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Fill Slope</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={fillSlope}
            onChange={(e) => setFillSlope(parseFloat(e.target.value) || 3)}
          />
        </div>
      </div>

      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={side}
        onChange={(e) => setSide(e.target.value)}
      >
        <option value="both">Both Sides</option>
        <option value="left">Left</option>
        <option value="right">Right</option>
      </select>

      <button
        className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
        onClick={handleCreate}
        disabled={!featureLineId}
      >
        Create Grading
      </button>
    </div>
  );
}
