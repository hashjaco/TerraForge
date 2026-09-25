import { useUIStore, type Theme } from "@/stores/ui-store";

function readVar(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export interface ThemeColors {
  surface: string;
  surfaceRaised: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  isLight: boolean;
}

export function readThemeColors(theme: Theme): ThemeColors {
  const colors: ThemeColors = {
    surface: readVar("--tf-surface", "#0a0a0a"),
    surfaceRaised: readVar("--tf-surface-raised", "#141414"),
    border: readVar("--tf-border", "#262626"),
    textPrimary: readVar("--tf-text-primary", "#fafafa"),
    textSecondary: readVar("--tf-text-secondary", "#a3a3a3"),
    textMuted: readVar("--tf-text-muted", "#525252"),
    accent: readVar("--tf-accent", "#3b82f6"),
    isLight: theme === "light" || theme === "solarized-light",
  };
  return colors;
}

// Canvas and WebGL can't consume CSS variables directly; re-read them per theme.
// `theme` is passed explicitly so the React Compiler keys its memoization on it.
export function useThemeColors(): ThemeColors {
  const theme = useUIStore((s) => s.theme);
  return readThemeColors(theme);
}
