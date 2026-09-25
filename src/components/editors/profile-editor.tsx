import { useThemeColors } from "@/lib/theme-tokens";
import { useCanvas2d } from "./use-canvas-2d";
import { useState } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import type { ProfileObject } from "@/lib/types/civil-objects";

export function ProfileEditor() {
  const colors = useThemeColors();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);
  const [exaggeration, setExaggeration] = useState(5);

  const profile =
    selectedIds.length === 1
      ? (objects.get(selectedIds[0]) as ProfileObject | undefined)
      : undefined;

  function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const padding = 50;

    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, w, h);

    if (!profile || profile.type !== "profile") {
      ctx.fillStyle = colors.textMuted;
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Select a profile to edit", 20, 30);
      return;
    }

    const pts = profile.data.sampledPoints;
    if (pts.length < 4) return;

    let minS = Infinity, maxS = -Infinity, minE = Infinity, maxE = -Infinity;
    for (let i = 0; i < pts.length; i += 2) {
      minS = Math.min(minS, pts[i]);
      maxS = Math.max(maxS, pts[i]);
      minE = Math.min(minE, pts[i + 1]);
      maxE = Math.max(maxE, pts[i + 1]);
    }

    const rangeS = maxS - minS || 1;
    const rangeE = maxE - minE || 1;
    const scaleX = (w - 2 * padding) / rangeS;
    const scaleY = ((h - 2 * padding) / rangeE) * exaggeration;

    const toScreenX = (s: number) => padding + (s - minS) * scaleX;
    const toScreenY = (e: number) => h - padding - (e - minE) * scaleY;

    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 0.5;
    ctx.font = "9px monospace";
    ctx.fillStyle = colors.textMuted;

    const stationStep = Math.pow(10, Math.floor(Math.log10(rangeS)));
    for (let s = Math.ceil(minS / stationStep) * stationStep; s <= maxS; s += stationStep) {
      const x = toScreenX(s);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, h - padding);
      ctx.stroke();
      ctx.fillText(`${s.toFixed(0)}`, x - 10, h - padding + 15);
    }

    const elevStep = Math.pow(10, Math.floor(Math.log10(rangeE)));
    for (let e = Math.ceil(minE / elevStep) * elevStep; e <= maxE; e += elevStep) {
      const y = toScreenY(e);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
      ctx.fillText(`${e.toFixed(1)}`, 5, y + 3);
    }

    ctx.beginPath();
    ctx.moveTo(toScreenX(pts[0]), toScreenY(pts[1]));
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(toScreenX(pts[i]), toScreenY(pts[i + 1]));
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = colors.textSecondary;
    ctx.font = "10px monospace";
    ctx.fillText(`Station`, w / 2 - 20, h - 5);
    ctx.save();
    ctx.translate(12, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Elevation (${exaggeration}x)`, -30, 0);
    ctx.restore();
  }

  const canvasRef = useCanvas2d(draw);

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-surface/80 px-2 py-1 rounded">
        <span className="text-[11px] text-text-muted">Profile View</span>
        <label className="text-[11px] text-text-muted">V.E:</label>
        <input
          type="range"
          min="1"
          max="20"
          value={exaggeration}
          onChange={(e) => setExaggeration(parseInt(e.target.value))}
          className="w-16 h-1"
        />
        <span className="text-[11px] text-text-muted">{exaggeration}x</span>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
