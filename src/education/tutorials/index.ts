import { createTerrainTutorial } from "./create-terrain";
import { designRoadTutorial } from "./design-road";
import { drainageSystemTutorial } from "./drainage-system";

export interface TutorialStep {
  title: string;
  description: string;
  whyItMatters?: string;
  targetElement?: string;
  validationAction?: string;
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
  createTerrainTutorial,
  designRoadTutorial,
  drainageSystemTutorial,
];
