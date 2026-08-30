import { useLayoutEffect, useRef } from "react";
import { useCanvasStore } from "./store";

/* Scaled with the card so dot density per card stays what it was (32 for a
   180-wide card). The design's own dot pitch could not be read reliably. */
const CELL_SIZE = 72;

export function CanvasGrid() {
  const ref = useRef<HTMLDivElement>(null);
  const viewport = useCanvasStore((s) => s.viewport);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = CELL_SIZE * viewport.zoom;
    el.style.backgroundSize = `${size}px ${size}px`;
    el.style.backgroundPosition = `${viewport.x}px ${viewport.y}px`;
  }, [viewport]);

  return <div ref={ref} className="canvas-grid" />;
}
