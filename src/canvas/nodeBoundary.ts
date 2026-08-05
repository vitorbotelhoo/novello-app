import type { Point } from "./coords";

const FALLBACK_HALF_WIDTH = 70;
const FALLBACK_HALF_HEIGHT = 24;

/** A node's rendered half-width/half-height in world units, measured from the DOM since size depends on its text. */
export function nodeHalfExtents(nodeId: string, zoom: number): { halfW: number; halfH: number } {
  const el = document.querySelector(`[data-node-id="${nodeId}"]`);
  const rect = el?.getBoundingClientRect();
  if (!rect || rect.width === 0) {
    return { halfW: FALLBACK_HALF_WIDTH, halfH: FALLBACK_HALF_HEIGHT };
  }
  return { halfW: rect.width / 2 / zoom, halfH: rect.height / 2 / zoom };
}

/**
 * Point where the straight line from (cx, cy) toward (towardX, towardY) exits an axis-aligned
 * box of the given half-extents centered at (cx, cy). Used so thread paths meet a node's edge
 * instead of its center, otherwise the opaque node box hides most of the curve.
 */
export function boxBoundaryPoint(
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  towardX: number,
  towardY: number,
): Point {
  const dx = towardX - cx;
  const dy = towardY - cy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;

  const tX = ux !== 0 ? halfW / Math.abs(ux) : Infinity;
  const tY = uy !== 0 ? halfH / Math.abs(uy) : Infinity;
  const t = Math.min(tX, tY, len);

  return { x: cx + ux * t, y: cy + uy * t };
}
