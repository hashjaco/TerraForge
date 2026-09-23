import { useState } from "react";
import { validateProject } from "@/lib/tauri-bridge";
import type { ValidationResult } from "@/lib/types/civil-objects";

export function ValidationPanel() {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async () => {
    setLoading(true);
    try {
      const res = await validateProject();
      setResult(res);
    } catch (err) {
      console.error("Validation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          Design Validation
        </h3>
        <button
          className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
          onClick={handleValidate}
          disabled={loading}
        >
          {loading ? "Checking..." : "Run Checks"}
        </button>
      </div>

      {result && (
        <div className="space-y-2">
          <div className="flex gap-2 text-xs">
            {result.error_count > 0 && (
              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                {result.error_count} Error{result.error_count !== 1 ? "s" : ""}
              </span>
            )}
            {result.warning_count > 0 && (
              <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">
                {result.warning_count} Warning{result.warning_count !== 1 ? "s" : ""}
              </span>
            )}
            {result.info_count > 0 && (
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                {result.info_count} Info
              </span>
            )}
            {result.issues.length === 0 && (
              <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded">
                All checks passed
              </span>
            )}
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            {result.issues.map((issue, i) => (
              <div
                key={i}
                className={`px-2 py-1.5 text-xs rounded border-l-2 ${
                  issue.severity === "Error"
                    ? "border-red-500 bg-red-500/5"
                    : issue.severity === "Warning"
                      ? "border-yellow-500 bg-yellow-500/5"
                      : "border-blue-500 bg-blue-500/5"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-medium ${
                      issue.severity === "Error"
                        ? "text-red-400"
                        : issue.severity === "Warning"
                          ? "text-yellow-400"
                          : "text-blue-400"
                    }`}
                  >
                    {issue.category}
                  </span>
                  {issue.station !== null && (
                    <span className="text-text-muted">
                      @ Sta {issue.station.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-text-muted mt-0.5">{issue.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
