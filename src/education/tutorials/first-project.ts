import type { TutorialDefinition } from "./index";
import {
  ensure3dView,
  ensureLabelsVisible,
  hasObjectOfType,
  isDockVisible,
  isPanelOpen,
  isSelectedType,
  isWorkspace,
  selectFirstOfType,
} from "./conditions";

const GROUND = "Existing ground";
const HORIZONTAL = "Horizontal design";
const VERTICAL = "Vertical design";
const CORRIDOR = "Corridor";
const REVIEW = "Review & save";

export const firstProjectTutorial: TutorialDefinition = {
  id: "first-project",
  title: "Your First Project: Site Access Road",
  description:
    "Build a complete small project end to end: terrain, road alignment, vertical profile, 3D corridor, review and save.",
  difficulty: "beginner",
  estimatedMinutes: 12,
  steps: [
    {
      chapter: GROUND,
      title: "Welcome — let's build a road",
      description:
        "You'll design a short access road across a hilly site. The workflow is the same one used on real projects: model the existing ground, draw where the road goes in plan, set how high it sits, then sweep a cross-section along it to get a 3D model. Each step highlights exactly where to look; steps with an action advance automatically once you've done it.",
      whyItMatters:
        "Every civil design is built in layers that depend on each other. Learning the order — ground → alignment → profile → corridor — is the foundation for everything else in TerraForge.",
      setup: ensure3dView,
    },
    {
      chapter: GROUND,
      title: "Open the Surface workspace",
      description:
        "The ribbon tabs group tools by discipline. Surface tools create and analyze terrain — the existing ground your road will sit on.",
      targetElement: "workspace-surface",
      action: "Click the Surface tab.",
      completeWhen: () => isWorkspace("surface"),
    },
    {
      chapter: GROUND,
      title: "Start a new surface",
      description:
        "New Surface opens the creation form in the left sidebar. On a real job you'd use Import to load survey points or a DEM instead.",
      targetElement: "tool-surf-create",
      action: "Click New Surface.",
      completeWhen: () => isPanelOpen("surface-create"),
    },
    {
      chapter: GROUND,
      title: "Generate the terrain",
      description:
        "This builds a TIN (triangulated irregular network) from sample survey points: every point becomes a vertex and neighbouring points are joined into triangles. Contours are then traced across those triangles.",
      targetElement: "create-surface-button",
      action: "Click Generate Demo Terrain and wait for it to appear.",
      completeWhen: () => hasObjectOfType("surface"),
    },
    {
      chapter: GROUND,
      title: "Look around the site",
      description:
        "Drag to orbit, right-drag to pan, scroll to zoom toward the cursor. Double-click any object to fly the camera to it, use the cube in the corner to snap to a standard view, and press Home to reset. Colour runs from green lowlands to rock and snow on the high ground; orange lines are major contours.",
      targetElement: "viewport",
      whyItMatters:
        "Reading terrain tells you where water flows, where slopes are too steep to build on, and where a road will need cut or fill.",
    },
    {
      chapter: GROUND,
      title: "Inspect the surface",
      description:
        "Selecting an object shows its data in Properties: point and triangle counts, elevation range, area and average slope. You can select from the 3D view or from the Objects list.",
      targetElement: "object-tree",
      action: "Click the terrain surface in the Objects list or in the 3D view.",
      completeWhen: () => isSelectedType("surface"),
    },
    {
      chapter: HORIZONTAL,
      title: "Switch to Design",
      description:
        "Design holds the road tools: alignments for plan geometry, profiles for elevation and corridors for the 3D model.",
      targetElement: "workspace-design",
      action: "Click the Design tab.",
      completeWhen: () => isWorkspace("design"),
    },
    {
      chapter: HORIZONTAL,
      title: "Open the Alignment tool",
      description:
        "An alignment is the road's centreline in plan: straight tangents joined by circular curves, optionally eased in with spirals.",
      targetElement: "tool-alignment",
      action: "Click Alignment.",
      completeWhen: () => isPanelOpen("alignment"),
    },
    {
      chapter: HORIZONTAL,
      title: "Create the alignment",
      description:
        "The demo alignment is a tangent–curve–tangent route about 140 m long: a 50 m straight, a 20 m-radius curve, then a 60 m straight. TerraForge samples it along its length so every other object can look up a position by station.",
      targetElement: "create-alignment-button",
      action: "Click Create Demo Alignment.",
      completeWhen: () => hasObjectOfType("alignment"),
    },
    {
      chapter: HORIZONTAL,
      title: "Read the stationing",
      description:
        "Labels like \"Sta 1+00\" mark distance along the alignment: 1+00 is 100 m from the start, 1+50 is 150 m. With the alignment selected, the plan editor below shows it north-up — scroll to zoom, drag to pan, double-click to fit.",
      targetElement: "bottom-editor",
      setup: () => {
        ensureLabelsVisible();
        selectFirstOfType("alignment");
      },
      whyItMatters:
        "Stations are the shared coordinate system of a road project. Profiles, cross-sections, pipes and quantities are all referenced to them.",
    },
    {
      chapter: VERTICAL,
      title: "Open the Profile tool",
      description:
        "A profile sets the road's elevation at every station — how it climbs and falls along the alignment.",
      targetElement: "tool-profile",
      action: "Click Profile.",
      completeWhen: () => isPanelOpen("profile"),
    },
    {
      chapter: VERTICAL,
      title: "Create the profile",
      description:
        "Your alignment is already chosen. The demo profile has four PVIs (points of vertical intersection); between them the grade is constant, and vertical curves round off each change in grade.",
      targetElement: "profile-form",
      action: "Click Create Demo Profile.",
      completeWhen: () => hasObjectOfType("profile"),
      whyItMatters:
        "Vertical curves keep a crest from hiding oncoming traffic and a sag from jolting drivers. Longer curves are smoother but move more earth.",
    },
    {
      chapter: CORRIDOR,
      title: "Open the Corridor tool",
      description:
        "A corridor combines alignment (where), profile (how high) and a cross-section template (lanes, shoulders, side slopes) into a 3D road model.",
      targetElement: "tool-corridor",
      action: "Click Corridor.",
      completeWhen: () => isPanelOpen("corridor"),
    },
    {
      chapter: CORRIDOR,
      title: "Build the corridor",
      description:
        "The alignment and profile you just made are pre-selected. The cross-section interval is how often the template is placed along the road: smaller values follow curves more closely at the cost of more geometry.",
      targetElement: "corridor-form",
      action: "Click Build Corridor.",
      completeWhen: () => hasObjectOfType("corridor"),
    },
    {
      chapter: CORRIDOR,
      title: "Fly to your road",
      description:
        "The grey ribbon is your road. Double-click it to frame it, then orbit to see where it rises above the terrain (fill) and where it cuts into it (cut).",
      targetElement: "viewport",
      action: "Double-click the corridor, then press Next.",
      whyItMatters:
        "Cut and fill drive most of a road's earthwork cost. Designers iterate on the profile to balance them.",
    },
    {
      chapter: REVIEW,
      title: "Everything is connected",
      description:
        "The Objects list now shows surface, alignment, profile and corridor. The corridor records the alignment and profile it was built from as dependencies, so the project always knows what feeds what.",
      targetElement: "object-tree",
    },
    {
      chapter: REVIEW,
      title: "Review your history",
      description:
        "Every change is recorded. The History timeline lets you step back to any earlier state of the project, so experimenting is safe.",
      targetElement: () => (isWorkspace("home") ? "tool-history" : "workspace-home"),
      action: "Open the Home tab, then click History.",
      completeWhen: () => isDockVisible("timeline"),
    },
    {
      chapter: REVIEW,
      title: "Save the project",
      description:
        "Save writes a .terra project file you can reopen later. Ctrl+S works from anywhere.",
      targetElement: () => (isWorkspace("home") ? "tool-save" : "workspace-home"),
      whyItMatters:
        "Next, try the drainage tutorial to add storm pipes along this road, or switch to Professional mode in the status bar for the full toolset.",
    },
  ],
};
