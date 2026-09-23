import { useEffect } from "react";
import { useHistoryStore } from "@/stores/history-store";
import { useViewportStore } from "@/stores/viewport-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { useProjectStore } from "@/stores/project-store";

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "k") {
        e.preventDefault();
        useUIStore.getState().toggleCommandPalette();
        return;
      }

      if (mod && e.key === "s") {
        e.preventDefault();
        // File save is handled by the toolbar Save button via Tauri bridge.
        // Dispatch a custom event so the toolbar can pick it up.
        window.dispatchEvent(new CustomEvent("terraforge:save"));
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        useHistoryStore.getState().redo();
        return;
      }

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        useHistoryStore.getState().undo();
        return;
      }

      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useHistoryStore.getState().redo();
        return;
      }

      if (isInputFocused()) return;

      if (e.key === "Escape") {
        useSelectionStore.getState().clearSelection();
        useUIStore.getState().closeCommandPalette();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        const selected = useSelectionStore.getState().selectedIds;
        if (selected.length > 0) {
          e.preventDefault();
          for (const id of selected) {
            useProjectStore.getState().removeObject(id);
          }
          useSelectionStore.getState().clearSelection();
        }
        return;
      }

      if (e.key.toLowerCase() === "g") {
        useViewportStore.getState().toggleGrid();
        return;
      }

      if (e.key === "Home") {
        useViewportStore.getState().resetCamera();
        return;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
