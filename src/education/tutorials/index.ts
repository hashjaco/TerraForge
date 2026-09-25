import { firstProjectTutorial } from "./first-project";
import { createTerrainTutorial } from "./create-terrain";
import { designRoadTutorial } from "./design-road";
import { drainageSystemTutorial } from "./drainage-system";

export interface TutorialStep {
  title: string;
  description: string;
  chapter?: string;
  whyItMatters?: string;
  // data-tutorial-id of the element to spotlight; a function lets the target follow UI state.
  targetElement?: string | (() => string);
  // Imperative instruction shown when the step waits on the user, e.g. "Click New Surface".
  action?: string;
  // Runs once when the step is entered, to put the UI in the state the step expects.
  setup?: () => void;
  // When present, the step advances automatically once this returns true.
  completeWhen?: () => boolean;
}

export interface TutorialDefinition {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  steps: TutorialStep[];
}

export const tutorials: TutorialDefinition[] = [
  firstProjectTutorial,
  createTerrainTutorial,
  designRoadTutorial,
  drainageSystemTutorial,
];

export function findTutorial(id: string): TutorialDefinition | undefined {
  return tutorials.find((t) => t.id === id);
}
