import { useState } from "react";
import { useNodesStore, type CanvasEdge } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { buildThreadPath, threadColor } from "./threadPath";
import { nodeHalfExtents, boxBoundaryPoint } from "./nodeBoundary";

interface EdgeItemProps {
  edge: CanvasEdge;
  zoom: number;
}

export function EdgeItem({ edge, zoom }: EdgeItemProps) {
  const from = useNodesStore((s) => s.nodes[edge.fromNodeId]);
  const to = useNodesStore((s) => s.nodes[edge.toNodeId]);
  const isSelected = useSelectionStore((s) => s.selectedEdgeIds.has(edge.id));
  const [hovered, setHovered] = useState(false);

  if (!from || !to) return null;

  const fromExtents = nodeHalfExtents(from.id, zoom);
  const toExtents = nodeHalfExtents(to.id, zoom);
  const start = boxBoundaryPoint(from.x, from.y, fromExtents.halfW, fromExtents.halfH, to.x, to.y);
  const end = boxBoundaryPoint(to.x, to.y, toExtents.halfW, toExtents.halfH, from.x, from.y);
  const path = buildThreadPath(start.x, start.y, end.x, end.y, edge.id);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Constant screen size regardless of zoom (the SVG lives in the scaled world).
  const r = 11 / zoom;
  const x = 3.5 / zoom;

  return (
    <g onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Wide invisible hit area so the thin thread is easy to hover/click. */}
      <path className="canvas-edge-hit" d={path} style={{ strokeWidth: 20 / zoom }} />
      <path
        className={`canvas-edge${isSelected ? " canvas-edge--selected" : ""}`}
        d={path}
        style={{ stroke: isSelected ? undefined : threadColor(edge.id) }}
        data-edge-id={edge.id}
        onClick={(e) => {
          e.stopPropagation();
          useSelectionStore.getState().selectEdge(edge.id, e.shiftKey);
        }}
      />
      {hovered ? (
        <g
          className="canvas-edge-cut"
          transform={`translate(${midX} ${midY})`}
          onClick={(e) => {
            e.stopPropagation();
            useNodesStore.getState().deleteEdges([edge.id]);
          }}
        >
          <circle r={r} style={{ strokeWidth: 1.5 / zoom }} />
          <line x1={-x} y1={-x} x2={x} y2={x} style={{ strokeWidth: 1.75 / zoom }} />
          <line x1={-x} y1={x} x2={x} y2={-x} style={{ strokeWidth: 1.75 / zoom }} />
        </g>
      ) : null}
    </g>
  );
}
