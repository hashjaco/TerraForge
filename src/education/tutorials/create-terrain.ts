import type { TutorialDefinition } from "./index";

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
      title: "Open the Surface Panel",
      description:
        'Look at the left sidebar. You\'ll see an "Objects" panel. This is where all your civil engineering objects live. To create a surface, we\'ll use the Surface creation panel.',
      targetElement: "surface-panel",
    },
    {
      title: "Generate Demo Terrain",
      description:
        'Click the "Generate Demo Terrain" button. This creates a sample terrain with rolling hills so you can see how surfaces work. In a real project, you\'d import survey points from a CSV file.',
      targetElement: "create-surface-button",
      validationAction: "surface-created",
    },
    {
      title: "Explore the 3D View",
      description:
        "Your terrain is now visible in the 3D viewport! Try: Left-click + drag to rotate. Right-click + drag to pan. Scroll to zoom. Notice the elevation coloring — green is low, brown is high.",
      whyItMatters:
        "Understanding terrain shape helps engineers identify where water flows, where slopes are steep, and where roads can be built.",
    },
    {
      title: "View Surface Properties",
      description:
        "Click on the terrain in the 3D view or in the Object Tree. The Properties panel on the right shows key information: point count, triangle count, elevation range, and area.",
      whyItMatters:
        "Surface analysis data (elevation, slope, area) is critical for grading design, earthwork volumes, and drainage planning.",
    },
  ],
};
