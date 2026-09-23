import { create } from "zustand";
import type {
  AnyCivilObject,
  ObjectType,
  SurfaceData,
  AlignmentData,
  ProfileData,
  CorridorData,
  PipeNetworkData,
  FeatureLineData,
  ParcelData,
  CatchmentData,
  PressureNetworkData,
  IntersectionData,
} from "@/lib/types/civil-objects";
import { useHistoryStore, setRestoreCallback, type SerializedProjectState } from "./history-store";

interface DepGraphNode {
  id: string;
  name: string;
  objectType: string;
  dirty: boolean;
  version: number;
  dependencies: string[];
  dependents: string[];
}

interface ProjectState {
  name: string;
  objects: Map<string, AnyCivilObject>;
  graphNodes: DepGraphNode[];

  setProjectName: (name: string) => void;
  addObject: (obj: AnyCivilObject) => void;
  updateObjectData: (
    id: string,
    data:
      | SurfaceData
      | AlignmentData
      | ProfileData
      | CorridorData
      | PipeNetworkData
      | FeatureLineData
      | ParcelData
      | CatchmentData
      | PressureNetworkData
      | IntersectionData
  ) => void;
  removeObject: (id: string) => void;
  getObject: (id: string) => AnyCivilObject | undefined;
  getObjectsByType: (type: ObjectType) => AnyCivilObject[];
  setGraphNodes: (nodes: DepGraphNode[]) => void;
  toggleVisibility: (id: string) => void;
  toggleLock: (id: string) => void;
  clearProject: () => void;
  createSnapshot: () => SerializedProjectState;
  restoreSnapshot: (snapshot: SerializedProjectState) => void;
}

function createSnapshot(state: { name: string; objects: Map<string, AnyCivilObject> }): SerializedProjectState {
  return {
    name: state.name,
    objects: Array.from(state.objects.entries()).map(([k, v]) => [k, { ...v }]),
  };
}

function pushUndoSnapshot(state: { name: string; objects: Map<string, AnyCivilObject> }, description: string) {
  const snapshot = createSnapshot(state);
  useHistoryStore.getState().pushEntry(description, snapshot);
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  name: "Untitled Project",
  objects: new Map(),
  graphNodes: [],

  setProjectName: (name) => set({ name }),

  addObject: (obj) => {
    const state = get();
    pushUndoSnapshot(state, `Add ${obj.type}: ${obj.name}`);
    set(() => {
      const objects = new Map(state.objects);
      objects.set(obj.id, obj);
      return { objects };
    });
  },

  updateObjectData: (id, data) => {
    const state = get();
    const obj = state.objects.get(id);
    if (!obj) return;
    pushUndoSnapshot(state, `Update ${obj.type}: ${obj.name}`);
    set(() => {
      const objects = new Map(state.objects);
      objects.set(id, { ...obj, data, version: obj.version + 1 } as AnyCivilObject);
      return { objects };
    });
  },

  removeObject: (id) => {
    const state = get();
    const obj = state.objects.get(id);
    if (!obj) return;
    pushUndoSnapshot(state, `Delete ${obj.type}: ${obj.name}`);
    set(() => {
      const objects = new Map(state.objects);
      objects.delete(id);
      return { objects };
    });
  },

  getObject: (id) => get().objects.get(id),

  getObjectsByType: (type) =>
    Array.from(get().objects.values()).filter((o) => o.type === type),

  setGraphNodes: (nodes) => set({ graphNodes: nodes }),

  toggleVisibility: (id) =>
    set((state) => {
      const objects = new Map(state.objects);
      const obj = objects.get(id);
      if (obj) {
        objects.set(id, { ...obj, visible: !obj.visible } as AnyCivilObject);
      }
      return { objects };
    }),

  toggleLock: (id) =>
    set((state) => {
      const objects = new Map(state.objects);
      const obj = objects.get(id);
      if (obj) {
        objects.set(id, { ...obj, locked: !obj.locked } as AnyCivilObject);
      }
      return { objects };
    }),

  clearProject: () => set({ objects: new Map(), graphNodes: [] }),

  createSnapshot: () => createSnapshot(get()),

  restoreSnapshot: (snapshot) =>
    set({
      name: snapshot.name,
      objects: new Map(snapshot.objects.map(([k, v]) => [k, v as AnyCivilObject])),
    }),
}));

setRestoreCallback((snapshot) => {
  useProjectStore.getState().restoreSnapshot(snapshot);
});
