import { useRef, useEffect, useState } from "react";
import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import type { AlignmentObject } from "@/lib/types/civil-objects";

export function AlignmentEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);
  const [pan, setPan] = useState({ x: 200, y: 200 });
  const [scale, setScale] = useState(3);

  const alignment =
    selectedIds.length === 1
      ? (objects.get(selectedIds[0]) as AlignmentObject | undefined)
      : undefined;

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 0.5;
    const gridStep = 10 * scale;
    for (let x = pan.x % gridStep; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = pan.y % gridStep; y < h; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (!alignment || alignment.type !== "alignment") {
      ctx.fillStyle = "#525252";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Select an alignment to edit", 20, 30);
      return;
    }

    const pts = alignment.data.sampledPoints;
    if (pts.length < 4) return;

    ctx.beginPath();
    ctx.moveTo(pan.x + pts[0] * scale, pan.y + pts[1] * scale);
    for (let i = 2; i < pts.length; i += 2) {
      ctx.lineTo(pan.x + pts[i] * scale, pan.y + pts[i + 1] * scale);
    }
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#60a5fa";
    ctx.beginPath();
    ctx.arc(pan.x + pts[0] * scale, pan.y + pts[1] * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    const lastX = pts[pts.length - 2];
    const lastY = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(pan.x + lastX * scale, pan.y + lastY * scale, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#a3a3a3";
    ctx.font = "10px monospace";
    ctx.fillText(`Length: ${alignment.data.totalLength.toFixed(1)}m`, 10, h - 10);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    });
    observer.observe(canvas);
    draw();
    return () => observer.disconnect();
  });

  return (
    <div className="h-full relative">
      <div className="absolute top-2 left-2 z-10 text-[11px] text-text-muted bg-surface/80 px-2 py-1 rounded">
        Alignment Plan View
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onWheel={(e) => {
          e.preventDefault();
          setScale((s) => Math.max(0.5, Math.min(20, s - e.deltaY * 0.01)));
        }}
      />
    </div>
  );
}
