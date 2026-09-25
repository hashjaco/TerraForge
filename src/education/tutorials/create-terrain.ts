import type { TutorialDefinition } from "./index";
import { hasObjectOfType, isPanelOpen, isSelectedType, isWorkspace } from "./conditions";

export const createTerrainTutorial: TutorialDefinition = {
  id: "create-terrain",
  title: "Create Your First Terrain",
  description:
    "Learn how to create a terrain surface from survey points and analyze it.",
  difficulty: "beginner",
  estimatedMinutes: 5,
  steps: [
    {
      title: "Welcome to TerraForge",
      description:
        "In this tutorial, you'll learn how to create a terrain surface. Surfaces are the foundation of any civil engineering project — they represent the existing ground.",
      whyItMatters:
        "Every road, building, and pipe must interact with the ground surface. Understanding terrain is the first step in any design.",
    },
    {
      title: "Open the Surface Workspace",
      description:
        "The ribbon tabs group tools by discipline. The Surface workspace holds terrain creation, import and analysis tools.",
      targetElement: "workspace-surface",
      action: "Click the Surface tab.",
      completeWhen: () => isWorkspace("surface"),
    },
    {
      title: "Open the Surface Panel",
      description:
        "New Surface opens the creation form in the left sidebar, next to the Objects list where every civil object in your project lives.",
      targetElement: "tool-surf-create",
      action: "Click New Surface.",
      completeWhen: () => isPanelOpen("surface-create"),
    },
    {
      title: "Generate Demo Terrain",
      description:
        'Click the "Generate Demo Terrain" button. This creates a sample terrain with rolling hills so you can see how surfaces work. In a real project, you\'d import survey points from a CSV file.',
      targetElement: "create-surface-button",
      action: "Click Generate Demo Terrain.",
      completeWhen: () => hasObjectOfType("surface"),
    },
    {
      title: "Explore the 3D View",
      description:
        "Your terrain is now visible in the 3D viewport. Drag to orbit, right-drag to pan, scroll to zoom toward the cursor, and double-click to fly to an object. Elevation colouring runs from green lowlands to rock and snow on the peaks.",
      targetElement: "viewport",
      whyItMatters:
        "Understanding terrain shape helps engineers identify where water flows, where slopes are steep, and where roads can be built.",
    },
    {
      title: "View Surface Properties",
      description:
        "Click on the terrain in the 3D view or in the Object Tree. The Properties panel on the right shows key information: point count, triangle count, elevation range, and area.",
      targetElement: () => (isSelectedType("surface") ? "properties-panel" : "object-tree"),
      action: "Select the terrain surface.",
      completeWhen: () => isSelectedType("surface"),
      whyItMatters:
        "Surface analysis data (elevation, slope, area) is critical for grading design, earthwork volumes, and drainage planning.",
    },
  ],
};
