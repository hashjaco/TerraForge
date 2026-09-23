import { create } from "zustand";

interface SelectionState {
  selectedIds: string[];
  hoveredId: string | null;
  activeTool: string | null;

  select: (id: string) => void;
  multiSelect: (id: string) => void;
  deselect: (id: string) => void;
  clearSelection: () => void;
  setHovered: (id: string | null) => void;
  setActiveTool: (tool: string | null) => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedIds: [],
  hoveredId: null,
  activeTool: null,

  select: (id) => set({ selectedIds: [id] }),
  multiSelect: (id) =>
    set((state) => {
      if (state.selectedIds.includes(id)) {
        return { selectedIds: state.selectedIds.filter((s) => s !== id) };
      }
      return { selectedIds: [...state.selectedIds, id] };
    }),
  deselect: (id) =>
    set((state) => ({
      selectedIds: state.selectedIds.filter((s) => s !== id),
    })),
  clearSelection: () => set({ selectedIds: [] }),
  setHovered: (hoveredId) => set({ hoveredId }),
  setActiveTool: (activeTool) => set({ activeTool }),
  isSelected: (id) => get().selectedIds.includes(id),
}));
