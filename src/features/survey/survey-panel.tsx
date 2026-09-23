import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";
import {
  createSurveyDatabase,
  addSurveyPoint,
  importSurveyPoints,
  runFieldToFinish,
} from "@/lib/tauri-bridge";

export function SurveyPanel() {
  const addObject = useProjectStore((s) => s.addObject);
  const [dbId, setDbId] = useState("");
  const [dbName, setDbName] = useState("Survey 1");
  const [pointCount, setPointCount] = useState(0);
  const [figureCount, setFigureCount] = useState(0);
  const [pointInput, setPointInput] = useState("");
  const [activeTab, setActiveTab] = useState<"database" | "points" | "figures">("database");

  const handleCreateDb = async () => {
    try {
      const result = await createSurveyDatabase(dbName);
      setDbId(result.id);
      addObject({
        id: result.id,
        name: result.name,
        type: "survey-db" as const,
        dependencies: [],
        dependents: [],
        version: 1,
        visible: true,
        locked: false,
        data: { pointCount: 0, figureCount: 0 } as Record<string, unknown>,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleImportPoints = async () => {
    if (!dbId) return;
    const lines = pointInput.trim().split("\n");
    const points = lines
      .map((line) => {
        const parts = line.split(/[,\s\t]+/);
        if (parts.length >= 3) {
          const x = parseFloat(parts[0]);
          const y = parseFloat(parts[1]);
          const z = parseFloat(parts[2]);
          const code = parts[3] || "";
          const desc = parts.slice(4).join(" ") || "";
          return {
            position: [x, y, z] as [number, number, number],
            code,
            description: desc,
          };
        }
        return null;
      })
      .filter(Boolean) as { position: [number, number, number]; code: string; description: string }[];

    if (points.length === 0) return;

    try {
      const result = await importSurveyPoints(dbId, points);
      setPointCount(result.point_count);
      setFigureCount(result.figure_count);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFieldToFinish = async () => {
    if (!dbId) return;
    try {
      const result = await runFieldToFinish(dbId);
      setFigureCount(result.figure_count);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Survey / COGO Points
      </h3>

      <div className="flex gap-1">
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "database" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("database")}
        >
          Database
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "points" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("points")}
        >
          Points
        </button>
        <button
          className={`px-2 py-1 text-xs rounded ${
            activeTab === "figures" ? "bg-accent text-white" : "bg-surface-secondary text-text-muted"
          }`}
          onClick={() => setActiveTab("figures")}
        >
          Figures
        </button>
      </div>

      {activeTab === "database" && (
        <div className="space-y-2">
          {!dbId ? (
            <>
              <input
                className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                placeholder="Database name"
              />
              <button
                className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90"
                onClick={handleCreateDb}
              >
                Create Survey Database
              </button>
            </>
          ) : (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Database</span>
                <span className="text-text-primary">{dbName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Points</span>
                <span className="text-text-primary font-mono">{pointCount}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Figures</span>
                <span className="text-text-primary font-mono">{figureCount}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "points" && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Enter points as: X, Y, Z, Code, Description
          </p>
          <textarea
            className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded h-24 font-mono"
            value={pointInput}
            onChange={(e) => setPointInput(e.target.value)}
            placeholder="100.0, 200.0, 50.5, TC, Top of Curb"
          />
          <button
            className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
            onClick={handleImportPoints}
            disabled={!dbId}
          >
            Import Points
          </button>
        </div>
      )}

      {activeTab === "figures" && (
        <div className="space-y-2">
          <p className="text-xs text-text-muted">
            Run Field-to-Finish to automatically connect points with matching codes into figures.
          </p>
          <button
            className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
            onClick={handleFieldToFinish}
            disabled={!dbId || pointCount === 0}
          >
            Run Field-to-Finish
          </button>
          {figureCount > 0 && (
            <p className="text-xs text-green-400">{figureCount} figures created</p>
          )}
        </div>
      )}
    </div>
  );
}
