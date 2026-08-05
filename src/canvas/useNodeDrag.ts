import { useCallback, useRef } from "react";
import { useCanvasStore } from "./store";
import { useNodesStore } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useHistoryStore, type Snapshot } from "./historyStore";
import { getEffectiveTool } from "./toolStore";

const DRAG_THRESHOLD = 4;

/**
 * Drag-to-move for a node's body. If the node is part of the current
 * multi-selection, the whole selection moves together by the same delta.
 * `moved` tells the caller whether this interaction was a drag (vs. a plain
 * click), so click-to-select can skip re-selecting after a group drag.
 */
export function useNodeDrag(nodeId: string) {
  const isDragging = useRef(false);
  const moved = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });
  const preDragSnapshot = useRef<Snapshot | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (getEffectiveTool() !== "select") return; // let it bubble so the hand tool can pan instead
    isDragging.current = true;
    moved.current = false;
    // Capture pre-drag state now; commit to history only if the drag actually moves.
    preDragSnapshot.current = useHistoryStore.getState().captureSnapshot();
    lastPoint.current = { x: e.clientX, y: e.clientY };
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail for pointer ids the browser no longer considers active; harmless.
    }
    e.stopPropagation();
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;

      const dxScreen = e.clientX - lastPoint.current.x;
      const dyScreen = e.clientY - lastPoint.current.y;
      if (!moved.current) {
        if (Math.abs(dxScreen) < DRAG_THRESHOLD && Math.abs(dyScreen) < DRAG_THRESHOLD) return;
        moved.current = true;
      }

      lastPoint.current = { x: e.clientX, y: e.clientY };
      const zoom = useCanvasStore.getState().viewport.zoom;
      const dx = dxScreen / zoom;
      const dy = dyScreen / zoom;

      const selected = useSelectionStore.getState().selectedNodeIds;
      const ids = selected.has(nodeId) ? Array.from(selected) : [nodeId];
      useNodesStore.getState().moveNodes(ids, dx, dy);
    },
    [nodeId],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (moved.current && preDragSnapshot.current) {
      useHistoryStore.getState().pushSnapshot(preDragSnapshot.current);
    }
    preDragSnapshot.current = null;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // Already released/not captured; harmless.
    }
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, moved };
}
