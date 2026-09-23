import { Button } from "@/components/ui/button";
import { useSelectionStore } from "@/stores/selection-store";

export function ProfileTools() {
  const setActiveTool = useSelectionStore((s) => s.setActiveTool);
  const activeTool = useSelectionStore((s) => s.activeTool);

  const tools = [
    { id: "profile-add-pvi", label: "Add PVI" },
    { id: "profile-edit-pvi", label: "Edit PVI" },
    { id: "profile-delete-pvi", label: "Delete PVI" },
  ];

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Profile Tools
      </h3>
      <div className="space-y-1">
        {tools.map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "primary" : "ghost"}
            size="sm"
            onClick={() =>
              setActiveTool(activeTool === tool.id ? null : tool.id)
            }
            className="w-full justify-start"
          >
            {tool.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
