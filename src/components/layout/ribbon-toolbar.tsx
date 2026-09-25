import { useEffect } from "react";
import {
  useUIStore,
  type WorkspaceId,
  type ActivePanel,
  type PanelId,
} from "@/stores/ui-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useHistoryStore } from "@/stores/history-store";
import { useProjectStore } from "@/stores/project-store";
import { useEducationStore } from "@/stores/education-store";

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

interface ToolDef {
  id: string;
  label: string;
  shortcut?: string;
  action: () => void;
  active?: boolean;
  disabled?: boolean;
}

interface ToolGroup {
  label: string;
  tools: ToolDef[];
}

const WORKSPACE_META: Record<
  WorkspaceId,
  { label: string; description: string }
> = {
  home: { label: "Home", description: "File operations, views, and general tools" },
  surface: { label: "Surface", description: "Terrain creation, analysis, and volumes" },
  design: { label: "Design", description: "Alignments, corridors, grading, and parcels" },
  drainage: { label: "Drainage", description: "Pipe networks, catchments, and stormwater" },
  docs: { label: "Docs", description: "Sheets, validation, and plan production" },
  automation: { label: "Automation", description: "Visual scripting and design optimization" },
};

const STANDARD_WORKSPACES: WorkspaceId[] = ["home", "surface", "design"];
const ALL_WORKSPACES: WorkspaceId[] = [
  "home",
  "surface",
  "design",
  "drainage",
  "docs",
  "automation",
];

function openPanel(panel: ActivePanel) {
  useUIStore.getState().setActivePanel(panel);
}

function openBottomPanel(id: PanelId) {
  useUIStore.getState().setPanelVisible(id, true);
}

function useHomeTools(): ToolGroup[] {
  const viewMode = useViewportStore((s) => s.viewMode);
  const setViewMode = useViewportStore((s) => s.setViewMode);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const showGrid = useViewportStore((s) => s.showGrid);
  const toggleContours = useViewportStore((s) => s.toggleContours);
  const showContours = useViewportStore((s) => s.showContours);
  const canUndo = useHistoryStore((s) => s.canUndo);
  const canRedo = useHistoryStore((s) => s.canRedo);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const toggleLabels = useViewportStore((s) => s.toggleLabels);
  const showLabels = useViewportStore((s) => s.showLabels);

  return [
    {
      label: "File",
      tools: [
        { id: "open", label: "Open", shortcut: "Ctrl+O", action: handleOpen },
        { id: "save", label: "Save", shortcut: "Ctrl+S", action: handleSave },
      ],
    },
    {
      label: "Edit",
      tools: [
        { id: "undo", label: "Undo", shortcut: "Ctrl+Z", action: undo, disabled: !canUndo },
        { id: "redo", label: "Redo", shortcut: "Ctrl+Y", action: redo, disabled: !canRedo },
        {
          id: "history",
          label: "History",
          action: () => openBottomPanel("timeline"),
        },
      ],
    },
    {
      label: "View",
      tools: [
        { id: "view-3d", label: "3D", action: () => setViewMode("3d"), active: viewMode === "3d" },
        { id: "view-plan", label: "Plan", action: () => setViewMode("plan"), active: viewMode === "plan" },
        { id: "view-profile", label: "Profile", action: () => setViewMode("profile"), active: viewMode === "profile" },
        { id: "view-xsec", label: "X-Sec", action: () => setViewMode("cross-section"), active: viewMode === "cross-section" },
      ],
    },
    {
      label: "Display",
      tools: [
        { id: "grid", label: "Grid", action: toggleGrid, active: showGrid },
        { id: "contours", label: "Contours", action: toggleContours, active: showContours },
        { id: "labels", label: "Labels", action: toggleLabels, active: showLabels },
      ],
    },
  ];
}

function useSurfaceTools(): ToolGroup[] {
  return [
    {
      label: "Create",
      tools: [
        { id: "surf-create", label: "New Surface", action: () => openPanel("surface-create") },
        { id: "surf-import", label: "Import", action: () => openPanel("surface-import") },
      ],
    },
    {
      label: "Analysis",
      tools: [
        {
          id: "surf-analysis",
          label: "Analysis",
          action: () => useUIStore.getState().setPanelVisible("analysis", true),
        },
      ],
    },
    {
      label: "Volumes",
      tools: [
        { id: "qto", label: "Quantity Takeoff", action: () => openBottomPanel("qto") },
      ],
    },
  ];
}

function useDesignTools(): ToolGroup[] {
  return [
    {
      label: "Horizontal",
      tools: [
        { id: "alignment", label: "Alignment", action: () => openPanel("alignment") },
        { id: "intersection", label: "Intersection", action: () => openPanel("intersection") },
      ],
    },
    {
      label: "Vertical",
      tools: [
        { id: "profile", label: "Profile", action: () => openPanel("profile") },
        { id: "corridor", label: "Corridor", action: () => openPanel("corridor") },
      ],
    },
    {
      label: "Site",
      tools: [
        { id: "grading", label: "Grading", action: () => openPanel("grading") },
        { id: "parcel", label: "Parcels", action: () => openPanel("parcel") },
        { id: "survey", label: "Survey", action: () => openPanel("survey") },
      ],
    },
  ];
}

function useDrainageTools(): ToolGroup[] {
  return [
    {
      label: "Networks",
      tools: [
        { id: "pipe-net", label: "Pipe Network", action: () => openPanel("pipe-network") },
        { id: "pressure-net", label: "Pressure Network", action: () => openPanel("pressure-network") },
      ],
    },
    {
      label: "Hydrology",
      tools: [
        { id: "drainage", label: "Catchments", action: () => openPanel("drainage") },
      ],
    },
  ];
}

