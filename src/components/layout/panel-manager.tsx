import { useUIStore } from "@/stores/ui-store";

export type PanelId =
  | "object-tree"
  | "properties"
  | "profile-editor"
  | "template-editor"
  | "pipe-editor"
  | "timeline"
  | "analysis"
  | "tutorials";

const PANEL_LABELS: Record<PanelId, string> = {
  "object-tree": "Object Tree",
  properties: "Properties",
  "profile-editor": "Profile Editor",
  "template-editor": "Template Editor",
  "pipe-editor": "Pipe Network Editor",
  timeline: "Timeline",
  analysis: "Analysis",
  tutorials: "Tutorials",
};

export function PanelManager() {
  const panels = useUIStore((s) => s.panels);
  const togglePanel = useUIStore((s) => s.togglePanel);

  return (
    <div className="p-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-2">
        Panels
      </h3>
      <div className="space-y-1">
        {(Object.keys(PANEL_LABELS) as PanelId[]).map((id) => (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 hover:bg-surface-overlay transition-colors"
          >
            <span
              className={`w-3 h-3 rounded-sm border ${
                panels[id]?.visible
                  ? "bg-primary-600 border-primary-500"
                  : "border-border"
              }`}
            />
            <span className="text-text-primary">{PANEL_LABELS[id]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
