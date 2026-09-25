import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useThemeColors } from "@/lib/theme-tokens";
import { useCanvas2d } from "./use-canvas-2d";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import type { AlignmentObject } from "@/lib/types/civil-objects";

interface ViewState {
  forId: string | undefined;
  zoom: number;
  offsetX: number;
  offsetY: number;
}

const FIT_PADDING = 40;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 200;
const TARGET_GRID_PX = 80;

function initialView(forId: string | undefined): ViewState {
  return { forId, zoom: 1, offsetX: 0, offsetY: 0 };
}

// Largest 1/2/5 × 10^n step whose on-screen spacing is at most TARGET_GRID_PX.
function niceGridStep(pixelsPerMeter: number): number {
  const raw = TARGET_GRID_PX / pixelsPerMeter;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  const factor = normalized >= 5 ? 5 : normalized >= 2 ? 2 : 1;
  return factor * magnitude;
}

function bounds(pts: number[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pts.length; i += 2) {
    minX = Math.min(minX, pts[i]);
    maxX = Math.max(maxX, pts[i]);
    minY = Math.min(minY, pts[i + 1]);
    maxY = Math.max(maxY, pts[i + 1]);
  }
  const box = { minX, maxX, minY, maxY };
  return box;
}

export function AlignmentEditor() {
  const colors = useThemeColors();
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const selected = useProjectStore((s) => (selectedId ? s.objects.get(selectedId) : undefined));
  const alignment = selected?.type === "alignment" ? (selected as AlignmentObject) : undefined;
  const pts = alignment?.data.sampledPoints ?? [];

  const [storedView, setView] = useState<ViewState>(() => initialView(selectedId));
  const view = storedView.forId === selectedId ? storedView : initialView(selectedId);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Pixel mapping: world is Y-up (north), canvas is Y-down.
  function transform(w: number, h: number) {
    const box = bounds(pts);
    const rangeX = box.maxX - box.minX || 1;
    const rangeY = box.maxY - box.minY || 1;
    const fit = Math.min((w - 2 * FIT_PADDING) / rangeX, (h - 2 * FIT_PADDING) / rangeY);
    const scale = Math.max(fit, 1e-6) * view.zoom;
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const mapping = {
      scale,
      toX: (x: number) => w / 2 + (x - cx) * scale + view.offsetX,
      toY: (y: number) => h / 2 - (y - cy) * scale + view.offsetY,
      fromX: (sx: number) => cx + (sx - w / 2 - view.offsetX) / scale,
      fromY: (sy: number) => cy - (sy - h / 2 - view.offsetY) / scale,
    };
    return mapping;
  }

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, t: ReturnType<typeof transform>) {
    const step = niceGridStep(t.scale);
    const left = t.fromX(0);
    const right = t.fromX(w);
    const bottom = t.fromY(h);
    const top = t.fromY(0);
    ctx.lineWidth = 1;
    for (let x = Math.ceil(left / step) * step; x <= right; x += step) {
      const major = Math.round(x / step) % 5 === 0;
      ctx.strokeStyle = colors.border;
      ctx.globalAlpha = major ? 0.9 : 0.4;
      const sx = Math.round(t.toX(x)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
      ctx.stroke();
    }
    for (let y = Math.ceil(bottom / step) * step; y <= top; y += step) {
      const major = Math.round(y / step) % 5 === 0;
      ctx.strokeStyle = colors.border;
      ctx.globalAlpha = major ? 0.9 : 0.4;
      const sy = Math.round(t.toY(y)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return step;
  }

  function drawNorthArrow(ctx: CanvasRenderingContext2D, w: number) {
    const x = w - 24;
    const y = 18;
    ctx.fillStyle = colors.textSecondary;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 5, y + 12);
    ctx.lineTo(x, y + 9);
    ctx.lineTo(x - 5, y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.font = "600 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("N", x, y + 24);
    ctx.textAlign = "start";
  }

  function draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.fillStyle = colors.surface;
    ctx.fillRect(0, 0, w, h);

    if (!alignment || pts.length < 4) {
      ctx.fillStyle = colors.textMuted;
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(alignment ? "Alignment has no geometry yet" : "Select an alignment to edit", 20, 44);
      return;
    }

    const t = transform(w, h);
    const gridStep = drawGrid(ctx, w, h, t);
    drawNorthArrow(ctx, w);

    ctx.beginPath();
    ctx.moveTo(t.toX(pts[0]), t.toY(pts[1]));
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(t.toX(pts[i]), t.toY(pts[i + 1]));
    }
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();

    const endpoints: [number, number, string][] = [
      [pts[0], pts[1], "Start"],
      [pts[pts.length - 2], pts[pts.length - 1], "End"],
    ];
    ctx.font = "10px Inter, sans-serif";
    for (const [x, y, label] of endpoints) {
      const sx = t.toX(x);
      const sy = t.toY(y);
      ctx.fillStyle = colors.accent;
      ctx.beginPath();
      ctx.arc(sx, sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.textSecondary;
      ctx.fillText(label, sx + 7, sy - 7);
    }

    ctx.fillStyle = colors.textSecondary;
    ctx.font = "10px ui-monospace, monospace";
    ctx.fillText(
      `Length ${alignment.data.totalLength.toFixed(1)} m   Grid ${gridStep} m`,
      10,
      h - 10,
    );
  }

  const canvasRef = useCanvas2d(draw);

  // React registers wheel listeners as passive, so preventDefault needs a native listener.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const px = e.clientX - rect.left - rect.width / 2;
      const py = e.clientY - rect.top - rect.height / 2;
      const factor = Math.exp(-e.deltaY * 0.0015);
      setView((prev) => {
        const base = prev.forId === selectedId ? prev : initialView(selectedId);
        const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, base.zoom * factor));
        const k = zoom / base.zoom;
        // Keep the world point under the cursor fixed while zooming.
        const next = {
          forId: selectedId,
          zoom,
          offsetX: px - (px - base.offsetX) * k,
          offsetY: py - (py - base.offsetY) * k,
        };
        return next;
      });
    }
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [canvasRef, selectedId]);

  function handlePointerDown(e: ReactPointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }

  function handlePointerMove(e: ReactPointerEvent<HTMLCanvasElement>) {
    const last = dragRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    dragRef.current = { x: e.clientX, y: e.clientY };
    setView((prev) => {
      const base = prev.forId === selectedId ? prev : initialView(selectedId);
      const next = { ...base, offsetX: base.offsetX + dx, offsetY: base.offsetY + dy };
      return next;
    });
  }

  function handlePointerUp() {
    dragRef.current = null;
  }

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 text-[11px] text-text-muted glass px-2 py-1 rounded-md">
        Alignment Plan View
        <span className="ml-2 text-text-muted/70">scroll to zoom · drag to pan · double-click to fit</span>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => setView(initialView(selectedId))}
      />
    </div>
  );
}
