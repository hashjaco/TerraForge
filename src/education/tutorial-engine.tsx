import { useEffect, useRef, useState } from "react";
import { useEducationStore } from "@/stores/education-store";
import { useProjectStore } from "@/stores/project-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useUIStore } from "@/stores/ui-store";
import { useViewportStore } from "@/stores/viewport-store";
import { findTutorial, type TutorialDefinition, type TutorialStep } from "./tutorials";

const AUTO_ADVANCE_DELAY_MS = 900;

export interface ChapterProgress {
  name: string;
  stepCount: number;
  completedSteps: number;
  isCurrent: boolean;
}

function chapterProgress(tutorial: TutorialDefinition, stepIndex: number): ChapterProgress[] {
  const chapters: ChapterProgress[] = [];
  tutorial.steps.forEach((step, i) => {
    const name = step.chapter ?? tutorial.title;
    let chapter = chapters[chapters.length - 1];
    if (!chapter || chapter.name !== name) {
      chapter = { name, stepCount: 0, completedSteps: 0, isCurrent: false };
      chapters.push(chapter);
    }
    chapter.stepCount++;
    if (i < stepIndex) chapter.completedSteps++;
    if (i === stepIndex) chapter.isCurrent = true;
  });
  return chapters;
}

export function resolveTarget(step: TutorialStep | null): string | undefined {
  const target = step?.targetElement;
  const resolved = typeof target === "function" ? target() : target;
  return resolved;
}

// Watches every store a completeWhen predicate may read and reports when the step is satisfied.
function useStepSatisfied(step: TutorialStep | null, stepKey: string): boolean {
  const [satisfiedKey, setSatisfiedKey] = useState<string | null>(null);

  useEffect(() => {
    const predicate = step?.completeWhen;
    if (!predicate) return;
    function check() {
      if (predicate!()) setSatisfiedKey(stepKey);
    }
    check();
    const unsubscribers = [
      useProjectStore.subscribe(check),
      useSelectionStore.subscribe(check),
      useUIStore.subscribe(check),
      useViewportStore.subscribe(check),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [step, stepKey]);

  return satisfiedKey === stepKey;
}

export function useTutorialEngine() {
  const activeTutorial = useEducationStore((s) => s.activeTutorial);
  const advanceStep = useEducationStore((s) => s.advanceStep);
  const goBack = useEducationStore((s) => s.goBack);
  const exitTutorial = useEducationStore((s) => s.exitTutorial);

  const tutorial = activeTutorial ? findTutorial(activeTutorial.tutorialId) ?? null : null;
  const stepIndex = activeTutorial?.currentStep ?? 0;
  const currentStep = tutorial && activeTutorial ? tutorial.steps[stepIndex] ?? null : null;
  const stepKey = `${activeTutorial?.tutorialId}:${stepIndex}`;
  const isComplete = activeTutorial?.completed ?? false;

  const setupRanFor = useRef<string | null>(null);
  useEffect(() => {
    if (!activeTutorial) setupRanFor.current = null;
    if (!currentStep || isComplete || setupRanFor.current === stepKey) return;
    setupRanFor.current = stepKey;
    currentStep.setup?.();
  }, [activeTutorial, currentStep, stepKey, isComplete]);

  const satisfied = useStepSatisfied(isComplete ? null : currentStep, stepKey);
  const revisiting = activeTutorial?.revisiting ?? false;
  const autoAdvancing = satisfied && !revisiting;

  useEffect(() => {
    if (!autoAdvancing) return;
    const timer = setTimeout(advanceStep, AUTO_ADVANCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [autoAdvancing, advanceStep]);

  const total = tutorial?.steps.length ?? 0;
  const progress = {
    current: stepIndex + 1,
    total,
    percent: total ? (stepIndex / total) * 100 : 0,
  };
  const chapters = tutorial ? chapterProgress(tutorial, isComplete ? total : stepIndex) : [];

  const engine = {
    activeTutorial,
    tutorial,
    currentStep,
    stepIndex,
    stepKey,
    isComplete,
    isLastStep: stepIndex >= total - 1,
    waitingForAction: Boolean(currentStep?.completeWhen) && !satisfied,
    satisfied,
    autoAdvancing,
    progress,
    chapters,
    next: advanceStep,
    back: goBack,
    exit: exitTutorial,
  };
  return engine;
}
