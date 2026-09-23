import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/stores/selection-store";

export function AlignmentTools() {
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);
  const activeTool = useSelectionStore((s) => s.activeTool);

  const tools = [
    { id: "align-line", label: "Add Line" },
    { id: "align-arc", label: "Add Arc" },
    { id: "align-spiral", label: "Add Spiral" },
    { id: "align-edit-pi", label: "Edit PI" },
  ];

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Alignment Tools
      </h3>
      <div className="grid grid-cols-2 gap-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "primary" : "ghost"}
            size="sm"
            onClick={() =>
              setActiveTool(activeTool === tool.id ? null : tool.id)
            }
          >
            {tool.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
