import { useRef, useEffect, useState } from "react";
import type { TemplateElement } from "@/lib/types/civil-objects";

const DEFAULT_TEMPLATE: TemplateElement[] = [
  { type: "lane", width: 3.65, slope: -0.02, side: "left" },
  { type: "lane", width: 3.65, slope: -0.02, side: "right" },
  { type: "shoulder", width: 1.5, slope: -0.04, side: "left" },
  { type: "shoulder", width: 1.5, slope: -0.04, side: "right" },
  { type: "slope", width: 3.0, slope: -0.33, side: "left" },
  { type: "slope", width: 3.0, slope: -0.33, side: "right" },
];

const ELEMENT_COLORS: Record<string, string> = {
  lane: "#4ade80",
  shoulder: "#fbbf24",
  curb: "#94a3b8",
  sidewalk: "#a78bfa",
  slope: "#78716c",
  ditch: "#38bdf8",
};

export function TemplateEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements] = useState<TemplateElement[]>(DEFAULT_TEMPLATE);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const centerX = w / 2;
    const centerY = h * 0.6;
    const scale = 20;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX, h - 20);
    ctx.stroke();
    ctx.setLineDash([]);

    const leftElements = elements.filter((e) => e.side === "left");
    const rightElements = elements.filter((e) => e.side === "right");

    let leftOffset = 0;
    let leftElev = 0;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    for (const elem of leftElements) {
      leftOffset -= elem.width;
      leftElev += elem.slope * elem.width;
      const x = centerX + leftOffset * scale;
      const y = centerY - leftElev * scale;
      ctx.lineTo(x, y);

      ctx.fillStyle = ELEMENT_COLORS[elem.type] || "#666";
      ctx.fillRect(x, y - 2, elem.width * scale, 4);
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    let rightOffset = 0;
    let rightElev = 0;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    for (const elem of rightElements) {
      rightOffset += elem.width;
      rightElev += elem.slope * elem.width;
      const x = centerX + rightOffset * scale;
      const y = centerY - rightElev * scale;
      ctx.lineTo(x, y);

      ctx.fillStyle = ELEMENT_COLORS[elem.type] || "#666";
      ctx.fillRect(centerX + (rightOffset - elem.width) * scale, y - 2, elem.width * scale, 4);
    }
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = "10px Inter, sans-serif";
    let ly = 15;
    for (const [type, color] of Object.entries(ELEMENT_COLORS)) {
      if (elements.some((e) => e.type === type)) {
        ctx.fillStyle = color;
        ctx.fillRect(10, ly - 8, 10, 10);
        ctx.fillStyle = "#a3a3a3";
        ctx.fillText(type, 25, ly);
        ly += 16;
      }
    }
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
        Cross-Section Template
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
