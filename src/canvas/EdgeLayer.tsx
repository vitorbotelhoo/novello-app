import { useNodesStore } from "./nodesStore";
import { useConnectionDragStore } from "./connectionDragStore";
import { useCanvasStore } from "./store";
import { buildThreadPath } from "./threadPath";
import { nodeHalfExtents, boxBoundaryPoint } from "./nodeBoundary";
import { EdgeItem } from "./EdgeItem";

export function EdgeLayer() {
  const nodes = useNodesStore((s) => s.nodes);
  const edges = useNodesStore((s) => s.edges);
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  const dragFromNodeId = useConnectionDragStore((s) => s.fromNodeId);
  const dragPointerWorld = useConnectionDragStore((s) => s.pointerWorld);
  const dragFromNode = dragFromNodeId ? nodes[dragFromNodeId] : null;

  return (
    <svg className="canvas-edges">
      {Object.values(edges).map((edge) => (
        <EdgeItem key={edge.id} edge={edge} zoom={zoom} />
      ))}
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
