import { useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { TutorialOverlay } from "@/education/tutorial-overlay";
import { DependencyVisualizer } from "@/education/dependency-visualizer";
import { TooltipGlossary } from "@/education/tooltip-glossary";
import { useKeyboardShortcuts } from "@/lib/keyboard-shortcuts";
import { useAutoOpenEditors } from "@/lib/auto-open-editors";
import { useUIStore } from "@/stores/ui-store";

function useThemeSync() {
  const theme = useUIStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
}

export default function App() {
  useKeyboardShortcuts();
  useAutoOpenEditors();
  useThemeSync();

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
