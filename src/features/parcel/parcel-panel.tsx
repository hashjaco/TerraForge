import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import { createParcel, subdivideParcel, importGeoJsonParcels } from "@/lib/tauri-bridge";

export function ParcelPanel() {
  const objects = useProjectStore((s) => s.objects);
  const addObject = useProjectStore((s) => s.addObject);
  const [name, setName] = useState("Parcel 1");
  const [number, setNumber] = useState("1");
  const [vertexInput, setVertexInput] = useState("");
  const [activeTab, setActiveTab] = useState<"create" | "subdivide" | "import">("create");

  const parcels = Array.from(objects.values()).filter((o) => o.type === "parcel");

  const handleCreate = async () => {
    const lines = vertexInput.trim().split("\n");
    const vertices: [number, number][] = lines
      .map((line) => {
        const parts = line.split(/[,\s\t]+/).map(Number);
        if (parts.length >= 2) return [parts[0], parts[1]] as [number, number];
        return null;
      })
      .filter(Boolean) as [number, number][];

    if (vertices.length < 3) return;

    try {
      const result = await createParcel(name, number, vertices);
      addObject({
        id: result.id,
        name: result.name,
        type: "parcel",
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: {
          number: result.number,
          area: result.area,
          perimeter: result.perimeter,
          vertices: result.vertices,
        },
      });
    } catch (err) {
      console.error("Failed to create parcel:", err);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Parcel Management
      </h3>

      <div className="flex gap-1">
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "create" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("create")}
        >
          Create
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "subdivide" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("subdivide")}
        >
          Subdivide
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "import" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("import")}
        >
          Import
        </button>
      </div>

      {activeTab === "create" && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              className="px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
            />
            <input
              className="px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Number"
            />
          </div>
          <textarea
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded h-20 font-mono"
            value={vertexInput}
            onChange={(e) => setVertexInput(e.target.value)}
            placeholder="x, y (one vertex per line)"
          />
          <button
            className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90"
            onClick={handleCreate}
          >
            Create Parcel
          </button>
        </div>
      )}

      {activeTab === "subdivide" && <SubdividePanel parcels={parcels} />}
      {activeTab === "import" && <ImportPanel onImported={addObject} />}

      {parcels.length > 0 && (
        <div className="border-t border-border pt-2 space-y-1">
          <h4 className="text-xs font-semibold text-text-secondary">Parcels ({parcels.length})</h4>
          {parcels.map((p: any) => (
            <div key={p.id} className="flex justify-between text-xs px-2 py-1 bg-surface-secondary rounded">
              <span className="text-text-primary">{p.name}</span>
              <span className="text-text-muted font-mono">{p.data?.area?.toFixed(1)} m²</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SubdividePanel({ parcels }: { parcels: any[] }) {
  const [parcelId, setParcelId] = useState("");
  const [frontageWidth, setFrontageWidth] = useState(20);

  return (
    <div className="space-y-2">
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={parcelId}
        onChange={(e) => setParcelId(e.target.value)}
      >
        <option value="">Select parcel...</option>
        {parcels.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <div>
        <label className="block text-xs text-text-muted">Frontage Width (m)</label>
        <input
          type="number"
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={frontageWidth}
          onChange={(e) => setFrontageWidth(parseFloat(e.target.value) || 20)}
        />
      </div>
      <button
        className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
        disabled={!parcelId}
        onClick={async () => {
          if (!parcelId) return;
          try {
            await subdivideParcel(parcelId, frontageWidth, 0);
          } catch (err) {
            console.error(err);
          }
        }}
      >
        Subdivide
      </button>
    </div>
  );
}

function ImportPanel({ onImported }: { onImported: (obj: any) => void }) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-text-muted">
        Import parcels from GeoJSON files containing polygon features.
      </p>
      <button
        className="w-full px-3 py-1.5 text-xs bg-surface-secondary text-text-primary border border-border rounded hover:bg-surface-secondary/80"
        onClick={() => {
          // File selection handled by Tauri dialog in real implementation
        }}
      >
        Select GeoJSON File...
      </button>
    </div>
  );
}
