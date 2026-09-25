import { useProjectStore } from "@/stores/project-store";
import { useSelectionStore } from "@/stores/selection-store";
import type { ObjectType, AnyCivilObject } from "@/lib/types/civil-objects";

const TYPE_ICONS: Record<ObjectType, string> = {
  surface: "S",
  alignment: "A",
  profile: "P",
  corridor: "C",
  "pipe-network": "N",
  "feature-line": "F",
  parcel: "L",
  "survey-db": "G",
  catchment: "D",
  "pressure-network": "W",
  intersection: "X",
};

const TYPE_COLORS: Record<ObjectType, string> = {
  surface: "text-green-400",
  alignment: "text-amber-400",
  profile: "text-blue-400",
  corridor: "text-purple-400",
  "pipe-network": "text-cyan-400",
  "feature-line": "text-orange-400",
  parcel: "text-teal-400",
  "survey-db": "text-rose-400",
  catchment: "text-sky-400",
  "pressure-network": "text-indigo-400",
  intersection: "text-violet-400",
};

const TYPE_ORDER: ObjectType[] = [
  "surface",
  "alignment",
  "profile",
  "corridor",
  "pipe-network",
  "feature-line",
  "parcel",
  "survey-db",
  "catchment",
  "pressure-network",
  "intersection",
];

export function ObjectTree() {
  const objects = useProjectStore((s) => s.objects);
  const select = useSelectionStore((s) => s.select);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const toggleVisibility = useProjectStore((s) => s.toggleVisibility);
  const removeObject = useProjectStore((s) => s.removeObject);

  const objectList = Array.from(objects.values());

  const grouped = new Map<ObjectType, AnyCivilObject[]>();
  for (const obj of objectList) {
    const existing = grouped.get(obj.type);
    if (existing) {
      grouped.set(obj.type, [...existing, obj]);
    } else {
      grouped.set(obj.type, [obj]);
    }
  }

  function handleDelete(id: string, name: string, hasDependents: boolean) {
    if (hasDependents) {
      const ok = window.confirm(
        `"${name}" has dependent objects. Deleting it may break those objects. Continue?`
      );
      if (!ok) return;
    }
    removeObject(id);
  }

  return (
    <div className="h-full overflow-y-auto p-3" data-tutorial-id="object-tree">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
        Objects
      </h3>

      {objectList.length === 0 && (
        <p className="text-xs text-text-muted italic">
          No objects yet. Switch to the Create tab to get started.
        </p>
      )}

      {TYPE_ORDER.map((type) => {
        const items = grouped.get(type);
        if (!items?.length) return null;

        return (
          <div key={type} className="mb-3">
            <h4 className="text-[11px] font-medium text-text-secondary uppercase mb-1">
              {type.replace("-", " ")}s
            </h4>
            {items.map((obj) => (
              <div
                key={obj.id}
                className={`group w-full text-left px-2 py-1.5 rounded text-sm flex items-center gap-2 transition-colors cursor-pointer ${
                  selectedIds.includes(obj.id)
                    ? "bg-primary-900/50 text-primary-300"
                    : "hover:bg-surface-overlay text-text-primary"
                }`}
                onClick={() => select(obj.id)}
              >
                <span
                  className={`w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold ${TYPE_COLORS[obj.type]}`}
                >
                  {TYPE_ICONS[obj.type]}
                </span>
                <span className="truncate flex-1">{obj.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(obj.id, obj.name, obj.dependents.length > 0);
                  }}
                  className="text-xs text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  Del
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(obj.id);
                  }}
                  className={`text-xs ${obj.visible ? "text-text-secondary" : "text-text-muted"}`}
                >
                  {obj.visible ? "V" : "H"}
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
