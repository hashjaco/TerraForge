import { create } from "zustand";

export type Theme =
  | "midnight"
  | "slate"
  | "nord"
  | "solarized-dark"
  | "light"
  | "solarized-light";

export type WorkspaceId =
  | "home"
  | "surface"
  | "design"
  | "drainage"
  | "docs"
  | "automation";

export type ActivePanel =
  | null
  | "surface-create"
  | "surface-import"
  | "alignment"
  | "profile"
  | "corridor"
  | "pipe-network"
  | "grading"
  | "parcel"
  | "survey"
  | "drainage"
  | "pressure-network"
  | "intersection";

export type PanelId =
  | "object-tree"
  | "properties"
  | "profile-editor"
  | "template-editor"
  | "pipe-editor"
  | "timeline"
  | "analysis"
  | "tutorials"
  | "validation"
  | "guide"
  | "qto"
  | "sheets"
  | "node-editor";

interface PanelState {
  visible: boolean;
  width?: number;
  height?: number;
}

interface UIState {
  theme: Theme;
  commandPaletteOpen: boolean;
  panels: Record<string, PanelState>;
  statusMessage: string;
  isLoading: boolean;

  activeWorkspace: WorkspaceId;
  activePanel: ActivePanel;
  professionalMode: boolean;
  ribbonCollapsed: boolean;
  visitedWorkspaces: WorkspaceId[];

  setTheme: (theme: Theme) => void;
  toggleCommandPalette: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  togglePanel: (id: PanelId) => void;
  setPanelVisible: (id: PanelId, visible: boolean) => void;
  setStatusMessage: (message: string) => void;
  setLoading: (loading: boolean) => void;

  setActiveWorkspace: (ws: WorkspaceId) => void;
  setActivePanel: (panel: ActivePanel) => void;
  toggleProfessionalMode: () => void;
  setProfessionalMode: (on: boolean) => void;
  toggleRibbon: () => void;
  markWorkspaceVisited: (ws: WorkspaceId) => void;
}

const defaultPanels: Record<string, PanelState> = {
  "object-tree": { visible: true, width: 240 },
  properties: { visible: true, width: 300 },
  "profile-editor": { visible: false, height: 300 },
  "template-editor": { visible: false, height: 300 },
  "pipe-editor": { visible: false, height: 300 },
  timeline: { visible: false, height: 200 },
  analysis: { visible: false, width: 300 },
  tutorials: { visible: false, width: 360 },
  validation: { visible: false, width: 300 },
  guide: { visible: false, width: 300 },
  qto: { visible: false, height: 300 },
  sheets: { visible: false, height: 300 },
  "node-editor": { visible: false },
};

export const useUIStore = create<UIState>((set) => ({
  theme: "midnight",
  commandPaletteOpen: false,
  panels: defaultPanels,
  statusMessage: "Ready",
  isLoading: false,

  activeWorkspace: "home",
  activePanel: null,
  professionalMode: false,
  ribbonCollapsed: false,
  visitedWorkspaces: ["home"],

  setTheme: (theme) => set({ theme }),
  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  togglePanel: (id) =>
    set((s) => ({
      panels: {
        ...s.panels,
        [id]: { ...s.panels[id], visible: !s.panels[id]?.visible },
      },
    })),
  setPanelVisible: (id, visible) =>
    set((s) => ({
      panels: {
        ...s.panels,
        [id]: { ...s.panels[id], visible },
      },
    })),
  setStatusMessage: (statusMessage) => set({ statusMessage }),
  setLoading: (isLoading) => set({ isLoading }),

  setActiveWorkspace: (ws) =>
    set((s) => ({
      activeWorkspace: ws,
      activePanel: null,
      visitedWorkspaces: s.visitedWorkspaces.includes(ws)
        ? s.visitedWorkspaces
        : [...s.visitedWorkspaces, ws],
    })),
  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleProfessionalMode: () =>
    set((s) => ({ professionalMode: !s.professionalMode })),
  setProfessionalMode: (on) => set({ professionalMode: on }),
  toggleRibbon: () => set((s) => ({ ribbonCollapsed: !s.ribbonCollapsed })),
  markWorkspaceVisited: (ws) =>
    set((s) => ({
      visitedWorkspaces: s.visitedWorkspaces.includes(ws)
        ? s.visitedWorkspaces
        : [...s.visitedWorkspaces, ws],
    })),
}));
