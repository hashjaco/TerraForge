import { useSelectionStore } from "@/stores/selection-store";
import { useProjectStore } from "@/stores/project-store";
import type { PipeNetworkObject } from "@/lib/types/civil-objects";
import { useRef, useEffect } from "react";

export function PipeNetworkEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedIds = useSelectionStore((s) => s.selectedIds);
  const objects = useProjectStore((s) => s.objects);

  const network =
    selectedIds.length === 1
      ? (objects.get(selectedIds[0]) as PipeNetworkObject | undefined)
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

    if (!network || network.type !== "pipe-network") {
      ctx.fillStyle = "#525252";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Select a pipe network to view", 20, 30);
      return;
    }

    if (network.data.nodes.length === 0) {
      ctx.fillStyle = "#525252";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText("Network is empty. Add nodes to begin.", 20, 30);
      return;
    }

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of network.data.nodes) {
      minX = Math.min(minX, node.position[0]);
      maxX = Math.max(maxX, node.position[0]);
      minY = Math.min(minY, node.position[1]);
      maxY = Math.max(maxY, node.position[1]);
    }

    const padding = 60;
    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scaleX = (w - 2 * padding) / rangeX;
    const scaleY = (h - 2 * padding) / rangeY;
    const scale = Math.min(scaleX, scaleY);

    const toX = (x: number) => padding + (x - minX) * scale;
    const toY = (y: number) => h - padding - (y - minY) * scale;

    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 3;
    for (const pipe of network.data.pipes) {
      const start = network.data.nodes.find((n) => n.id === pipe.start_node_id);
      const end = network.data.nodes.find((n) => n.id === pipe.end_node_id);
      if (!start || !end) continue;

      ctx.beginPath();
      ctx.moveTo(toX(start.position[0]), toY(start.position[1]));
      ctx.lineTo(toX(end.position[0]), toY(end.position[1]));
      ctx.stroke();

      const mx = (toX(start.position[0]) + toX(end.position[0])) / 2;
      const my = (toY(start.position[1]) + toY(end.position[1])) / 2;
      ctx.fillStyle = "#a3a3a3";
      ctx.font = "9px monospace";
      ctx.fillText(`D${(pipe.diameter * 1000).toFixed(0)}`, mx + 5, my - 5);
    }

    for (const node of network.data.nodes) {
      const x = toX(node.position[0]);
      const y = toY(node.position[1]);

      ctx.fillStyle =
        node.node_type === "Outlet"
          ? "#ef4444"
          : node.node_type === "Inlet"
            ? "#3b82f6"
            : "#22c55e";

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fafafa";
      ctx.font = "9px monospace";
      ctx.fillText(node.node_type, x + 10, y + 3);
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
        Pipe Network Graph
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
