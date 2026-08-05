import { useCallback } from "react";
import { useCanvasStore } from "./store";
import { useNodesStore } from "./nodesStore";
import { useConnectionDragStore } from "./connectionDragStore";
import { screenToWorld } from "./coords";

function findNodeIdAtScreenPoint(x: number, y: number, excludeId: string): string | null {
  const el = document.elementFromPoint(x, y);
  const nodeEl = el?.closest("[data-node-id]");
  const id = nodeEl?.getAttribute("data-node-id") ?? null;
  return id && id !== excludeId ? id : null;
}

/** Drag from a node's connector handle onto another node to create a thread between them. */
export function useConnectionHandle(nodeId: string) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const viewport = useCanvasStore.getState().viewport;
      const world = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
      useConnectionDragStore.getState().start(nodeId, world);
      try {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
      } catch {
        // Capture can fail for pointer ids the browser no longer considers active; harmless.
      }
    },
    [nodeId],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (useConnectionDragStore.getState().fromNodeId == null) return;
    const viewport = useCanvasStore.getState().viewport;
    const world = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
    useConnectionDragStore.getState().update(world);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Already released/not captured; harmless.
    }
    const { fromNodeId } = useConnectionDragStore.getState();
    useConnectionDragStore.getState().end();
    if (!fromNodeId) return;

    const targetId = findNodeIdAtScreenPoint(e.clientX, e.clientY, fromNodeId);
    if (targetId) useNodesStore.getState().addEdge(fromNodeId, targetId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}
