import { useEffect, useState } from "react";
import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { RibbonToolbar } from "./ribbon-toolbar";
import { StatusBar } from "./status-bar";
import { Viewport } from "@/renderer/viewport";
import { useUIStore } from "@/stores/ui-store";
import { useLlmSettingsStore } from "@/stores/llm-settings-store";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import { PropertyPanel } from "@/components/properties/property-panel";
import { ObjectTree } from "./object-tree";
import { WorkspacePanel } from "./workspace-panel";
import { Tabs } from "@/components/ui/tabs";
import { SurfaceAnalysis } from "@/features/surface/surface-analysis";
import { FlowAnalysis } from "@/features/pipe-network/flow-analysis";
import { ValidationPanel } from "@/features/validation/validation-panel";
import { LearningModeSelector } from "@/education/learning-mode";
import { AlignmentEditor } from "@/components/editors/alignment-editor";
import { ProfileEditor } from "@/components/editors/profile-editor";
import { TemplateEditor } from "@/components/editors/template-editor";
import { PipeNetworkEditor } from "@/components/editors/pipe-network-editor";
import { HistoryTimeline } from "@/components/timeline/history-timeline";
import { QuantityTakeoff } from "@/features/documentation/quantity-takeoff";
import { SheetGenerator } from "@/features/documentation/sheet-generator";
import { NodeEditor } from "@/features/automation/node-editor";
import { ThemeSelector } from "@/components/ui/theme-selector";
import { AssistantPanel } from "@/features/assistant/assistant-panel";
import { AiProviderSettings } from "@/features/settings/ai-provider-settings";
import { tutorials } from "@/education/tutorials";
import { useEducationStore } from "@/stores/education-store";

function SettingsPanel() {
  return (
    <div className="h-full overflow-y-auto">
      <ThemeSelector />
      <div className="border-t border-border" />
      <AiProviderSettings />
    </div>
  );
}

