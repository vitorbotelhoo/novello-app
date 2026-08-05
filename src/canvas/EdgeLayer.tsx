import { useNodesStore } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useConnectionDragStore } from "./connectionDragStore";
import { buildThreadPath } from "./threadPath";

export function EdgeLayer() {
  const nodes = useNodesStore((s) => s.nodes);
  const edges = useNodesStore((s) => s.edges);
  const selectedEdgeIds = useSelectionStore((s) => s.selectedEdgeIds);
  const dragFromNodeId = useConnectionDragStore((s) => s.fromNodeId);
  const dragPointerWorld = useConnectionDragStore((s) => s.pointerWorld);
  const dragFromNode = dragFromNodeId ? nodes[dragFromNodeId] : null;

  return (
    <svg className="canvas-edges">
      {Object.values(edges).map((edge) => {
        const from = nodes[edge.fromNodeId];
        const to = nodes[edge.toNodeId];
        if (!from || !to) return null;
        const isSelected = selectedEdgeIds.has(edge.id);
        return (
          <path
            key={edge.id}
            className={`canvas-edge${isSelected ? " canvas-edge--selected" : ""}`}
            d={buildThreadPath(from.x, from.y, to.x, to.y, edge.id)}
            data-edge-id={edge.id}
            onClick={(e) => {
              e.stopPropagation();
              useSelectionStore.getState().selectEdge(edge.id, e.shiftKey);
            }}
          />
        );
      })}
      {dragFromNode && dragPointerWorld && (
        <path
          className="canvas-edge canvas-edge--preview"
          d={buildThreadPath(dragFromNode.x, dragFromNode.y, dragPointerWorld.x, dragPointerWorld.y, "preview")}
        />
      )}
    </svg>
  );
}
