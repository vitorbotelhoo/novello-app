import { useCanvasStore, MIN_ZOOM, MAX_ZOOM, type Viewport } from "./store";
import { useNodesStore, type CanvasNode } from "./nodesStore";

const FIT_PADDING = 80;

/** World-space bounding box of the given nodes, measured from their actual rendered size. Null if empty. */
function computeNodesBounds(nodes: CanvasNode[]) {
  if (nodes.length === 0) return null;

  const currentZoom = useCanvasStore.getState().viewport.zoom;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const el = document.querySelector(`[data-node-id="${node.id}"]`);
    const rect = el?.getBoundingClientRect();
    const halfW = rect ? rect.width / 2 / currentZoom : 100;
    const halfH = rect ? rect.height / 2 / currentZoom : 40;
    minX = Math.min(minX, node.x - halfW);
    maxX = Math.max(maxX, node.x + halfW);
    minY = Math.min(minY, node.y - halfH);
    maxY = Math.max(maxY, node.y + halfH);
  }

  return { minX, minY, maxX, maxY };
}

function viewportForBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): Viewport {
  const { minX, minY, maxX, maxY } = bounds;
  const contentWidth = Math.max(maxX - minX, 1);
  const contentHeight = Math.max(maxY - minY, 1);
  const availableWidth = window.innerWidth - FIT_PADDING * 2;
  const availableHeight = window.innerHeight - FIT_PADDING * 2;

  const rawZoom = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
  const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, rawZoom));

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return {
    x: window.innerWidth / 2 - centerX * zoom,
    y: window.innerHeight / 2 - centerY * zoom,
    zoom,
  };
}

/** Viewport that fits every node on screen with padding, or null if there are no nodes. */
export function computeFitViewport(): Viewport | null {
  const nodes = Object.values(useNodesStore.getState().nodes);
  const bounds = computeNodesBounds(nodes);
  return bounds ? viewportForBounds(bounds) : null;
}

/** Viewport that fits only the given node ids, or null if none of them exist. */
export function computeFitViewportForNodeIds(nodeIds: string[]): Viewport | null {
  const allNodes = useNodesStore.getState().nodes;
  const nodes = nodeIds.map((id) => allNodes[id]).filter((n): n is CanvasNode => !!n);
  const bounds = computeNodesBounds(nodes);
  return bounds ? viewportForBounds(bounds) : null;
}