function GuidePanel() {
  const startTutorial = useEducationStore((s) => s.startTutorial);
  const completedTutorials = useEducationStore((s) => s.completedTutorials);

  return (
    <div className="h-full overflow-y-auto">
      <LearningModeSelector />
      <div className="border-t border-border" />
      <div className="p-3 space-y-2">
        <h3 className="text-xs font-semibold text-text-secondary uppercase">
          Tutorials
        </h3>
        {tutorials.map((t, index) => {
          const done = completedTutorials.includes(t.id);
          const featured = index === 0 && !done;
          return (
            <button
              key={t.id}
              onClick={() => startTutorial(t.id, t.steps.length)}
              className={`w-full text-left p-2.5 rounded-lg bg-surface-overlay hover:bg-surface-secondary hover:shadow-elev-1 transition-[background-color,box-shadow] duration-150 ${
                featured ? "ring-1 ring-primary-500/50 bg-primary-500/5" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-text-primary font-medium">
                  {t.title}
                </span>
                {featured && (
                  <span className="shrink-0 text-[10px] font-semibold text-primary-300 bg-primary-500/15 px-1.5 py-0.5 rounded">
                    Start here
                  </span>
                )}
                {done && (
                  <span className="text-[10px] text-green-400">Done</span>
                )}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {t.description}
              </div>
              <div className="text-[10px] text-text-muted mt-1">
                {t.difficulty} &middot; ~{t.estimatedMinutes} min &middot;{" "}
                {t.steps.length} steps
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function useIsAlignmentSelected(): boolean {
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectedType = useProjectStore((s) =>
    selectedIds.length === 1 ? s.objects.get(selectedIds[0])?.type : undefined,
  );
  return selectedType === "alignment";
}

function BottomEditorPanel() {
  const panels = useUIStore((s) => s.panels);
  const alignmentSelected = useIsAlignmentSelected();

  const hasAnyEditor =
    alignmentSelected ||
    panels["profile-editor"]?.visible ||
    panels["template-editor"]?.visible ||
    panels["pipe-editor"]?.visible ||
    panels["timeline"]?.visible ||
    panels["qto"]?.visible ||
    panels["sheets"]?.visible;

  if (!hasAnyEditor) return null;

  return (
    <>
      <ResizeHandleVertical />
      <Panel
        defaultSize="35%"
        minSize="15%"
        maxSize="60%"
        className="bg-surface-raised"
      >
        <div className="h-full flex flex-col" data-tutorial-id="bottom-editor">
          <EditorTabs />
        </div>
      </Panel>
    </>
  );
}

function EditorTabs() {
  const panels = useUIStore((s) => s.panels);
  const setPanelVisible = useUIStore((s) => s.setPanelVisible);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const selectedObj =
    selectedIds.length === 1 ? objects.get(selectedIds[0]) : undefined;

  const editorTabs: { id: string; label: string; content: React.ReactNode }[] =
    [];

  if (panels["profile-editor"]?.visible) {
    editorTabs.push({
      id: "profile-editor",
      label: "Profile",
      content: <ProfileEditor />,
    });
  }
  if (panels["template-editor"]?.visible) {
    editorTabs.push({
      id: "template-editor",
      label: "Template",
      content: <TemplateEditor />,
    });
  }
  if (panels["pipe-editor"]?.visible) {
    editorTabs.push({
      id: "pipe-editor",
      label: "Pipe Network",
      content: <PipeNetworkEditor />,
    });
  }
  if (panels["timeline"]?.visible) {
    editorTabs.push({
      id: "timeline",
      label: "History",
      content: <HistoryTimeline />,
    });
  }
  if (panels["qto"]?.visible) {
    editorTabs.push({
      id: "qto",
      label: "Quantity Takeoff",
      content: <QuantityTakeoff />,
    });
  }
  if (panels["sheets"]?.visible) {
    editorTabs.push({
      id: "sheets",
      label: "Sheets",
      content: <SheetGenerator />,
    });
  }

  if (selectedObj?.type === "alignment") {
    editorTabs.unshift({
      id: "align-ed",
      label: "Alignment",
      content: <AlignmentEditor />,
    });
  }

  const resolvedActiveId =
    editorTabs.find((t) => t.id === activeTabId)?.id ??
    editorTabs[0]?.id ??
    null;
  const activeContent = editorTabs.find(
    (t) => t.id === resolvedActiveId
  )?.content;

  if (editorTabs.length === 0) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-border shrink-0">
        {editorTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium border-b-2 transition-colors ${
              tab.id === resolvedActiveId
                ? "text-primary-400 border-primary-500"
                : "text-text-secondary border-transparent hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => {
            for (const tab of editorTabs) {
              if (tab.id === "align-ed") useSelectionStore.getState().clearSelection();
              else setPanelVisible(tab.id as any, false);
            }
          }}
          className="px-2 py-1 text-xs text-text-muted hover:text-text-primary mr-1"
        >
          Close
        </button>
      </div>
      <div className="flex-1 min-h-0">{activeContent}</div>
    </div>
  );
}

function AnalysisPanel() {
  return (
    <div className="h-full overflow-y-auto">
      <SurfaceAnalysis />
      <div className="border-t border-border" />
      <FlowAnalysis />
    </div>
  );
}

function ResizeHandleHorizontal() {
  return (
    <PanelResizeHandle className="group w-1.5 bg-transparent hover:bg-primary-500/30 active:bg-primary-500/50 transition-colors" />
  );
}

function ResizeHandleVertical() {
  return (
    <PanelResizeHandle className="group h-1.5 bg-transparent hover:bg-primary-500/30 active:bg-primary-500/50 transition-colors" />
  );
}

function LeftSidebar() {
  const activePanel = useUIStore((s) => s.activePanel);
  const professionalMode = useUIStore((s) => s.professionalMode);

  if (activePanel && professionalMode) {
    const tabs = [
      { id: "objects", label: "Objects", content: <ObjectTree /> },
      { id: "workspace", label: "Tools", content: <WorkspacePanel /> },
    ];
    return <Tabs tabs={tabs} defaultTab="workspace" />;
  }

  if (activePanel) {
    const tabs = [
      { id: "objects", label: "Objects", content: <ObjectTree /> },
      { id: "workspace", label: "Tools", content: <WorkspacePanel /> },
    ];
    return <Tabs tabs={tabs} defaultTab="workspace" />;
  }

  return (
    <div className="h-full flex flex-col">
      <ObjectTree />
    </div>
  );
}

function RightSidebar() {
  const professionalMode = useUIStore((s) => s.professionalMode);
  const rightSidebarTab = useUIStore((s) => s.rightSidebarTab);
  const setRightSidebarTab = useUIStore((s) => s.setRightSidebarTab);
  const refreshKeyStatus = useLlmSettingsStore((s) => s.refreshKeyStatus);

  useEffect(() => {
    refreshKeyStatus();
  }, [refreshKeyStatus]);

  const rightTabs = [
    { id: "properties", label: "Properties", content: <PropertyPanel /> },
    ...(professionalMode
      ? [
          { id: "analysis", label: "Analysis", content: <AnalysisPanel /> },
          {
            id: "validation",
            label: "Checks",
            content: <ValidationPanel />,
          },
          { id: "assistant", label: "Assistant", content: <AssistantPanel /> },
          { id: "guide", label: "Guide", content: <GuidePanel /> },
          { id: "settings", label: "Settings", content: <SettingsPanel /> },
        ]
      : [
          { id: "assistant", label: "Assistant", content: <AssistantPanel /> },
          { id: "guide", label: "Guide", content: <GuidePanel /> },
          { id: "settings", label: "Settings", content: <SettingsPanel /> },
        ]),
  ];

  return <Tabs tabs={rightTabs} active={rightSidebarTab} onChange={setRightSidebarTab} />;
}

export function AppShell() {
  const panels = useUIStore((s) => s.panels);
  const showNodeEditor = panels["node-editor"]?.visible;

  return (
    <div className="flex flex-col w-full h-full bg-surface text-text-primary">
      <RibbonToolbar />
      <div aria-hidden className="h-px accent-hairline shrink-0" />

      <div className="flex-1 min-h-0">
        <PanelGroup orientation="horizontal" className="h-full">
          {panels["object-tree"]?.visible && (
            <>
              <Panel
                defaultSize="22%"
                minSize="14%"
                maxSize="35%"
                className="bg-surface-raised"
              >
                <LeftSidebar />
              </Panel>
              <ResizeHandleHorizontal />
            </>
          )}

          <Panel defaultSize="48%" minSize="20%" className="overflow-hidden">
            {showNodeEditor ? (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-surface-raised shrink-0">
                  <span className="text-xs font-medium text-text-primary">
                    Node Editor
                  </span>
                  <button
                    onClick={() =>
                      useUIStore
                        .getState()
                        .setPanelVisible("node-editor", false)
                    }
                    className="text-[10px] text-text-muted hover:text-text-primary px-1.5 py-0.5 rounded hover:bg-surface-overlay"
                  >
                    Close
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <NodeEditor />
                </div>
              </div>
            ) : (
              <PanelGroup orientation="vertical">
                <Panel defaultSize="65%" minSize="30%">
                  <Viewport />
                </Panel>
                <BottomEditorPanel />
              </PanelGroup>
            )}
          </Panel>

          {panels["properties"]?.visible && (
            <>
              <ResizeHandleHorizontal />
              <Panel
                defaultSize="30%"
                minSize="16%"
                maxSize="40%"
                className="bg-surface-raised"
              >
                <RightSidebar />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      <StatusBar />
    </div>
  );
}
