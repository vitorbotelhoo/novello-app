import { useCanvasStore, type Viewport } from "./store";

const ANIMATION_MS = 220;

let activeAnimationFrame: number | null = null;

/** Smoothly tweens the viewport toward `to`. Cancels any animation already in progress. */
export function animateViewport(to: Viewport, duration = ANIMATION_MS) {
  if (activeAnimationFrame != null) cancelAnimationFrame(activeAnimationFrame);
  const from = useCanvasStore.getState().viewport;
  const start = performance.now();

  function tick(now: number) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3; // ease-out cubic

    useCanvasStore.getState().setViewport({
      x: from.x + (to.x - from.x) * eased,
      y: from.y + (to.y - from.y) * eased,
      zoom: from.zoom + (to.zoom - from.zoom) * eased,
    });

    activeAnimationFrame = t < 1 ? requestAnimationFrame(tick) : null;
  }

  activeAnimationFrame = requestAnimationFrame(tick);
}
