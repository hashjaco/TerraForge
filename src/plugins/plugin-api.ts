import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";
import { eventBus } from "@/lib/types/events";
import * as bridge from "@/lib/tauri-bridge";
import type {
  PluginAPI,
  GeometryAPI,
  UIAPI,
  EventsAPI,
  PanelConfig,
  CommandConfig,
  ToolbarItemConfig,
} from "./plugin-types";

const registeredPanels = new Map<string, PanelConfig>();
const registeredCommands = new Map<string, CommandConfig>();
const registeredToolbarItems = new Map<string, ToolbarItemConfig>();

function createGeometryAPI(): GeometryAPI {
  return {
    getObject: (id) => useProjectStore.getState().getObject(id),
    getObjectsByType: (type) => useProjectStore.getState().getObjectsByType(type),

    createSurface: async (name, points) => {
      const result = await bridge.createSurface(name, points, 2.0);
      return result.id;
    },

    createAlignment: async (name, segments) => {
      const result = await bridge.createAlignment(name, segments);
      return result.id;
    },
  };
}

function createUIAPI(): UIAPI {
  return {
    registerPanel: (config) => {
      registeredPanels.set(config.id, config);
    },
    removePanel: (id) => {
      registeredPanels.delete(id);
    },
    registerCommand: (config) => {
      registeredCommands.set(config.id, config);
    },
    removeCommand: (id) => {
      registeredCommands.delete(id);
    },
    registerToolbarItem: (config) => {
      registeredToolbarItems.set(config.id, config);
    },
    removeToolbarItem: (id) => {
      registeredToolbarItems.delete(id);
    },
    showNotification: (message, type = "info") => {
      useUIStore.getState().setStatusMessage(`[${type}] ${message}`);
    },
  };
}

function createEventsAPI(): EventsAPI {
  return {
    on: (event, handler) => eventBus.on(event, handler as any),
    emit: (event, ...args) =>
      eventBus.emit({ type: event as any, ...args[0] }),
  };
}

export function createPluginAPI(): PluginAPI {
  return {
    geometry: createGeometryAPI(),
    ui: createUIAPI(),
    events: createEventsAPI(),
  };
}

export function getRegisteredPanels(): PanelConfig[] {
  return Array.from(registeredPanels.values());
}

export function getRegisteredCommands(): CommandConfig[] {
  return Array.from(registeredCommands.values());
}

export function getRegisteredToolbarItems(): ToolbarItemConfig[] {
  return Array.from(registeredToolbarItems.values());
}
