import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import * as bridge from "@/lib/tauri-bridge";

interface PipeResult {
  pipe_id: string;
  capacity: number;
  velocity: number;
  is_adequate: boolean;
}

export function FlowAnalysis() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);
  const setStatus = useUIStore((s) => s.setStatusMessage);
  const [results, setResults] = useState<PipeResult[]>([]);

  const network =
    selectedIds.length === 1 ? objects.get(selectedIds[0]) : undefined;

  async function runAnalysis() {
    if (!network || network.type !== "pipe-network") return;

    setStatus("Running hydraulic analysis...");
    try {
      const result = await bridge.analyzeNetwork(network.id);
      setResults(result.pipe_hydraulics);
      setStatus(
        `Analysis complete: ${result.component_count} connected component(s)`
      );
    } catch (err) {
      setStatus(`Error: ${err}`);
    }
  }

  if (!network || network.type !== "pipe-network") {
    return (
      <div className="p-3">
        <p className="text-xs text-text-muted italic">
          Select a pipe network to run flow analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Flow Analysis
      </h3>

      <Button variant="primary" size="sm" onClick={runAnalysis} className="w-full" data-tutorial-id="flow-analysis">
        Run Analysis
      </Button>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((r) => (
            <div
              key={r.pipe_id}
              className={`p-2 rounded text-xs ${
                r.is_adequate
                  ? "bg-green-900/20 border border-green-800/30"
                  : "bg-red-900/20 border border-red-800/30"
              }`}
            >
              <div className="flex justify-between">
                <span className="text-text-muted font-mono truncate max-w-[100px]">
                  {r.pipe_id.slice(0, 8)}
                </span>
                <span className={r.is_adequate ? "text-green-400" : "text-red-400"}>
                  {r.is_adequate ? "OK" : "FAIL"}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-text-muted">
                  Q: {r.capacity.toFixed(3)} m³/s
                </span>
                <span className="text-text-muted">
                  V: {r.velocity.toFixed(2)} m/s
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
