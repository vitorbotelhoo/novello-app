import { useEffect } from "react";
import { useCanvasStore, DEFAULT_VIEWPORT } from "./store";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { useHistoryStore } from "./historyStore";
import { useConnectionDragStore } from "./connectionDragStore";
import { useUiStore } from "./uiStore";
import { computeFitViewport, computeFitViewportForNodeIds } from "./zoomToFit";
import { animateViewport } from "./viewportAnimation";
import { saveFile, saveAs, openFile, newMap } from "./fileCommands";

const ARROW_PAN_STEP = 60;
const ARROW_PAN_STEP_FAST = 240;
const ARROW_NUDGE_STEP = 8;
const ARROW_NUDGE_STEP_FAST = 40;
const ZOOM_STEP_FACTOR = 1.2;

const ARROW_DELTAS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

export function useCanvasKeyboard() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useCanvasStore.getState();
      const selection = useSelectionStore.getState();
      const mod = e.metaKey || e.ctrlKey;

      // While a node is being edited the textarea owns the keyboard (it stops
      // propagation); this guard is a safety net if focus ever drifts.
      if (selection.editingNodeId) return;

      if (e.key === "?") {
        e.preventDefault();
        useUiStore.getState().toggleShortcuts();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        const ui = useUiStore.getState();
        const conn = useConnectionDragStore.getState();
        if (ui.shortcutsOpen) {
          ui.closeShortcuts();
        } else if (conn.fromNodeId) {
          conn.end();
        } else {
          selection.clearSelection();
        }
        return;
      }

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) useHistoryStore.getState().redo();
        else useHistoryStore.getState().undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useHistoryStore.getState().redo();
        return;
      }

      if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        selection.setSelection(Object.keys(useNodesStore.getState().nodes), []);
        return;
      }

      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selection.selectedNodeIds.size > 0) {
          const copies = useNodesStore.getState().duplicateNodes(Array.from(selection.selectedNodeIds));
          if (copies.length > 0) selection.setSelection(copies, []);
        }
        return;
      }

      if (e.key === "Tab") {
        if (selection.selectedNodeIds.size === 1) {
          e.preventDefault();
          const parentId = Array.from(selection.selectedNodeIds)[0];
          const childId = useNodesStore.getState().addChildNode(parentId);
          if (childId) {
            selection.setSelection([childId], []);
            selection.startEditing(childId);
          }
        }
        return;
      }

      if (e.key === "Enter") {
        if (selection.selectedNodeIds.size === 1) {
          e.preventDefault();
          selection.startEditing(Array.from(selection.selectedNodeIds)[0]);
        }
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        if (selection.selectedNodeIds.size === 0 && selection.selectedEdgeIds.size === 0) return;
        e.preventDefault();
        const nodes = useNodesStore.getState();
        if (selection.selectedNodeIds.size > 0) nodes.deleteNodes(Array.from(selection.selectedNodeIds));
        if (selection.selectedEdgeIds.size > 0) nodes.deleteEdges(Array.from(selection.selectedEdgeIds));
        selection.clearSelection();
        return;
      }

      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (e.shiftKey) void saveAs();
        else void saveFile();
        return;
      }
      if (mod && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void openFile();
        return;
      }
      if (mod && e.key.toLowerCase() === "n") {
        e.preventDefault();
        newMap();
        return;
      }

      if (mod && e.key === "0") {
        e.preventDefault();
        animateViewport(DEFAULT_VIEWPORT);
        return;
      }
      if (mod && e.key === "1") {
        e.preventDefault();
        animateViewport(computeFitViewport() ?? DEFAULT_VIEWPORT);
        return;
      }
      if (mod && e.key === "2") {
        e.preventDefault();
        const fit = computeFitViewportForNodeIds(Array.from(selection.selectedNodeIds));
        if (fit) animateViewport(fit);
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

      const arrow = ARROW_DELTAS[e.key];
      if (arrow) {
        e.preventDefault();
        const [ux, uy] = arrow;
        if (selection.selectedNodeIds.size > 0) {
          // Move the selected nodes. One history step per burst: only the
          // initial (non-repeat) keydown records the pre-move snapshot.
          if (!e.repeat) useHistoryStore.getState().recordBefore();
          const step = e.shiftKey ? ARROW_NUDGE_STEP_FAST : ARROW_NUDGE_STEP;
          useNodesStore.getState().moveNodes(Array.from(selection.selectedNodeIds), ux * step, uy * step);
        } else {
          const step = e.shiftKey ? ARROW_PAN_STEP_FAST : ARROW_PAN_STEP;
          store.pan(-ux * step, -uy * step);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
