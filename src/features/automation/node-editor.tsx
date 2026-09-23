import { useCallback, useState } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";

const nodeCategories = [
  {
    name: "Surface",
    nodes: [
      { type: "createSurface", label: "Create Surface" },
      { type: "analyzeSurface", label: "Analyze Surface" },
      { type: "computeVolume", label: "Compute Volume" },
      { type: "generateContours", label: "Generate Contours" },
    ],
  },
  {
    name: "Alignment",
    nodes: [
      { type: "createAlignment", label: "Create Alignment" },
      { type: "sampleAlignment", label: "Sample Alignment" },
    ],
  },
  {
    name: "Corridor",
    nodes: [
      { type: "createCorridor", label: "Create Corridor" },
      { type: "setTemplate", label: "Set Template" },
    ],
  },
  {
    name: "Pipe Network",
    nodes: [
      { type: "createNetwork", label: "Create Network" },
      { type: "sizePipes", label: "Auto-Size Pipes" },
    ],
  },
  {
    name: "Math",
    nodes: [
      { type: "number", label: "Number" },
      { type: "add", label: "Add" },
      { type: "multiply", label: "Multiply" },
    ],
  },
  {
    name: "I/O",
    nodes: [
      { type: "readFile", label: "Read File" },
      { type: "exportDxf", label: "Export DXF" },
      { type: "exportLandXml", label: "Export LandXML" },
    ],
  },
];

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export function NodeEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showPalette, setShowPalette] = useState(false);
  const [nextId, setNextId] = useState(1);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string, label: string) => {
    const newNode: Node = {
      id: `node-${nextId}`,
      type: "default",
      position: { x: 150 + Math.random() * 200, y: 100 + Math.random() * 200 },
      data: { label: `${label}\n(${type})` },
      style: {
        background: "var(--color-surface-secondary)",
        border: "1px solid var(--color-border)",
        borderRadius: "6px",
        padding: "8px",
        fontSize: "11px",
        color: "var(--color-text-primary)",
      },
    };
    setNodes((nds) => [...nds, newNode]);
    setNextId((id) => id + 1);
    setShowPalette(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-border flex items-center justify-between">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          Visual Scripting
        </h3>
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowPalette(!showPalette)}
          >
            + Add Node
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              console.log("Script:", { nodes, edges });
            }}
          >
            Run
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        {showPalette && (
          <div className="absolute top-2 left-2 z-10 bg-surface border border-border rounded-lg shadow-xl p-3 w-52 max-h-80 overflow-y-auto">
            <h4 className="text-xs font-semibold text-text-secondary mb-2">
              Node Palette
            </h4>
            {nodeCategories.map((cat) => (
              <div key={cat.name} className="mb-2">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">
                  {cat.name}
                </p>
                {cat.nodes.map((n) => (
                  <button
                    key={n.type}
                    className="w-full text-left px-2 py-1 text-xs text-text-primary hover:bg-surface-secondary rounded"
                    onClick={() => addNode(n.type, n.label)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-surface"
        >
          <Controls />
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
