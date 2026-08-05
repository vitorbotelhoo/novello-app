import { useCallback, useEffect, useRef } from "react";
import { useCanvasStore } from "./store";

const MIDDLE_MOUSE_BUTTON = 1;

/**
 * Pan gestures: trackpad two-finger scroll / mouse wheel (primary), or
 * space+left-drag / middle-mouse-drag (secondary, for mouse users).
 * Plain left-drag is intentionally left free for future node selection.
 */
export function useCanvasPan() {
  const isSpaceHeld = useRef(false);
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpaceHeld.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") isSpaceHeld.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

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
      e.button === MIDDLE_MOUSE_BUTTON || (e.button === 0 && isSpaceHeld.current);
    if (!shouldPan) return;
    isPanning.current = true;
    lastPoint.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
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
    (e.currentTarget as Element).releasePointerCapture(e.pointerId);
  }, []);

  return { onWheel, onPointerDown, onPointerMove, onPointerUp, isPanning };
}
