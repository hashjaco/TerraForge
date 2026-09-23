import { useHistoryStore } from "@/stores/history-store";

export function HistoryTimeline() {
  const entries = useHistoryStore((s) => s.entries);
  const currentIndex = useHistoryStore((s) => s.currentIndex);
  const goToEntry = useHistoryStore((s) => s.goToEntry);

  if (entries.length === 0) {
    return (
      <div className="h-full p-4">
        <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
          History
        </h3>
        <p className="text-xs text-text-muted italic">
          No history entries yet.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase mb-3">
        History
      </h3>
      <div className="space-y-1">
        {entries.map((entry, i) => (
          <button
            key={entry.id}
            onClick={() => goToEntry(i)}
            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
              i === currentIndex
                ? "bg-primary-900/50 text-primary-300"
                : i > currentIndex
                  ? "text-text-muted opacity-50"
                  : "text-text-secondary hover:bg-surface-overlay"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{entry.description}</span>
              <span className="text-[10px] text-text-muted">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
