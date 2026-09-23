import { useState } from "react";
import { useEducationStore } from "@/stores/education-store";
import { CIVIL_TOOLTIPS } from "./tooltip-system";

export function TooltipGlossary() {
  const mode = useEducationStore((s) => s.mode);
  const showTooltips = useEducationStore((s) => s.showTooltips);
  const toggleTooltips = useEducationStore((s) => s.toggleTooltips);
  const [expanded, setExpanded] = useState(false);

  if (mode === "expert") return null;

  const toggle = () => setExpanded((v) => !v);

  return (
    <div className="fixed bottom-12 right-3 z-40">
      <button
        onClick={toggle}
        className="px-2.5 py-1.5 rounded-lg bg-surface-raised border border-border text-[11px] text-text-secondary hover:text-text-primary transition-colors shadow-lg"
      >
        {expanded ? "Hide Glossary" : "Glossary"}
      </button>

      {expanded && (
        <div className="absolute bottom-full right-0 mb-1 w-72 max-h-80 overflow-y-auto bg-surface-raised border border-border rounded-xl shadow-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-text-secondary uppercase">
              Civil Engineering Terms
            </h4>
            <button
              onClick={toggleTooltips}
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                showTooltips
                  ? "bg-primary-800 text-primary-200"
                  : "bg-surface-overlay text-text-muted"
              }`}
            >
              {showTooltips ? "On" : "Off"}
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(CIVIL_TOOLTIPS).map(([term, explanation]) => (
              <div key={term}>
                <div className="text-xs font-medium text-primary-400">
                  {term}
                </div>
                <div className="text-[11px] text-text-muted leading-relaxed">
                  {explanation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
