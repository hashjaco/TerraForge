import type { ObjectType, AnyCivilObject, SurfaceData, AlignmentData } from "@/lib/types/civil-objects";

export interface TerraForgePlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  activate: (api: PluginAPI) => void;
  deactivate: () => void;
}

export interface PluginAPI {
  geometry: GeometryAPI;
  ui: UIAPI;
  events: EventsAPI;
}

export interface GeometryAPI {
  getObject: (id: string) => AnyCivilObject | undefined;
  getObjectsByType: (type: ObjectType) => AnyCivilObject[];
  createSurface: (name: string, points: [number, number, number][]) => Promise<string>;
  createAlignment: (name: string, segments: any[]) => Promise<string>;
}

export interface PanelConfig {
  id: string;
  title: string;
  position: "left" | "right" | "bottom";
  render: () => any;
}

export interface CommandConfig {
  id: string;
  label: string;
  category: string;
  shortcut?: string;
  action: () => void;
}

export interface ToolbarItemConfig {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
}

export interface UIAPI {
  registerPanel: (config: PanelConfig) => void;
  removePanel: (id: string) => void;
  registerCommand: (config: CommandConfig) => void;
  removeCommand: (id: string) => void;
  registerToolbarItem: (config: ToolbarItemConfig) => void;
  removeToolbarItem: (id: string) => void;
  showNotification: (message: string, type?: "info" | "warning" | "error") => void;
}

export interface EventsAPI {
  on: (event: string, handler: (...args: any[]) => void) => () => void;
  emit: (event: string, ...args: any[]) => void;
}
