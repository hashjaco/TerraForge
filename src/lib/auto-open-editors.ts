import { useEffect } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import { useUIStore } from "@/stores/ui-store";

export function useAutoOpenEditors() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);

  useEffect(() => {
    if (selectedIds.length !== 1) return;

    const obj = objects.get(selectedIds[0]);
    if (!obj) return;

    const setPanelVisible = useUIStore.getState().setPanelVisible;

    switch (obj.type) {
      case "profile":
        setPanelVisible("profile-editor", true);
        break;
      case "corridor":
        setPanelVisible("template-editor", true);
        break;
      case "pipe-network":
        setPanelVisible("pipe-editor", true);
        break;
    }
  }, [selectedIds, objects]);
}
