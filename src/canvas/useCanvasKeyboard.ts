import { useEffect } from "react";
import { useCanvasStore } from "./store";

const ARROW_STEP = 60;
const ARROW_STEP_FAST = 240;
const ZOOM_STEP_FACTOR = 1.2;

export function useCanvasKeyboard() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useCanvasStore.getState();

      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        store.reset();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        // Zoom-to-fit stub: no node bounds exist yet, falls back to reset.
        store.reset();
        return;
      }

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        store.zoomAt(window.innerWidth / 2, window.innerHeight / 2, ZOOM_STEP_FACTOR);
        return;
      }

      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        store.zoomAt(window.innerWidth / 2, window.innerHeight / 2, 1 / ZOOM_STEP_FACTOR);
        return;
      }

      const step = e.shiftKey ? ARROW_STEP_FAST : ARROW_STEP;
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          store.pan(0, step);
          break;
        case "ArrowDown":
          e.preventDefault();
          store.pan(0, -step);
          break;
        case "ArrowLeft":
          e.preventDefault();
          store.pan(step, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          store.pan(-step, 0);
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
