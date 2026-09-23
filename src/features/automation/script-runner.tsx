import { Button } from "@/components/ui/button";

export function ScriptRunner() {
  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Script Runner
      </h3>

      <p className="text-xs text-text-muted">
        Execute saved automation workflows or custom scripts against your
        current project.
      </p>

      <div className="p-2 bg-surface-overlay rounded text-xs text-text-muted">
        No scripts available. Create scripts using the Visual Editor.
      </div>

      <Button variant="secondary" size="sm" className="w-full" disabled>
        Run Script (Coming Soon)
      </Button>
    </div>
  );
}
