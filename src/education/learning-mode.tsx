import { useEducationStore } from "@/stores/education-store";

type ExperienceMode = "beginner" | "guided" | "expert";

const MODE_INFO: Record<
  ExperienceMode,
  { label: string; description: string; color: string }
> = {
  beginner: {
    label: "Beginner",
    description:
      "All tooltips visible. Guided explanations for every tool and concept. Best for learning.",
    color: "bg-green-900/30 border-green-800/30 text-green-400",
  },
  guided: {
    label: "Guided",
    description:
      "Contextual help on hover. Step-by-step workflows available. Good for intermediate users.",
    color: "bg-blue-900/30 border-blue-800/30 text-blue-400",
  },
  expert: {
    label: "Expert",
    description:
      "Minimal UI, keyboard-driven. No automatic tooltips. Maximum workspace efficiency.",
    color: "bg-neutral-800/50 border-neutral-700/30 text-neutral-400",
  },
};

export function LearningModeSelector() {
  const mode = useEducationStore((s) => s.mode);
  const setMode = useEducationStore((s) => s.setMode);
  const toggleTooltips = useEducationStore((s) => s.toggleTooltips);
  const showTooltips = useEducationStore((s) => s.showTooltips);

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Experience Mode
      </h3>

      <div className="space-y-2">
        {(Object.entries(MODE_INFO) as [ExperienceMode, (typeof MODE_INFO)[ExperienceMode]][]).map(
          ([key, info]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                mode === key
                  ? info.color
                  : "bg-surface-overlay border-border text-text-secondary hover:border-border-active"
              }`}
            >
              <div className="text-sm font-medium">{info.label}</div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {info.description}
              </div>
            </button>
          )
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-text-secondary">Show tooltips</span>
        <button
          onClick={toggleTooltips}
          className={`w-8 h-4 rounded-full transition-colors ${
            showTooltips ? "bg-primary-600" : "bg-neutral-700"
          }`}
        >
          <div
            className={`w-3 h-3 bg-white rounded-full transition-transform mx-0.5 ${
              showTooltips ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
