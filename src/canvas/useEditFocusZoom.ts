import { useEffect, useRef } from "react";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { useCanvasStore, type Viewport } from "./store";

const FOCUS_ZOOM = 1.6;
const ANIMATION_MS = 220;

let activeAnimationFrame: number | null = null;

function animateViewport(from: Viewport, to: Viewport, duration: number) {
  if (activeAnimationFrame != null) cancelAnimationFrame(activeAnimationFrame);
  const start = performance.now();

  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3; // ease-out cubic

    useCanvasStore.getState().setViewport({
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
      zoom: from.zoom + (to.zoom - from.zoom) * eased,
    });

    activeAnimationFrame = t < 1 ? requestAnimationFrame(tick) : null;
  }

  activeAnimationFrame = requestAnimationFrame(tick);
}

/** Zooms in on a node while it's being edited, then restores the prior view when editing ends. */
export function useEditFocusZoom() {
  const editingNodeId = useSelectionStore((s) => s.editingNodeId);
  const previousViewport = useRef<Viewport | null>(null);

  useEffect(() => {
    if (editingNodeId) {
      const node = useNodesStore.getState().nodes[editingNodeId];
      if (!node) return;

      previousViewport.current = useCanvasStore.getState().viewport;
      const target: Viewport = {
        x: window.innerWidth / 2 - node.x * FOCUS_ZOOM,
        y: window.innerHeight / 2 - node.y * FOCUS_ZOOM,
        zoom: FOCUS_ZOOM,
      };
      animateViewport(useCanvasStore.getState().viewport, target, ANIMATION_MS);
    } else if (previousViewport.current) {
      animateViewport(useCanvasStore.getState().viewport, previousViewport.current, ANIMATION_MS);
      previousViewport.current = null;
    }
  }, [editingNodeId]);
}
