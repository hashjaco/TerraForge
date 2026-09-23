import type { TutorialDefinition } from "./index";

export const drainageSystemTutorial: TutorialDefinition = {
  id: "drainage-system",
  title: "Build a Drainage System",
  description: "Learn how to create a storm drainage pipe network.",
  difficulty: "intermediate",
  estimatedMinutes: 8,
  steps: [
    {
      title: "Drainage Systems Overview",
      description:
        "Storm drainage collects rainwater from roads and surfaces and conveys it to an outlet (like a stream or detention pond). The system consists of inlets, manholes, pipes, and outlets.",
      whyItMatters:
        "Without proper drainage, water pools on roads (hazardous), erodes slopes, and floods properties. Drainage design is a critical part of every civil project.",
    },
    {
      title: "Create a Pipe Network",
      description:
        'Create a new pipe network and select the system type. For storm drainage, choose "Storm Sewer." This creates an empty network that you\'ll populate with nodes and pipes.',
      targetElement: "pipe-panel",
    },
    {
      title: "Add Nodes",
      description:
        "Pipe networks are graphs: nodes (manholes, inlets, outlets) connected by pipe segments. Add nodes by specifying their position, type, rim elevation (ground level), and invert elevation (pipe bottom).",
      whyItMatters:
        "The invert elevation determines flow direction — water flows downhill through pipes. The rim elevation must match the road surface.",
    },
    {
      title: "Connect with Pipes",
      description:
        "Add pipe segments between nodes. Specify the diameter and material. The slope is automatically calculated from the invert elevations of the connected nodes.",
      whyItMatters:
        "Pipe slope controls flow velocity. Too flat = sediment buildup. Too steep = erosive velocities. Typical storm sewers use 0.5% to 3% slopes.",
    },
    {
      title: "Run Flow Analysis",
      description:
        "Use the Flow Analysis tool to check if your pipes can handle the design flow. Manning's equation calculates the capacity and velocity of each pipe. Green = adequate, Red = undersized.",
      targetElement: "flow-analysis",
    },
    {
      title: "Drainage Design Complete",
      description:
        "You've created a basic storm drainage network. Real projects would include: hydrology calculations for design flow, detailed inlet sizing, detention/retention design, and regulatory compliance checks.",
    },
  ],
};
