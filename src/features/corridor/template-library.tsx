import { useTemplateStore } from "@/stores/template-store";
import { useUIStore } from "@/stores/ui-store";
import type { TemplateElement } from "@/lib/types/civil-objects";

interface TemplatePreset {
  name: string;
  description: string;
  elements: TemplateElement[];
}

const PRESETS: TemplatePreset[] = [
  {
    name: "Basic Two-Lane Road",
    description: "3.65m lanes with 1.5m shoulders",
    elements: [
      { type: "lane", width: 3.65, slope: -0.02, side: "left" },
      { type: "lane", width: 3.65, slope: -0.02, side: "right" },
      { type: "shoulder", width: 1.5, slope: -0.04, side: "left" },
      { type: "shoulder", width: 1.5, slope: -0.04, side: "right" },
      { type: "slope", width: 3.0, slope: -0.33, side: "left" },
      { type: "slope", width: 3.0, slope: -0.33, side: "right" },
    ],
  },
  {
    name: "Urban Street",
    description: "Lanes with curbs and sidewalks",
    elements: [
      { type: "lane", width: 3.5, slope: -0.02, side: "left" },
      { type: "lane", width: 3.5, slope: -0.02, side: "right" },
      { type: "curb", width: 0.3, slope: 0.0, side: "left" },
      { type: "curb", width: 0.3, slope: 0.0, side: "right" },
      { type: "sidewalk", width: 2.0, slope: -0.01, side: "left" },
      { type: "sidewalk", width: 2.0, slope: -0.01, side: "right" },
    ],
  },
  {
    name: "Highway",
    description: "Two lanes each direction with median",
    elements: [
      { type: "lane", width: 3.65, slope: -0.02, side: "left" },
      { type: "lane", width: 3.65, slope: -0.02, side: "left" },
      { type: "lane", width: 3.65, slope: -0.02, side: "right" },
      { type: "lane", width: 3.65, slope: -0.02, side: "right" },
      { type: "shoulder", width: 3.0, slope: -0.04, side: "left" },
      { type: "shoulder", width: 3.0, slope: -0.04, side: "right" },
      { type: "slope", width: 4.0, slope: -0.25, side: "left" },
      { type: "slope", width: 4.0, slope: -0.25, side: "right" },
    ],
  },
];

export function TemplateLibrary() {
  const activeTemplateName = useTemplateStore((s) => s.activeTemplateName);
  const setActiveTemplate = useTemplateStore((s) => s.setActiveTemplate);
  const setStatus = useUIStore((s) => s.setStatusMessage);

  function handleSelect(preset: TemplatePreset) {
    setActiveTemplate(preset.name, preset.elements);
    setStatus(`Template "${preset.name}" selected — create a corridor to apply it`);
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Template Library
      </h3>
      <div className="space-y-2">
        {PRESETS.map((preset) => {
          const isActive = activeTemplateName === preset.name;
          return (
            <button
              key={preset.name}
              onClick={() => handleSelect(preset)}
              className={`w-full text-left p-2.5 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary-900/50 ring-1 ring-primary-500"
                  : "bg-surface-overlay hover:bg-neutral-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-primary font-medium">
                  {preset.name}
                </span>
                {isActive && (
                  <span className="text-[10px] text-primary-400 font-medium">Active</span>
                )}
              </div>
              <div className="text-xs text-text-muted mt-0.5">
                {preset.description}
              </div>
              <div className="text-[11px] text-text-muted mt-1">
                {preset.elements.length} elements
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
