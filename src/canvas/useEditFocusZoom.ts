import { useEffect, useRef } from "react";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { useCanvasStore, type Viewport } from "./store";
import { animateViewport } from "./viewportAnimation";

const FOCUS_ZOOM = 1;

/** Zooms in on a node while it's being edited, then restores the prior view when editing ends. */
export function useEditFocusZoom() {
  const editingNodeId = useSelectionStore((s) => s.editingNodeId);
  const previousViewport = useRef<Viewport | null>(null);

  useEffect(() => {
    if (editingNodeId) {
      const node = useNodesStore.getState().nodes[editingNodeId];
      if (!node) return;

      previousViewport.current = useCanvasStore.getState().viewport;
      animateViewport({
        x: window.innerWidth / 2 - node.x * FOCUS_ZOOM,
        y: window.innerHeight / 2 - node.y * FOCUS_ZOOM,
        zoom: FOCUS_ZOOM,
      });
    } else if (previousViewport.current) {
      animateViewport(previousViewport.current);
      previousViewport.current = null;
    }
  }, [editingNodeId]);
}
