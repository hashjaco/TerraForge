import { create } from "zustand";

export type ExperienceMode = "beginner" | "guided" | "expert";

interface TutorialProgress {
  tutorialId: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  // True after stepping Back, so an already-satisfied step doesn't auto-advance again.
  revisiting: boolean;
}

interface EducationState {
  mode: ExperienceMode;
  activeTutorial: TutorialProgress | null;
  completedTutorials: string[];
  showTooltips: boolean;
  showDependencyOverlay: boolean;
  guidanceVisible: boolean;
  dismissedTips: string[];

  setMode: (mode: ExperienceMode) => void;
  startTutorial: (tutorialId: string, totalSteps: number) => void;
  advanceStep: () => void;
  goBack: () => void;
  completeTutorial: () => void;
  exitTutorial: () => void;
  toggleTooltips: () => void;
  toggleDependencyOverlay: () => void;
  toggleGuidance: () => void;
  dismissTip: (tipId: string) => void;
}

function withTutorial(completed: string[], id: string): string[] {
  const next = completed.includes(id) ? completed : [...completed, id];
  return next;
}

export const useEducationStore = create<EducationState>((set) => ({
  mode: "beginner",
  activeTutorial: null,
  completedTutorials: [],
  showTooltips: true,
  showDependencyOverlay: false,
  guidanceVisible: true,
  dismissedTips: [],

  setMode: (mode) =>
    set({
      mode,
      showTooltips: mode !== "expert",
      guidanceVisible: mode !== "expert",
    }),

  startTutorial: (tutorialId, totalSteps) =>
    set({
      activeTutorial: {
        tutorialId,
        currentStep: 0,
        totalSteps,
        completed: false,
        revisiting: false,
      },
    }),

  advanceStep: () =>
    set((state) => {
      if (!state.activeTutorial || state.activeTutorial.completed) return state;
      const next = state.activeTutorial.currentStep + 1;
      if (next >= state.activeTutorial.totalSteps) {
        return {
          activeTutorial: { ...state.activeTutorial, completed: true },
          completedTutorials: withTutorial(state.completedTutorials, state.activeTutorial.tutorialId),
        };
      }
      return {
        activeTutorial: { ...state.activeTutorial, currentStep: next, revisiting: false },
      };
    }),

  goBack: () =>
    set((state) => {
      if (!state.activeTutorial || state.activeTutorial.currentStep === 0) return state;
      return {
        activeTutorial: {
          ...state.activeTutorial,
          currentStep: state.activeTutorial.currentStep - 1,
          completed: false,
          revisiting: true,
        },
      };
    }),

  completeTutorial: () =>
    set((state) => {
      if (!state.activeTutorial) return state;
      return {
        activeTutorial: null,
        completedTutorials: withTutorial(state.completedTutorials, state.activeTutorial.tutorialId),
      };
    }),

  exitTutorial: () => set({ activeTutorial: null }),
  toggleTooltips: () => set((s) => ({ showTooltips: !s.showTooltips })),
  toggleDependencyOverlay: () =>
    set((s) => ({ showDependencyOverlay: !s.showDependencyOverlay })),
  toggleGuidance: () =>
    set((s) => ({ guidanceVisible: !s.guidanceVisible })),
  dismissTip: (tipId) =>
    set((s) => ({
      dismissedTips: s.dismissedTips.includes(tipId)
        ? s.dismissedTips
        : [...s.dismissedTips, tipId],
    })),
}));
