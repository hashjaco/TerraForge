import { create } from "zustand";
import type { TemplateElement } from "@/lib/types/civil-objects";

interface TemplateState {
  activeTemplate: TemplateElement[] | null;
  activeTemplateName: string | null;
  setActiveTemplate: (name: string, elements: TemplateElement[]) => void;
  clearTemplate: () => void;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  activeTemplate: null,
  activeTemplateName: null,
  setActiveTemplate: (name, elements) =>
    set({ activeTemplateName: name, activeTemplate: elements }),
  clearTemplate: () => set({ activeTemplate: null, activeTemplateName: null }),
}));
