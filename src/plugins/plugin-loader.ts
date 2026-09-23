import type { TerraForgePlugin } from "./plugin-types";
import { createPluginAPI } from "./plugin-api";

const loadedPlugins = new Map<string, TerraForgePlugin>();

export function loadPlugin(plugin: TerraForgePlugin): boolean {
  if (loadedPlugins.has(plugin.id)) {
    console.warn(`Plugin "${plugin.id}" is already loaded.`);
    return false;
  }

  try {
    const api = createPluginAPI();
    plugin.activate(api);
    loadedPlugins.set(plugin.id, plugin);
    console.log(`Plugin "${plugin.name}" v${plugin.version} loaded.`);
    return true;
  } catch (error) {
    console.error(`Failed to load plugin "${plugin.name}":`, error);
    return false;
  }
}

export function unloadPlugin(id: string): boolean {
  const plugin = loadedPlugins.get(id);
  if (!plugin) {
    return false;
  }

  try {
    plugin.deactivate();
    loadedPlugins.delete(id);
    console.log(`Plugin "${plugin.name}" unloaded.`);
    return true;
  } catch (error) {
    console.error(`Error unloading plugin "${plugin.name}":`, error);
    return false;
  }
}

export function getLoadedPlugins(): TerraForgePlugin[] {
  return Array.from(loadedPlugins.values());
}

export function isPluginLoaded(id: string): boolean {
  return loadedPlugins.has(id);
}
