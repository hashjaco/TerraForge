import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useHistoryStore } from "@/stores/history-store";
import { useProjectStore } from "@/stores/project-store";

async function handleSave() {
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({
      filters: [{ name: "TerraForge Project", extensions: ["terra"] }],
      defaultPath: "project.terra",
    });
    if (path) {
      const { saveProject } = await import("@/lib/tauri-bridge");
      await saveProject(path);
      useUIStore.getState().setStatusMessage("Project saved");
    }
  } catch {
    useUIStore.getState().setStatusMessage("Save failed or cancelled");
  }
}

async function handleOpen() {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const path = await open({
      filters: [{ name: "TerraForge Project", extensions: ["terra"] }],
      multiple: false,
    });
    if (path && typeof path === "string") {
      const bridge = await import("@/lib/tauri-bridge");
      const snapshot = await bridge.loadProject(path);

      const store = useProjectStore.getState();
      store.clearProject();
      store.setProjectName(snapshot.name);

      useUIStore.getState().setStatusMessage(
        `Loaded: ${snapshot.surface_count} surfaces, ${snapshot.alignment_count} alignments`
      );
    }
  } catch {
    useUIStore.getState().setStatusMessage("Open failed or cancelled");
  }
}

export function Toolbar() {
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);
  const viewMode = useViewportStore((s) => s.viewMode);
  const setViewMode = useViewportStore((s) => s.setViewMode);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const showGrid = useViewportStore((s) => s.showGrid);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const projectName = useProjectStore((s) => s.name);
  const toggleTimeline = () => useUIStore.getState().togglePanel("timeline");

  const selectedObj =
    selectedIds.length === 1 ? objects.get(selectedIds[0]) : null;

  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener("terraforge:save", handler);
    return () => window.removeEventListener("terraforge:save", handler);
  }, []);

  return (
    <div className="h-12 bg-surface-raised border-b border-border flex items-center px-3 gap-2 shrink-0">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded bg-primary-600 flex items-center justify-center text-xs font-bold">
          TF
        </div>
        <span className="text-sm font-medium text-text-primary">
          {projectName}
        </span>
      </div>

      <div className="h-6 w-px bg-border" />

      <ToolbarButton label="Open" shortcut="Ctrl+O" onClick={handleOpen} />
      <ToolbarButton label="Save" shortcut="Ctrl+S" onClick={handleSave} />

      <div className="h-6 w-px bg-border" />

      <ToolbarButton
        label="Undo"
        shortcut="Ctrl+Z"
        disabled={!canUndo}
        onClick={undo}
      />
      <ToolbarButton
        label="Redo"
        shortcut="Ctrl+Y"
        disabled={!canRedo}
        onClick={redo}
      />

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1 bg-surface-overlay rounded-md p-0.5">
        {(["3d", "plan", "profile", "cross-section"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-2.5 py-1 text-xs rounded transition-colors ${
              viewMode === mode
                ? "bg-primary-700 text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {mode === "cross-section" ? "X-SEC" : mode.toUpperCase()}
          </button>
        ))}
      </div>

      <ToolbarButton
        label="Grid"
        active={showGrid}
        onClick={toggleGrid}
      />
      <ToolbarButton
        label="History"
        onClick={toggleTimeline}
      />

      <div className="h-6 w-px bg-border" />

      {selectedObj && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">
            Selected: {selectedObj.name} ({selectedObj.type})
          </span>
        </div>
      )}

      <div className="flex-1" />

      <button
        onClick={toggleCommandPalette}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-overlay text-text-secondary text-xs hover:text-text-primary transition-colors"
      >
        <span>Search commands...</span>
        <kbd className="px-1.5 py-0.5 bg-surface rounded text-[10px] text-text-muted border border-border">
          Ctrl+K
        </kbd>
      </button>
    </div>
  );
}

function ToolbarButton({
  label,
  shortcut,
  disabled,
  active,
  onClick,
}: {
  label: string;
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`px-2.5 py-1 text-xs rounded transition-colors ${
        disabled
          ? "text-text-muted cursor-not-allowed"
          : active
            ? "bg-primary-800 text-primary-200"
            : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}
