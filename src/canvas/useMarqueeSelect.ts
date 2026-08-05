import { useCallback, useRef, useState } from "react";
import { useNodesStore } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";

export interface MarqueeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Plain left-drag starting on empty canvas draws a selection rectangle over nodes. */
export function useMarqueeSelect() {
  const isDragging = useRef(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [rect, setRect] = useState<MarqueeRect | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || e.target !== e.currentTarget) return;
    isDragging.current = true;
    moved.current = false;
    start.current = { x: e.clientX, y: e.clientY };
    setRect({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for pointer ids the browser no longer considers active; harmless.
    }
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const x = Math.min(start.current.x, e.clientX);
    const y = Math.min(start.current.y, e.clientY);
    const width = Math.abs(e.clientX - start.current.x);
    const height = Math.abs(e.clientY - start.current.y);
    setRect({ x, y, width, height });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      try {
        (e.currentTarget as Element).releasePointerCapture(e.pointerId);
      } catch {
        // Already released/not captured; harmless.
      }

      const finalRect = rect;
      setRect(null);
      if (!finalRect || (finalRect.width < 4 && finalRect.height < 4)) return;
      moved.current = true;

      const ids: string[] = [];
      for (const node of Object.values(useNodesStore.getState().nodes)) {
        const el = document.querySelector(`[data-node-id="${node.id}"]`);
        if (!el) continue;
        const box = el.getBoundingClientRect();
        const intersects =
          box.left < finalRect.x + finalRect.width &&
          box.right > finalRect.x &&
          box.top < finalRect.y + finalRect.height &&
          box.bottom > finalRect.y;
        if (intersects) ids.push(node.id);
      }
      useSelectionStore.getState().setSelection(ids, []);
    },
    [rect],
  );

  return { onPointerDown, onPointerMove, onPointerUp, rect, moved };
}
