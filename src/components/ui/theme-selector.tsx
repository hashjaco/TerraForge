import { useUIStore, type Theme } from "@/stores/ui-store";

const THEMES: { id: Theme; label: string; dark: boolean; preview: string }[] = [
  { id: "midnight", label: "Midnight", dark: true, preview: "#0a0a0a" },
  { id: "slate", label: "Slate", dark: true, preview: "#0f172a" },
  { id: "nord", label: "Nord", dark: true, preview: "#2e3440" },
  { id: "solarized-dark", label: "Solarized Dark", dark: true, preview: "#002b36" },
  { id: "light", label: "Light", dark: false, preview: "#f8fafc" },
  { id: "solarized-light", label: "Solarized Light", dark: false, preview: "#fdf6e3" },
];

export function ThemeSelector() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  return (
    <div className="p-3 space-y-2">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Theme
      </h3>
      <div className="grid grid-cols-3 gap-1.5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
              theme === t.id
                ? "border-primary-500 bg-primary-950/30"
                : "border-border hover:border-border-active bg-surface-overlay"
            }`}
          >
            <div
              className="w-6 h-6 rounded-full border border-border"
              style={{ background: t.preview }}
            />
            <span className="text-[10px] text-text-secondary">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
