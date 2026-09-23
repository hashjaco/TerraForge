import { useState } from "react";
import { useEducationStore } from "@/stores/education-store";

interface FieldHintProps {
  label: string;
  hint: string;
  children: React.ReactNode;
}

export function FieldHint({ label, hint, children }: FieldHintProps) {
  const showTooltips = useEducationStore((s) => s.showTooltips);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <div className="flex items-center gap-1 mb-1">
        <label className="text-xs text-text-muted">{label}</label>
        {showTooltips && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-3.5 h-3.5 rounded-full bg-primary-900/40 text-primary-400 text-[9px] flex items-center justify-center hover:bg-primary-800/50 transition-colors shrink-0"
            title={hint}
          >
            ?
          </button>
        )}
      </div>
      {expanded && showTooltips && (
        <p className="text-[10px] text-primary-300/70 mb-1.5 leading-relaxed bg-primary-950/30 rounded px-2 py-1">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}
