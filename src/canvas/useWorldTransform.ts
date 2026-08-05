import { useLayoutEffect, type RefObject } from "react";
import { useCanvasStore, type Viewport } from "./store";

/**
 * Applies the viewport transform directly to the world element's style,
 * outside the React render path, so pan/zoom stays smooth regardless of
 * how much content the world subtree contains.
 */
export function useWorldTransform(worldRef: RefObject<HTMLDivElement | null>): Viewport {
  const viewport = useCanvasStore((s) => s.viewport);

  useLayoutEffect(() => {
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${viewport.x}px, ${viewport.y}px, 0) scale(${viewport.zoom})`;
  }, [viewport, worldRef]);

  return viewport;
}
