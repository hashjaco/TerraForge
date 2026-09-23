import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import {
  createCatchment,
  analyzeCatchment,
  createChannel,
  createPond,
  createUndergroundStorage,
} from "@/lib/tauri-bridge";

export function DrainagePanel() {
  const [activeTab, setActiveTab] = useState<
    "catchment" | "channel" | "pond" | "storage"
  >("catchment");

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Drainage Design
      </h3>

      <div className="flex gap-1 flex-wrap">
        {(["catchment", "channel", "pond", "storage"] as const).map((tab) => (
          <button
            key={tab}
            className={`px-2 py-1 text-xs rounded capitalize ${
              activeTab === tab
                ? "bg-accent text-white"
                : "bg-surface-secondary text-text-muted"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "catchment" && <CatchmentCreator />}
      {activeTab === "channel" && <ChannelCreator />}
      {activeTab === "pond" && <PondCreator />}
      {activeTab === "storage" && <StorageCreator />}
    </div>
  );
}

function CatchmentCreator() {
  const [name, setName] = useState("Catchment 1");
  const [runoffCoeff, setRunoffCoeff] = useState(0.6);
  const [rainfall, setRainfall] = useState(50);
  const [analysis, setAnalysis] = useState<{
    peak_flow: number;
    volume: number;
  } | null>(null);

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs text-text-muted">Runoff Coeff (C)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={runoffCoeff}
            onChange={(e) => setRunoffCoeff(parseFloat(e.target.value) || 0.6)}
            step={0.05}
            min={0}
            max={1}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Rainfall (mm/hr)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={rainfall}
            onChange={(e) => setRainfall(parseFloat(e.target.value) || 50)}
          />
        </div>
      </div>
      <p className="text-xs text-text-muted italic">
        Draw catchment boundary in viewport to define area.
      </p>

      {analysis && (
        <div className="space-y-1 border-t border-border pt-2">
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Peak Flow</span>
            <span className="text-text-primary font-mono">{analysis.peak_flow.toFixed(3)} m³/s</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-text-muted">Volume</span>
            <span className="text-text-primary font-mono">{analysis.volume.toFixed(1)} m³</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ChannelCreator() {
  const [name, setName] = useState("Channel 1");
  const [sectionType, setSectionType] = useState("trapezoidal");
  const [bottomWidth, setBottomWidth] = useState(2);
  const [sideSlope, setSideSlope] = useState(2);
  const [depth, setDepth] = useState(1);

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="block text-xs text-text-muted">Section Type</label>
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={sectionType}
        onChange={(e) => setSectionType(e.target.value)}
      >
        <option value="trapezoidal">Trapezoidal</option>
        <option value="v-ditch">V-Ditch</option>
        <option value="rectangular">Rectangular</option>
      </select>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-text-muted">Width (m)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={bottomWidth}
            onChange={(e) => setBottomWidth(parseFloat(e.target.value) || 2)}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Side Slope</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={sideSlope}
            onChange={(e) => setSideSlope(parseFloat(e.target.value) || 2)}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Depth (m)</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={depth}
            onChange={(e) => setDepth(parseFloat(e.target.value) || 1)}
          />
        </div>
      </div>
    </div>
  );
}

function PondCreator() {
  const [name, setName] = useState("Pond 1");
  const [pondType, setPondType] = useState("detention");
  const [maxDepth, setMaxDepth] = useState(3);

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={pondType}
        onChange={(e) => setPondType(e.target.value)}
      >
        <option value="detention">Detention</option>
        <option value="retention">Retention</option>
      </select>
      <div>
        <label className="block text-xs text-text-muted">Max Depth (m)</label>
        <input
          type="number"
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={maxDepth}
          onChange={(e) => setMaxDepth(parseFloat(e.target.value) || 3)}
        />
      </div>
      <p className="text-xs text-text-muted italic">
        Place pond in viewport to set location.
      </p>
    </div>
  );
}

function StorageCreator() {
  const [name, setName] = useState("UG Storage 1");
  const [storageType, setStorageType] = useState("box");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(1.5);
  const [length, setLength] = useState(10);

  return (
    <div className="space-y-2">
      <input
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <select
        className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
        value={storageType}
        onChange={(e) => setStorageType(e.target.value)}
      >
        <option value="box">Box Chamber</option>
        <option value="pipe-arch">Pipe Arch</option>
      </select>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs text-text-muted">Width</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={width}
            onChange={(e) => setWidth(parseFloat(e.target.value) || 2)}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Height</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={height}
            onChange={(e) => setHeight(parseFloat(e.target.value) || 1.5)}
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted">Length</label>
          <input
            type="number"
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
            value={length}
            onChange={(e) => setLength(parseFloat(e.target.value) || 10)}
          />
        </div>
      </div>
    </div>
  );
}
