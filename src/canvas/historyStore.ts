import { create } from "zustand";
import { useNodesStore, type CanvasNode, type CanvasEdge } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useFileStore } from "./fileStore";

export interface Snapshot {
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;
}

const MAX_HISTORY = 100;

function currentSnapshot(): Snapshot {
  const { nodes, edges } = useNodesStore.getState();
  return { nodes: structuredClone(nodes), edges: structuredClone(edges) };
}

/** Loads a snapshot back into the graph and reconciles selection/editing/dirty state. */
function restore(snap: Snapshot) {
  useNodesStore.getState().loadFile(Object.values(snap.nodes), Object.values(snap.edges));

  const sel = useSelectionStore.getState();
  const keepNodes = Array.from(sel.selectedNodeIds).filter((id) => snap.nodes[id]);
  const keepEdges = Array.from(sel.selectedEdgeIds).filter((id) => snap.edges[id]);
  sel.setSelection(keepNodes, keepEdges);
  sel.stopEditing();

  useFileStore.getState().markDirty();
}

interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  /** Push an already-captured pre-change snapshot (used by drag, which snapshots on pointerdown). */
  pushSnapshot: (snap: Snapshot) => void;
  /** Snapshot the current graph state before a discrete mutation. */
  recordBefore: () => void;
  captureSnapshot: () => Snapshot;
  undo: () => void;
  redo: () => void;
  /** Wipe history (on New / Open — you can't undo across documents). */
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot: (snap) =>
    set((state) => {
      const past = [...state.past, snap];
      if (past.length > MAX_HISTORY) past.shift();
      return { past, future: [] };
    }),

  recordBefore: () => get().pushSnapshot(currentSnapshot()),

  captureSnapshot: () => currentSnapshot(),

  undo: () => {
    const { past } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const current = currentSnapshot();
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [...state.future, current],
    }));
    restore(previous);
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return;
    const next = future[future.length - 1];
    const current = currentSnapshot();
    set((state) => ({
      past: [...state.past, current],
      future: state.future.slice(0, -1),
    }));
    restore(next);
  },

  clear: () => set({ past: [], future: [] }),
}));
