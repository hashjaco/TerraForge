import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { TutorialOverlay } from "@/education/tutorial-overlay";
import { DependencyVisualizer } from "@/education/dependency-visualizer";
import { TooltipGlossary } from "@/education/tooltip-glossary";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAutoOpenEditors } from "@/lib/auto-open-editors";

export default function App() {
  useKeyboardShortcuts();
  useAutoOpenEditors();

  return (
    <>
      <AppShell />
      <CommandPalette />
      <TutorialOverlay />
      <DependencyVisualizer />
      <TooltipGlossary />
    </>
  );
}
