import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import { PropertyFields } from "./property-fields";

export function PropertyPanel() {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);

  if (selectedIds.length === 0) {
    return (
      <div className="h-full p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Properties
        </h3>
        <p className="text-xs text-text-muted italic">
          Select an object to view its properties.
        </p>
      </div>
    );
  }

  if (selectedIds.length > 1) {
    return (
      <div className="h-full p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Properties
        </h3>
        <p className="text-xs text-text-muted">
          {selectedIds.length} objects selected
        </p>
      </div>
    );
  }

  const obj = objects.get(selectedIds[0]);
  if (!obj) return null;

  return (
    <div className="h-full overflow-y-auto p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Properties
      </h3>

      <div className="space-y-3">
        <div>
          <label className="text-[11px] text-text-muted block mb-1">Name</label>
          <div className="text-sm text-text-primary">{obj.name}</div>
        </div>

        <div>
          <label className="text-[11px] text-text-muted block mb-1">Type</label>
          <div className="text-sm text-text-primary capitalize">
            {obj.type.replace("-", " ")}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-text-muted block mb-1">ID</label>
          <div className="text-[11px] text-text-muted font-mono truncate">
            {obj.id}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-text-muted block mb-1">
            Version
          </label>
          <div className="text-sm text-text-primary">{obj.version}</div>
        </div>

        <div className="h-px bg-border my-2" />

        <PropertyFields object={obj} />
      </div>
    </div>
  );
}
