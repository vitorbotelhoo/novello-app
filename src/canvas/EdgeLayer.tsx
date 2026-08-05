import { useNodesStore } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useConnectionDragStore } from "./connectionDragStore";
import { useCanvasStore } from "./store";
import { buildThreadPath, threadColor } from "./threadPath";
import { nodeHalfExtents, boxBoundaryPoint } from "./nodeBoundary";

export function EdgeLayer() {
  const nodes = useNodesStore((s) => s.nodes);
  const edges = useNodesStore((s) => s.edges);
  const selectedEdgeIds = useSelectionStore((s) => s.selectedEdgeIds);
  const dragFromNodeId = useConnectionDragStore((s) => s.fromNodeId);
  const dragPointerWorld = useConnectionDragStore((s) => s.pointerWorld);
  const dragFromNode = dragFromNodeId ? nodes[dragFromNodeId] : null;
  const zoom = useCanvasStore((s) => s.viewport.zoom);

  return (
    <svg className="canvas-edges">
      {Object.values(edges).map((edge) => {
        const from = nodes[edge.fromNodeId];
        const to = nodes[edge.toNodeId];
        if (!from || !to) return null;
        const isSelected = selectedEdgeIds.has(edge.id);

        const fromExtents = nodeHalfExtents(from.id, zoom);
        const toExtents = nodeHalfExtents(to.id, zoom);
        const start = boxBoundaryPoint(from.x, from.y, fromExtents.halfW, fromExtents.halfH, to.x, to.y);
        const end = boxBoundaryPoint(to.x, to.y, toExtents.halfW, toExtents.halfH, from.x, from.y);

        return (
          <path
            key={edge.id}
            className={`canvas-edge${isSelected ? " canvas-edge--selected" : ""}`}
            d={buildThreadPath(start.x, start.y, end.x, end.y, edge.id)}
            style={{ stroke: isSelected ? undefined : threadColor(edge.id) }}
            data-edge-id={edge.id}
            onClick={(e) => {
              e.stopPropagation();
              useSelectionStore.getState().selectEdge(edge.id, e.shiftKey);
            }}
          />
        );
      })}
      {dragFromNode &&
        dragPointerWorld &&
        (() => {
          const fromExtents = nodeHalfExtents(dragFromNode.id, zoom);
          const start = boxBoundaryPoint(
            dragFromNode.x,
            dragFromNode.y,
            fromExtents.halfW,
            fromExtents.halfH,
            dragPointerWorld.x,
            dragPointerWorld.y,
          );
          return (
            <path
              className="canvas-edge canvas-edge--preview"
              d={buildThreadPath(start.x, start.y, dragPointerWorld.x, dragPointerWorld.y, "preview")}
            />
          );
        })()}
    </svg>
  );
}