function useDocsTools(): ToolGroup[] {
  return [
    {
      label: "Production",
      tools: [
        { id: "sheets", label: "Sheet Generator", action: () => openBottomPanel("sheets") },
      ],
    },
    {
      label: "Quality",
      tools: [
        {
          id: "validate",
          label: "Design Checks",
          action: () => useUIStore.getState().setPanelVisible("validation", true),
        },
      ],
    },
  ];
}

function useAutomationTools(): ToolGroup[] {
  return [
    {
      label: "Scripting",
      tools: [
        {
          id: "node-editor",
          label: "Node Editor",
          action: () => useUIStore.getState().setPanelVisible("node-editor", true),
        },
      ],
    },
  ];
}

function useWorkspaceTools(ws: WorkspaceId): ToolGroup[] {
  const home = useHomeTools();
  const surface = useSurfaceTools();
  const design = useDesignTools();
  const drain = useDrainageTools();
  const docs = useDocsTools();
  const auto = useAutomationTools();

  switch (ws) {
    case "home": return home;
    case "surface": return surface;
    case "design": return design;
    case "drainage": return drain;
    case "docs": return docs;
    case "automation": return auto;
  }
}

export function RibbonToolbar() {
  const activeWorkspace = useUIStore((s) => s.activeWorkspace);
  const setActiveWorkspace = useUIStore((s) => s.setActiveWorkspace);
  const ribbonCollapsed = useUIStore((s) => s.ribbonCollapsed);
  const toggleRibbon = useUIStore((s) => s.toggleRibbon);
  const professionalMode = useUIStore((s) => s.professionalMode);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const projectName = useProjectStore((s) => s.name);

  const guidanceVisible = useEducationStore((s) => s.guidanceVisible);
  const educationMode = useEducationStore((s) => s.mode);
  const dismissedTips = useEducationStore((s) => s.dismissedTips);
  const dismissTip = useEducationStore((s) => s.dismissTip);

  const groups = useWorkspaceTools(activeWorkspace);
  const visibleWorkspaces = professionalMode ? ALL_WORKSPACES : STANDARD_WORKSPACES;

  const tipId = `ws-tip-${activeWorkspace}`;
  const showTip =
    guidanceVisible &&
    educationMode !== "expert" &&
    !dismissedTips.includes(tipId);

  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener("terraforge:save", handler);
    return () => window.removeEventListener("terraforge:save", handler);
  }, []);

  return (
    <div className="shrink-0 bg-surface-raised border-b border-border select-none">
      {/* Tab bar row */}
      <div className="flex items-center h-9 px-2 gap-0.5">
        <div className="flex items-center gap-1.5 mr-3 shrink-0">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-[10px] font-bold text-white">
            TF
          </div>
          <span className="text-xs font-medium text-text-primary truncate max-w-[120px]">
            {projectName}
          </span>
        </div>

        <div className="h-5 w-px bg-border mx-1" />

        {visibleWorkspaces.map((ws) => (
          <button
            key={ws}
            onClick={() => setActiveWorkspace(ws)}
            onDoubleClick={toggleRibbon}
            title={WORKSPACE_META[ws].description}
            aria-current={activeWorkspace === ws ? "page" : undefined}
            data-tutorial-id={`workspace-${ws}`}
            className={`px-3 py-1 text-[11px] font-medium rounded-t transition-colors duration-150 ${
              activeWorkspace === ws
                ? "bg-surface text-primary-400 border-x border-t border-border -mb-px shadow-[inset_0_2px_0_var(--tf-accent)]"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
            }`}
          >
            {WORKSPACE_META[ws].label}
          </button>
        ))}

        {!professionalMode && (
          <button
            onClick={() => useUIStore.getState().toggleProfessionalMode()}
            className="px-2 py-1 text-[10px] text-text-muted hover:text-text-secondary transition-colors"
            title="Show all workspace tabs (Professional mode)"
          >
            More...
          </button>
        )}

        <div className="flex-1" />

        <button
          onClick={toggleCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-overlay text-text-secondary text-[11px] hover:text-text-primary transition-colors"
        >
          <span>Commands</span>
          <kbd className="px-1 py-0.5 bg-surface rounded text-[9px] text-text-muted border border-border">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Tool strip */}
      {!ribbonCollapsed && (
        <div key={activeWorkspace} className="flex items-stretch h-11 px-2 gap-0 border-t border-border/50 bg-surface animate-fade-up">
          {groups.map((group, gi) => (
            <div key={gi} className="flex items-center">
              {gi > 0 && <div className="w-px h-7 bg-border mx-1.5" />}
              <div className="flex items-center gap-0.5 px-1">
                {group.tools.map((tool) => (
                  <button
                    key={tool.id}
                    onClick={tool.action}
                    disabled={tool.disabled}
                    title={tool.shortcut ? `${tool.label} (${tool.shortcut})` : tool.label}
                    data-tutorial-id={`tool-${tool.id}`}
                    aria-pressed={tool.active || undefined}
                    className={`px-2.5 py-1.5 text-[11px] rounded transition-[color,background-color,box-shadow,transform] duration-150 active:scale-[0.97] ${
                      tool.disabled
                        ? "text-text-muted cursor-not-allowed opacity-40"
                        : tool.active
                          ? "bg-primary-500/15 text-primary-300 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--tf-accent)_45%,transparent)]"
                          : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
                    }`}
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
              <span className="text-[9px] text-text-muted px-0.5 self-end pb-1 whitespace-nowrap">
                {group.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Contextual guidance tip */}
      {showTip && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-950/40 border-t border-primary-900/30 text-[11px] text-primary-300">
          <span className="flex-1">{WORKSPACE_META[activeWorkspace].description}</span>
          <button
            onClick={() => dismissTip(tipId)}
            className="text-primary-500 hover:text-primary-300 text-[10px] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
