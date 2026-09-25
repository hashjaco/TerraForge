import { useProjectStore } from "@/stores/project-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore, type ActivePanel, type PanelId, type WorkspaceId } from "@/stores/ui-store";
import { useViewportStore } from "@/stores/viewport-store";
import type { ObjectType } from "@/lib/types/civil-objects";

export function hasObjectOfType(type: ObjectType): boolean {
  for (const obj of useProjectStore.getState().objects.values()) {
    if (obj.type === type) return true;
  }
  return false;
}

export function isWorkspace(ws: WorkspaceId): boolean {
  return useUIStore.getState().activeWorkspace === ws;
}

export function isPanelOpen(panel: ActivePanel): boolean {
  return useUIStore.getState().activePanel === panel;
}

export function isDockVisible(id: PanelId): boolean {
  return useUIStore.getState().panels[id]?.visible ?? false;
}

export function isSelectedType(type: ObjectType): boolean {
  const { selectedIds } = useSelectionStore.getState();
  if (selectedIds.length !== 1) return false;
  return useProjectStore.getState().objects.get(selectedIds[0])?.type === type;
}

export function selectFirstOfType(type: ObjectType) {
  for (const obj of useProjectStore.getState().objects.values()) {
    if (obj.type === type) {
      useSelectionStore.getState().select(obj.id);
      return;
    }
  }
}

export function ensureProfessionalMode() {
  useUIStore.getState().setProfessionalMode(true);
}

export function ensureLabelsVisible() {
  if (!useViewportStore.getState().showLabels) useViewportStore.getState().toggleLabels();
}

export function ensure3dView() {
  useViewportStore.getState().setViewMode("3d");
}
