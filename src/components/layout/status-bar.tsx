import { useUIStore } from "@/stores/ui-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useProjectStore } from "@/stores/project-store";
import { useEducationStore } from "@/stores/education-store";

const WS_LABELS: Record<string, string> = {
  home: "Home",
  surface: "Surface",
  design: "Design",
  drainage: "Drainage",
  docs: "Docs",
  automation: "Automation",
};

export function StatusBar() {
  const statusMessage = useUIStore((s) => s.statusMessage);
  const isLoading = useUIStore((s) => s.isLoading);
  const viewMode = useViewportStore((s) => s.viewMode);
  const cameraPosition = useViewportStore((s) => s.cameraPosition);
  const objects = useProjectStore((s) => s.objects);
  const mode = useEducationStore((s) => s.mode);
  const activeWorkspace = useUIStore((s) => s.activeWorkspace);
  const professionalMode = useUIStore((s) => s.professionalMode);
  const toggleProfessionalMode = useUIStore((s) => s.toggleProfessionalMode);

  return (
    <div className="h-7 bg-surface-raised border-t border-border flex items-center px-3 text-[11px] text-text-secondary shrink-0">
      <div className="flex items-center gap-1.5">
        {isLoading && (
          <div className="w-3 h-3 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        )}
        <span>{statusMessage}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <span className="text-text-muted">
          {WS_LABELS[activeWorkspace] ?? activeWorkspace}
        </span>

        <span>Objects: {objects.size}</span>
        <span>View: {viewMode.toUpperCase()}</span>
        <span>
          Pos: {cameraPosition.map((v) => v.toFixed(0)).join(", ")}
        </span>

        <span
          className={`px-1.5 py-0.5 rounded text-[10px] ${
            mode === "beginner"
              ? "bg-green-900/50 text-green-400"
              : mode === "guided"
                ? "bg-blue-900/50 text-blue-400"
                : "bg-neutral-800 text-neutral-400"
          }`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </span>

        <button
          onClick={toggleProfessionalMode}
          className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
            professionalMode
              ? "bg-amber-900/50 text-amber-400 hover:bg-amber-900/70"
              : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
          }`}
          title={
            professionalMode
              ? "Switch to Standard mode"
              : "Switch to Professional mode"
          }
        >
          {professionalMode ? "PRO" : "STD"}
        </button>
      </div>
    </div>
  );
}
