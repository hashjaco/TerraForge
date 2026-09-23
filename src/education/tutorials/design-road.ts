import type { TutorialDefinition } from "./index";

export const designRoadTutorial: TutorialDefinition = {
  id: "design-road",
  title: "Design a Road",
  description:
    "Learn the full road design workflow: alignment, profile, and corridor.",
  difficulty: "intermediate",
  estimatedMinutes: 10,
  steps: [
    {
      title: "Road Design Overview",
      description:
        "Designing a road involves three key steps: (1) Define the horizontal path (Alignment), (2) Set the vertical elevation (Profile), (3) Create the 3D road model (Corridor). Let's walk through each step.",
      whyItMatters:
        "This alignment → profile → corridor workflow is the standard in civil engineering. Understanding it is essential for any road or rail project.",
    },
    {
      title: "Create an Alignment",
      description:
        "An alignment defines WHERE the road goes in plan view. It's made of straight lines, circular arcs, and transition spirals. Create a demo alignment to see how these geometric elements connect.",
      targetElement: "alignment-panel",
    },
    {
      title: "Understand Stationing",
      description:
        'Notice the alignment has a "length" shown in the properties. Every point along the alignment has a "station" value — its distance from the start. Station 0+00 is the beginning, Station 1+50 means 150 meters from the start.',
      whyItMatters:
        "Stationing is the universal reference system in road design. All other elements (profiles, corridors, utilities) reference stations along the alignment.",
    },
    {
      title: "Create a Profile",
      description:
        "Now set the VERTICAL elevation of the road. A profile defines how high or low the road is at each station. Create a demo profile for your alignment.",
      targetElement: "profile-panel",
    },
    {
      title: "Profile Points (PVIs)",
      description:
        "The profile is defined by Points of Vertical Intersection (PVIs). Each PVI has a station, elevation, and curve length. Vertical curves smooth the transitions between grade changes.",
      whyItMatters:
        "Vertical curves ensure safe driving. Too sharp a curve at a hilltop can block driver sightlines. The curve length controls how smooth the transition is.",
    },
    {
      title: "Build a Corridor",
      description:
        "Now combine the alignment + profile + a cross-section template to create a 3D corridor. The template defines the road width, lanes, shoulders, and slopes. Select your alignment and profile, then build.",
      targetElement: "corridor-panel",
    },
    {
      title: "Explore the Corridor",
      description:
        "Your 3D road model appears in the viewport! The corridor is created by sweeping the cross-section template along the alignment at the profile's elevation. Change the cross-section frequency to see the effect.",
    },
    {
      title: "Road Design Complete",
      description:
        "You've completed the full road design workflow: Alignment (where) → Profile (how high) → Corridor (3D model). In practice, you'd iterate on each step, refining the design until it meets requirements.",
      whyItMatters:
        "This parametric approach means changes propagate automatically. Move an alignment PI, and the profile and corridor update to match.",
    },
  ],
};
