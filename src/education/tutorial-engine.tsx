import { useEducationStore } from "@/stores/education-store";
import { tutorials, type TutorialDefinition, type TutorialStep } from "./tutorials";

export function useTutorialEngine() {
  const activeTutorial = useEducationStore((s) => s.activeTutorial);
  const advanceStep = useEducationStore((s) => s.advanceStep);
  const exitTutorial = useEducationStore((s) => s.exitTutorial);
  const completeTutorial = useEducationStore((s) => s.completeTutorial);

  const tutorial: TutorialDefinition | null = activeTutorial
    ? tutorials.find((t) => t.id === activeTutorial.tutorialId) ?? null
    : null;

  const currentStep: TutorialStep | null =
    tutorial && activeTutorial
      ? tutorial.steps[activeTutorial.currentStep] ?? null
      : null;

  const progress = activeTutorial
    ? {
        current: activeTutorial.currentStep + 1,
        total: activeTutorial.totalSteps,
        percent:
          ((activeTutorial.currentStep + 1) / activeTutorial.totalSteps) * 100,
      }
    : null;

  function nextStep() {
    if (!activeTutorial) return;
    if (activeTutorial.currentStep >= activeTutorial.totalSteps - 1) {
      completeTutorial();
    } else {
      advanceStep();
    }
  }

  return {
    activeTutorial,
    tutorial,
    currentStep,
    progress,
    nextStep,
    exitTutorial,
  };
}
