import { useUIStore, type ActivePanel, type WorkspaceId } from "@/stores/ui-store";
import { useEducationStore } from "@/stores/education-store";
import { SurfacePanel } from "@/features/surface/surface-panel";
import { SurfaceImport } from "@/features/surface/surface-import";
import { AlignmentPanel } from "@/features/alignment/alignment-panel";
import { ProfilePanel } from "@/features/profile/profile-panel";
import { CorridorPanel } from "@/features/corridor/corridor-panel";
import { PipePanel } from "@/features/pipe-network/pipe-panel";
import { GradingPanel } from "@/features/grading/grading-panel";
import { ParcelPanel } from "@/features/parcel/parcel-panel";
import { SurveyPanel } from "@/features/survey/survey-panel";
import { DrainagePanel } from "@/features/drainage/drainage-panel";

const PANEL_META: Record<
  NonNullable<ActivePanel>,
  { title: string; component: React.ComponentType; workspace: WorkspaceId }
> = {
  "surface-create": { title: "Create Surface", component: SurfacePanel, workspace: "surface" },
  "surface-import": { title: "Import Surface", component: SurfaceImport, workspace: "surface" },
  alignment: { title: "Alignment", component: AlignmentPanel, workspace: "design" },
  profile: { title: "Profile", component: ProfilePanel, workspace: "design" },
  corridor: { title: "Corridor", component: CorridorPanel, workspace: "design" },
  "pipe-network": { title: "Pipe Network", component: PipePanel, workspace: "drainage" },
  grading: { title: "Grading", component: GradingPanel, workspace: "design" },
  parcel: { title: "Parcels", component: ParcelPanel, workspace: "design" },
  survey: { title: "Survey", component: SurveyPanel, workspace: "design" },
  drainage: { title: "Catchments & Drainage", component: DrainagePanel, workspace: "drainage" },
  "pressure-network": { title: "Pressure Network", component: PipePanel, workspace: "drainage" },
  intersection: { title: "Intersection", component: AlignmentPanel, workspace: "design" },
};

const WORKSPACE_GUIDES: Record<WorkspaceId, { title: string; tips: string[] }> = {
  home: {
    title: "Welcome to TerraForge",
    tips: [
      "Use the ribbon tabs above to switch between workspaces",
      "Press Ctrl+K to open the command palette for quick access",
      "Toggle between Standard and Professional mode in the status bar",
    ],
  },
  surface: {
    title: "Surface Workspace",
    tips: [
      "Create terrain surfaces from point data or import DEM/GeoTIFF files",
      "Add breaklines and boundaries to refine your TIN",
      "Use the Quantity Takeoff tool for cut/fill volume calculations",
    ],
  },
  design: {
    title: "Design Workspace",
    tips: [
      "Start with an Alignment to define horizontal geometry",
      "Add a Profile for vertical design, then build a Corridor",
      "Use Grading tools for site earthwork and feature lines",
    ],
  },
  drainage: {
    title: "Drainage Workspace",
    tips: [
      "Create pipe networks for storm or sanitary drainage",
      "Define catchments and compute runoff using the Rational Method",
      "Pressure networks model water distribution systems",
    ],
  },
  docs: {
    title: "Documentation Workspace",
    tips: [
      "Generate plan/profile sheets for construction documents",
      "Run design checks to validate your project against standards",
    ],
  },
  automation: {
    title: "Automation Workspace",
    tips: [
      "Build visual scripts by connecting nodes in the Node Editor",
      "Automate repetitive design tasks and parameter studies",
    ],
  },
};

export function WorkspacePanel() {
  const activePanel = useUIStore((s) => s.activePanel);
  const activeWorkspace = useUIStore((s) => s.activeWorkspace);
  const setActivePanel = useUIStore((s) => s.setActivePanel);
  const visitedWorkspaces = useUIStore((s) => s.visitedWorkspaces);
  const educationMode = useEducationStore((s) => s.mode);
  const guidanceVisible = useEducationStore((s) => s.guidanceVisible);

  if (!activePanel) {
    const guide = WORKSPACE_GUIDES[activeWorkspace];
    const isFirstVisit = visitedWorkspaces.filter((w) => w === activeWorkspace).length <= 1;
    const showGuide = guidanceVisible && educationMode !== "expert";

    return (
      <div className="h-full overflow-y-auto p-3">
        {showGuide && guide && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-primary">
              {guide.title}
            </h3>
            {isFirstVisit && (
              <div className="px-2 py-1.5 rounded bg-primary-950/40 border border-primary-900/30">
                <p className="text-[10px] text-primary-300 font-medium mb-1">
                  First time here? Here are some tips:
                </p>
              </div>
            )}
            <ul className="space-y-1.5">
              {guide.tips.map((tip, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[11px] text-text-secondary"
                >
                  <span className="text-primary-500 mt-0.5 shrink-0">&#9679;</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!showGuide && (
          <p className="text-text-muted text-xs text-center">
            Select a tool from the ribbon.
          </p>
        )}
      </div>
    );
  }

  const meta = PANEL_META[activePanel];
  if (!meta) return null;

  const Component = meta.component;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
        <h3 className="text-xs font-semibold text-text-primary">
          {meta.title}
        </h3>
        <button
          onClick={() => setActivePanel(null)}
          className="text-text-muted hover:text-text-primary text-[10px] px-1.5 py-0.5 rounded hover:bg-surface-overlay transition-colors"
        >
          Close
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Component />
      </div>
    </div>
  );
}
