import { useState } from "react";
import { useProjectStore } from "@/stores/project-store";

type SheetType = "plan-profile" | "plan-only" | "profile-only" | "cross-section";

interface SheetConfig {
  sheetType: SheetType;
  alignmentId: string;
  scale: number;
  paperSize: "A3" | "A1" | "ARCH-D" | "ANSI-D";
  startStation: number;
  endStation: number;
  crossSectionInterval: number;
  titleBlock: string;
}

export function SheetGenerator() {
  const objects = useProjectStore((s) => s.objects);
  const [config, setConfig] = useState<SheetConfig>({
    sheetType: "plan-profile",
    alignmentId: "",
    scale: 500,
    paperSize: "A1",
    startStation: 0,
    endStation: 1000,
    crossSectionInterval: 20,
    titleBlock: "default",
  });
  const [sheets, setSheets] = useState<string[]>([]);

  const alignments = Array.from(objects.values()).filter(
    (o) => o.type === "alignment"
  );

  const generateSheets = () => {
    const sheetLength = config.scale * 0.84;
    const totalLength = config.endStation - config.startStation;
    const numSheets = Math.ceil(totalLength / sheetLength);

    const generated: string[] = [];
    for (let i = 0; i < numSheets; i++) {
      const startSta = config.startStation + i * sheetLength;
      const endSta = Math.min(startSta + sheetLength, config.endStation);
      generated.push(
        `Sheet ${i + 1}: Sta ${startSta.toFixed(0)} to ${endSta.toFixed(0)}`
      );
    }
    setSheets(generated);
  };

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-semibold text-text-secondary uppercase">
        Plan Production
      </h3>

      <div className="space-y-2">
        <label className="block text-xs text-text-muted">Sheet Type</label>
        <select
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={config.sheetType}
          onChange={(e) =>
            setConfig({ ...config, sheetType: e.target.value as SheetType })
          }
        >
          <option value="plan-profile">Plan & Profile</option>
          <option value="plan-only">Plan Only</option>
          <option value="profile-only">Profile Only</option>
          <option value="cross-section">Cross Sections</option>
        </select>

        <label className="block text-xs text-text-muted">Alignment</label>
        <select
          className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
          value={config.alignmentId}
          onChange={(e) => setConfig({ ...config, alignmentId: e.target.value })}
        >
          <option value="">Select alignment...</option>
          {alignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-text-muted">Scale (H)</label>
            <select
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={config.scale}
              onChange={(e) =>
                setConfig({ ...config, scale: parseInt(e.target.value) })
              }
            >
              <option value={100}>1:100</option>
              <option value={200}>1:200</option>
              <option value={500}>1:500</option>
              <option value={1000}>1:1000</option>
              <option value={2000}>1:2000</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted">Paper Size</label>
            <select
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={config.paperSize}
              onChange={(e) =>
                setConfig({
                  ...config,
                  paperSize: e.target.value as SheetConfig["paperSize"],
                })
              }
            >
              <option value="A3">A3</option>
              <option value="A1">A1</option>
              <option value="ARCH-D">ARCH D</option>
              <option value="ANSI-D">ANSI D</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-text-muted">Start Sta</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={config.startStation}
              onChange={(e) =>
                setConfig({
                  ...config,
                  startStation: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted">End Sta</label>
            <input
              type="number"
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={config.endStation}
              onChange={(e) =>
                setConfig({
                  ...config,
                  endStation: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>

        {config.sheetType === "cross-section" && (
          <div>
            <label className="block text-xs text-text-muted">
              X-Section Interval (m)
            </label>
            <input
              type="number"
              className="w-full px-2 py-1 text-xs bg-surface-secondary border border-border rounded"
              value={config.crossSectionInterval}
              onChange={(e) =>
                setConfig({
                  ...config,
                  crossSectionInterval: parseFloat(e.target.value) || 20,
                })
              }
            />
          </div>
        )}

        <button
          className="w-full px-3 py-1.5 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
          onClick={generateSheets}
          disabled={!config.alignmentId}
        >
          Generate Sheets
        </button>
      </div>

      {sheets.length > 0 && (
        <div className="space-y-1 border-t border-border pt-2">
          <h4 className="text-xs font-semibold text-text-secondary">
            Generated Sheets ({sheets.length})
          </h4>
          {sheets.map((sheet, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-2 py-1 text-xs bg-surface-secondary rounded"
            >
              <span className="text-text-primary">{sheet}</span>
              <button className="text-accent hover:underline text-xs">
                Export PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
