import { useEffect } from "react";
import { useCanvasStore } from "./store";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { computeFitViewport } from "./zoomToFit";
import { saveFile, saveAs, openFile, newMap } from "./fileCommands";

const ARROW_STEP = 60;
const ARROW_STEP_FAST = 240;
const ZOOM_STEP_FACTOR = 1.2;

export function useCanvasKeyboard() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useCanvasStore.getState();

      if (e.key === "Enter") {
        const selection = useSelectionStore.getState();
        if (selection.selectedNodeIds.size === 1 && !selection.editingNodeId) {
          e.preventDefault();
          selection.startEditing(Array.from(selection.selectedNodeIds)[0]);
        }
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        const selection = useSelectionStore.getState();
        if (selection.selectedNodeIds.size === 0 && selection.selectedEdgeIds.size === 0) return;
        e.preventDefault();
        const nodes = useNodesStore.getState();
        if (selection.selectedNodeIds.size > 0) {
          nodes.deleteNodes(Array.from(selection.selectedNodeIds));
        }
        if (selection.selectedEdgeIds.size > 0) {
          nodes.deleteEdges(Array.from(selection.selectedEdgeIds));
        }
        selection.clearSelection();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (e.shiftKey) void saveAs();
        else void saveFile();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void openFile();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newMap();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault();
        store.reset();
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "1") {
        e.preventDefault();
        const fitViewport = computeFitViewport();
        if (fitViewport) store.setViewport(fitViewport);
        else store.reset();
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
