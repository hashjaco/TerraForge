export type TerraEvent =
  | { type: "object:created"; objectId: string; objectType: string }
  | { type: "object:updated"; objectId: string; objectType: string }
  | { type: "object:deleted"; objectId: string }
  | { type: "selection:changed"; selectedIds: string[] }
  | { type: "viewport:changed"; camera: CameraState }
  | { type: "tool:activated"; toolId: string }
  | { type: "tool:deactivated"; toolId: string }
  | { type: "tutorial:step"; tutorialId: string; stepIndex: number }
  | { type: "history:undo" }
  | { type: "history:redo" };

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export type EventHandler = (event: TerraEvent) => void;

class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(type: string, handler: EventHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: EventHandler) {
    this.handlers.get(type)?.delete(handler);
  }

  emit(event: TerraEvent) {
    this.handlers.get(event.type)?.forEach((h) => h(event));
    this.handlers.get("*")?.forEach((h) => h(event));
  }
}

export const eventBus = new EventBus();
