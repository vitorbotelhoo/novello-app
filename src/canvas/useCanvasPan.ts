import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "./store";
import { getEffectiveTool } from "./toolStore";

const MIDDLE_MOUSE_BUTTON = 1;

/**
 * Pan gestures: trackpad two-finger scroll / mouse wheel (always), or plain
 * left-drag whenever the hand tool is effectively active (explicitly selected,
 * or the space bar is held), or middle-mouse-drag regardless of active tool.
 */
export function useCanvasPan() {
  const isPanning = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const pendingDelta = useRef({ dx: 0, dy: 0 });
  const rafId = useRef<number | null>(null);

  const flush = useCallback(() => {
    rafId.current = null;
    const { dx, dy } = pendingDelta.current;
    if (dx !== 0 || dy !== 0) {
      useCanvasStore.getState().pan(dx, dy);
      pendingDelta.current = { dx: 0, dy: 0 };
    }
  }, []);

  const schedule = useCallback(() => {
    if (rafId.current == null) {
      rafId.current = requestAnimationFrame(flush);
    }
  }, [flush]);

  useEffect(() => () => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
  }, []);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      pendingDelta.current.dx -= e.deltaX;
      pendingDelta.current.dy -= e.deltaY;
      schedule();
    },
    [schedule],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const shouldPan =
      e.button === MIDDLE_MOUSE_BUTTON || (e.button === 0 && getEffectiveTool() === "hand");
    if (!shouldPan) return;
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for pointer ids the browser no longer considers active; harmless.
    }
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - lastPoint.current.x;
      const dy = e.clientY - lastPoint.current.y;
      lastPoint.current = { x: e.clientX, y: e.clientY };
      pendingDelta.current.dx += dx;
      pendingDelta.current.dy += dy;
      schedule();
    },
    [schedule],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return;
    isPanning.current = false;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Already released/not captured; harmless.
    }
  }, []);

  return { onWheel, onPointerDown, onPointerMove, onPointerUp, isPanning };
}
