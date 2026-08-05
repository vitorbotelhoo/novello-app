import { useLayoutEffect, useRef } from "react";
import { useCanvasStore } from "./store";

const CELL_SIZE = 32;

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
