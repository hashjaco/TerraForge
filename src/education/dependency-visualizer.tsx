import { useProjectStore } from "@/stores/project-store";
import { useEducationStore } from "@/stores/education-store";

export function DependencyVisualizer() {
  const objects = useProjectStore((s) => s.objects);
  const show = useEducationStore((s) => s.showDependencyOverlay);
  const toggle = useEducationStore((s) => s.toggleDependencyOverlay);

  if (!show) return null;

  const objectList = Array.from(objects.values());

  return (
    <div className="fixed top-14 right-4 z-40 bg-surface-raised border border-border rounded-xl shadow-xl p-4 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          Dependencies
        </h3>
        <button
          onClick={toggle}
          className="text-xs text-text-muted hover:text-text-primary"
        >
          Close
        </button>
      </div>

      {objectList.length === 0 ? (
        <p className="text-xs text-text-muted italic">No objects to show.</p>
      ) : (
        <div className="space-y-2">
          {objectList.map((obj) => (
            <div key={obj.id} className="text-xs">
              <div className="font-medium text-text-primary">{obj.name}</div>
              {obj.dependencies.length > 0 && (
                <div className="ml-3 text-text-muted">
                  depends on:{" "}
                  {obj.dependencies.map((depId) => {
                    const dep = objects.get(depId);
                    return dep?.name || depId.slice(0, 8);
                  }).join(", ")}
                </div>
              )}
              {obj.dependents.length > 0 && (
                <div className="ml-3 text-primary-400">
                  feeds:{" "}
                  {obj.dependents.map((depId) => {
                    const dep = objects.get(depId);
                    return dep?.name || depId.slice(0, 8);
                  }).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
