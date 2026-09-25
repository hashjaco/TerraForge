import { useEffect, useRef } from "react";

export type DrawFn = (ctx: CanvasRenderingContext2D, width: number, height: number) => void;

// Sizes the backing store to CSS size × devicePixelRatio (sharp on HiDPI) and
// coalesces redraws from renders and resizes into one per animation frame.
export function useCanvas2d(draw: DrawFn) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  const frameRef = useRef(0);

  function paint() {
    frameRef.current = 0;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const backingWidth = Math.round(width * dpr);
    const backingHeight = Math.round(height * dpr);
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRef.current(ctx, width, height);
  }

  function schedule() {
    if (frameRef.current) return;
    frameRef.current = requestAnimationFrame(paint);
  }

  useEffect(() => {
    drawRef.current = draw;
    schedule();
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(schedule);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return canvasRef;
}
