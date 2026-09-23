import { Command } from "cmdk";
import { useEffect } from "react";
import { useUIStore, type WorkspaceId, type ActivePanel } from "@/stores/ui-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useEducationStore } from "@/stores/education-store";
import { useHistoryStore } from "@/stores/history-store";

interface CommandItem {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

function ws(id: WorkspaceId) {
  useUIStore.getState().setActiveWorkspace(id);
}

function panel(id: ActivePanel) {
  useUIStore.getState().setActivePanel(id);
}

function bottomPanel(id: "qto" | "sheets" | "timeline") {
  useUIStore.getState().setPanelVisible(id, true);
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const toggle = useUIStore((s) => s.toggleCommandPalette);
  const setViewMode = useViewportStore((s) => s.setViewMode);
  const toggleGrid = useViewportStore((s) => s.toggleGrid);
  const toggleContours = useViewportStore((s) => s.toggleContours);
  const toggleLabels = useViewportStore((s) => s.toggleLabels);
  const resetCamera = useViewportStore((s) => s.resetCamera);
  const togglePanel = useUIStore((s) => s.togglePanel);
  const setMode = useEducationStore((s) => s.setMode);
  const startTutorial = useEducationStore((s) => s.startTutorial);
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);

  const commands: CommandItem[] = [
    // View
    { id: "view-3d", label: "Switch to 3D View", category: "View", action: () => setViewMode("3d") },
    { id: "view-plan", label: "Switch to Plan View", category: "View", action: () => setViewMode("plan") },
    { id: "view-profile", label: "Switch to Profile View", category: "View", action: () => setViewMode("profile") },
    { id: "view-xsec", label: "Switch to Cross-Section View", category: "View", action: () => setViewMode("cross-section") },
    { id: "view-grid", label: "Toggle Grid", category: "View", shortcut: "G", action: toggleGrid },
    { id: "view-contours", label: "Toggle Contours", category: "View", action: toggleContours },
    { id: "view-labels", label: "Toggle Labels", category: "View", action: toggleLabels },
    { id: "view-reset", label: "Reset Camera", category: "View", shortcut: "Home", action: resetCamera },

    // Edit
    { id: "undo", label: "Undo", category: "Edit", shortcut: "Ctrl+Z", action: undo },
    { id: "redo", label: "Redo", category: "Edit", shortcut: "Ctrl+Y", action: redo },
    { id: "history", label: "Open History Timeline", category: "Edit", action: () => bottomPanel("timeline") },

    // Workspace
    { id: "ws-home", label: "Go to Home Workspace", category: "Workspace", action: () => ws("home") },
    { id: "ws-surface", label: "Go to Surface Workspace", category: "Workspace", action: () => ws("surface") },
    { id: "ws-design", label: "Go to Design Workspace", category: "Workspace", action: () => ws("design") },
    { id: "ws-drainage", label: "Go to Drainage Workspace", category: "Workspace", action: () => ws("drainage") },
    { id: "ws-docs", label: "Go to Documentation Workspace", category: "Workspace", action: () => ws("docs") },
    { id: "ws-automation", label: "Go to Automation Workspace", category: "Workspace", action: () => ws("automation") },

    // Surface
    { id: "create-surface", label: "Create New Surface", category: "Surface", action: () => { ws("surface"); panel("surface-create"); } },
    { id: "import-surface", label: "Import Surface Data", category: "Surface", action: () => { ws("surface"); panel("surface-import"); } },
    { id: "open-qto", label: "Open Quantity Takeoff", category: "Surface", action: () => bottomPanel("qto") },
    { id: "surface-analysis", label: "Open Surface Analysis", category: "Surface", action: () => useUIStore.getState().setPanelVisible("analysis", true) },

    // Design
    { id: "create-alignment", label: "Create Alignment", category: "Design", action: () => { ws("design"); panel("alignment"); } },
    { id: "create-profile", label: "Create Profile", category: "Design", action: () => { ws("design"); panel("profile"); } },
    { id: "create-corridor", label: "Create Corridor", category: "Design", action: () => { ws("design"); panel("corridor"); } },
    { id: "create-grading", label: "Open Grading Tools", category: "Design", action: () => { ws("design"); panel("grading"); } },
    { id: "create-parcel", label: "Create / Manage Parcels", category: "Design", action: () => { ws("design"); panel("parcel"); } },
    { id: "open-survey", label: "Open Survey Database", category: "Design", action: () => { ws("design"); panel("survey"); } },
    { id: "create-intersection", label: "Create Intersection", category: "Design", action: () => { ws("design"); panel("intersection"); } },

    // Drainage
    { id: "create-pipe-network", label: "Create Pipe Network", category: "Drainage", action: () => { ws("drainage"); panel("pipe-network"); } },
    { id: "create-catchment", label: "Create Catchment", category: "Drainage", action: () => { ws("drainage"); panel("drainage"); } },
    { id: "create-pressure-net", label: "Create Pressure Network", category: "Drainage", action: () => { ws("drainage"); panel("pressure-network"); } },

    // Documentation
    { id: "open-sheets", label: "Open Sheet Generator", category: "Documentation", action: () => bottomPanel("sheets") },
    { id: "run-validation", label: "Run Design Checks", category: "Documentation", action: () => useUIStore.getState().setPanelVisible("validation", true) },

    // Automation
    { id: "open-node-editor", label: "Open Node Editor", category: "Automation", action: () => useUIStore.getState().setPanelVisible("node-editor", true) },

    // Panels
    { id: "panel-objects", label: "Toggle Object Tree", category: "Panels", action: () => togglePanel("object-tree") },
    { id: "panel-properties", label: "Toggle Properties Panel", category: "Panels", action: () => togglePanel("properties") },
    { id: "panel-validation", label: "Toggle Validation Panel", category: "Panels", action: () => togglePanel("validation") },

    // Mode
    { id: "mode-standard", label: "Switch to Standard Mode", category: "Mode", action: () => useUIStore.getState().setProfessionalMode(false) },
    { id: "mode-professional", label: "Switch to Professional Mode", category: "Mode", action: () => useUIStore.getState().setProfessionalMode(true) },
    { id: "mode-beginner", label: "Beginner Experience", category: "Mode", action: () => setMode("beginner") },
    { id: "mode-guided", label: "Guided Experience", category: "Mode", action: () => setMode("guided") },
    { id: "mode-expert", label: "Expert Experience", category: "Mode", action: () => setMode("expert") },

    // Theme
    { id: "theme-midnight", label: "Theme: Midnight (Dark)", category: "Theme", action: () => useUIStore.getState().setTheme("midnight") },
    { id: "theme-slate", label: "Theme: Slate (Dark)", category: "Theme", action: () => useUIStore.getState().setTheme("slate") },
    { id: "theme-nord", label: "Theme: Nord (Dark)", category: "Theme", action: () => useUIStore.getState().setTheme("nord") },
    { id: "theme-solarized-dark", label: "Theme: Solarized Dark", category: "Theme", action: () => useUIStore.getState().setTheme("solarized-dark") },
    { id: "theme-light", label: "Theme: Light", category: "Theme", action: () => useUIStore.getState().setTheme("light") },
    { id: "theme-solarized-light", label: "Theme: Solarized Light", category: "Theme", action: () => useUIStore.getState().setTheme("solarized-light") },

    // Tutorials
    { id: "tutorial-terrain", label: "Tutorial: Create Terrain", category: "Tutorials", action: () => startTutorial("create-terrain", 5) },
    { id: "tutorial-road", label: "Tutorial: Design a Road", category: "Tutorials", action: () => startTutorial("design-road", 8) },
    { id: "tutorial-drainage", label: "Tutorial: Build Drainage", category: "Tutorials", action: () => startTutorial("drainage-system", 6) },
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  function runCommand(cmd: CommandItem) {
    cmd.action();
    close();
  }

  if (!open) return null;

  const categories = [
    "View",
    "Edit",
    "Workspace",
    "Surface",
    "Design",
    "Drainage",
    "Documentation",
    "Automation",
    "Panels",
    "Mode",
    "Theme",
    "Tutorials",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
      <div className="fixed inset-0 bg-black/60" onClick={close} />
      <div className="relative w-[560px] bg-surface-raised border border-border rounded-xl shadow-2xl overflow-hidden">
        <Command label="Command Palette" className="w-full">
          <Command.Input
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 bg-transparent text-text-primary text-sm outline-none border-b border-border placeholder:text-text-muted"
            autoFocus
          />
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-text-muted">
              No commands found.
            </Command.Empty>

            {categories.map((category) => {
              const items = commands.filter((c) => c.category === category);
              if (!items.length) return null;

              return (
                <Command.Group
                  key={category}
                  heading={category}
                  className="[&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => runCommand(cmd)}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-sm cursor-pointer text-text-primary data-[selected]:bg-primary-900/50 data-[selected]:text-primary-200"
                    >
                      <span>{cmd.label}</span>
                      {cmd.shortcut && (
                        <kbd className="text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                          {cmd.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
