import { useCallback } from "react";
import { useCanvasStore } from "./store";

const WHEEL_ZOOM_SENSITIVITY = 0.01;

/** Zoom gesture: trackpad pinch or ctrl/cmd+scroll, anchored on the cursor. */
export function useCanvasZoom() {
  const onWheel = useCallback((e: WheelEvent) => {
    const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_SENSITIVITY);
    useCanvasStore.getState().zoomAt(e.clientX, e.clientY, factor);
  }, []);

  return { onWheel };
}
