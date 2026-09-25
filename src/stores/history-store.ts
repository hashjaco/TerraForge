import { create } from "zustand";

export interface SerializedProjectState {
  name: string;
  objects: [string, any][];
}

interface HistoryEntry {
  id: number;
  description: string;
  timestamp: number;
  snapshot: SerializedProjectState;
}

interface HistoryState {
  entries: HistoryEntry[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  pushEntry: (description: string, snapshot: SerializedProjectState) => void;
  undo: () => void;
  redo: () => void;
  goToEntry: (index: number) => void;
  getCurrentSnapshot: () => SerializedProjectState | null;
}

// Each entry holds a full project snapshot, so memory grows linearly with depth.
export const MAX_HISTORY_ENTRIES = 100;
let nextEntryId = 0;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  currentIndex: -1,
  canUndo: false,
  canRedo: false,

  pushEntry: (description, snapshot) =>
    set((state) => {
      const entries = state.entries.slice(0, state.currentIndex + 1);
      const newEntry: HistoryEntry = {
        id: nextEntryId++,
        description,
        timestamp: Date.now(),
        snapshot,
      };
      entries.push(newEntry);
      if (entries.length > MAX_HISTORY_ENTRIES) {
        entries.splice(0, entries.length - MAX_HISTORY_ENTRIES);
      }
      const currentIndex = entries.length - 1;
      return {
        entries,
        currentIndex,
        canUndo: currentIndex > 0,
        canRedo: false,
      };
    }),

  undo: () => {
    const state = get();
    if (state.currentIndex <= 0) return;
    const newIndex = state.currentIndex - 1;
    set({
      currentIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
    });
    const snapshot = state.entries[newIndex]?.snapshot;
    if (snapshot) {
      restoreProjectFromSnapshot(snapshot);
    }
  },

  redo: () => {
    const state = get();
    if (state.currentIndex >= state.entries.length - 1) return;
    const newIndex = state.currentIndex + 1;
    set({
      currentIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.entries.length - 1,
    });
    const snapshot = state.entries[newIndex]?.snapshot;
    if (snapshot) {
      restoreProjectFromSnapshot(snapshot);
    }
  },

  goToEntry: (index) => {
    const state = get();
    if (index < 0 || index >= state.entries.length) return;
    set({
      currentIndex: index,
      canUndo: index > 0,
      canRedo: index < state.entries.length - 1,
    });
    const snapshot = state.entries[index]?.snapshot;
    if (snapshot) {
      restoreProjectFromSnapshot(snapshot);
    }
  },

  getCurrentSnapshot: () => {
    const state = get();
    return state.entries[state.currentIndex]?.snapshot ?? null;
  },
}));

let _restoreCallback: ((snapshot: SerializedProjectState) => void) | null = null;

export function setRestoreCallback(cb: (snapshot: SerializedProjectState) => void) {
  _restoreCallback = cb;
}

function restoreProjectFromSnapshot(snapshot: SerializedProjectState) {
  _restoreCallback?.(snapshot);
}
