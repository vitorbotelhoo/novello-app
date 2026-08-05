import { useCallback } from "react";
import { useCanvasStore } from "./store";
import { useNodesStore } from "./nodesStore";
import { screenToWorld } from "./coords";

/** Double-click on empty canvas creates a node there. Double-click on a node is reserved for text editing. */
export function useCreateNode() {
  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    const viewport = useCanvasStore.getState().viewport;
    const world = screenToWorld({ x: e.clientX, y: e.clientY }, viewport);
    useNodesStore.getState().addNode(world.x, world.y);
  }, []);

  return { onDoubleClick };
}
