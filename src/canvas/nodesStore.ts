import { create } from "zustand";
import { useFileStore } from "./fileStore";
import { useHistoryStore } from "./historyStore";

// Snapshot the pre-change graph so the mutation about to run can be undone.
// Circular import with historyStore is safe: both only touch each other via
// getState() at call time, never at module-eval time.
function recordHistory() {
  useHistoryStore.getState().recordBefore();
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
}

export interface CanvasEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
}

/* Pitch between two connected cards in the Figma reference: 400 wide plus a
   380 gap, which is what leaves room for the thread to read. */
const CHILD_OFFSET_X = 780;

/*
 * Node palette, from Figma node 16:34 "White Mode".
 *
 * The hex lives here rather than in CSS because it is persisted: every node
 * writes its own color into the .novello file. That means retuning the palette
 * does not retroactively change maps already saved. Moving to a color id, so
 * the file stores identity instead of value, is the optional step 2 in
 * DESIGN_SYSTEM_PLAN.md.
 */
const NODE_COLORS = ["#ffa3a3", "#fbbe31", "#7eed94", "#84c4ff", "#ceaaf1", "#f89bfb"];

let colorCursor = 0;
function nextColor(): string {
  const color = NODE_COLORS[colorCursor % NODE_COLORS.length];
  colorCursor += 1;
  return color;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

interface NodesState {
  nodes: Record<string, CanvasNode>;
  edges: Record<string, CanvasEdge>;

  addNode: (x: number, y: number, text?: string) => string;
  updateText: (id: string, text: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  moveNodes: (ids: string[], dx: number, dy: number) => void;
  deleteNodes: (ids: string[]) => void;

  /** Returns the new edge id, or null if the edge was rejected (self-loop or duplicate). */
  addEdge: (fromNodeId: string, toNodeId: string) => string | null;
  deleteEdges: (ids: string[]) => void;
  edgesForNode: (nodeId: string) => string[];

  /** Clone the given nodes at a small offset (one atomic step). Returns the new ids. */
  duplicateNodes: (ids: string[]) => string[];
  /** Create a node connected to `parentId` by a new edge (one atomic step). Returns the child id. */
  addChildNode: (parentId: string) => string | null;

  /** Bulk replace (Open) and reset (New Map). Unlike the actions above, these don't mark the file dirty. */
  loadFile: (nodes: CanvasNode[], edges: CanvasEdge[]) => void;
  clear: () => void;
}

export const useNodesStore = create<NodesState>((set, get) => ({
  nodes: {},
  edges: {},

  addNode: (x, y, text = "") => {
    recordHistory();
    const id = generateId();
    const node: CanvasNode = { id, x, y, text, color: nextColor() };
    set((state) => ({ nodes: { ...state.nodes, [id]: node } }));
    useFileStore.getState().markDirty();
    return id;
  },

  updateText: (id, text) => {
    recordHistory();
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, text } } };
    });
    useFileStore.getState().markDirty();
  },

  moveNode: (id, x, y) => {
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, x, y } } };
    });
    useFileStore.getState().markDirty();
  },

  moveNodes: (ids, dx, dy) => {
    set((state) => {
      const nodes = { ...state.nodes };
      for (const id of ids) {
        const node = nodes[id];
        if (node) nodes[id] = { ...node, x: node.x + dx, y: node.y + dy };
      }
      return { nodes };
    });
    useFileStore.getState().markDirty();
  },

  deleteNodes: (ids) => {
    recordHistory();
    set((state) => {
      const idSet = new Set(ids);
      const nodes = { ...state.nodes };
      for (const id of ids) delete nodes[id];

      const edges = { ...state.edges };
      for (const [edgeId, edge] of Object.entries(edges)) {
        if (idSet.has(edge.fromNodeId) || idSet.has(edge.toNodeId)) {
          delete edges[edgeId];
        }
      }
      return { nodes, edges };
    });
    useFileStore.getState().markDirty();
  },

  addEdge: (fromNodeId, toNodeId) => {
    if (fromNodeId === toNodeId) return null;
    const alreadyExists = Object.values(get().edges).some(
      (edge) =>
        (edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId) ||
        (edge.fromNodeId === toNodeId && edge.toNodeId === fromNodeId),
    );
    if (alreadyExists) return null;

    recordHistory();
    const id = generateId();
    const edge: CanvasEdge = { id, fromNodeId, toNodeId };
    set((state) => ({ edges: { ...state.edges, [id]: edge } }));
    useFileStore.getState().markDirty();
    return id;
  },

  deleteEdges: (ids) => {
    recordHistory();
    set((state) => {
      const edges = { ...state.edges };
      for (const id of ids) delete edges[id];
      return { edges };
    });
    useFileStore.getState().markDirty();
  },

  edgesForNode: (nodeId) =>
    Object.values(get().edges)
      .filter((edge) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
      .map((edge) => edge.id),

  duplicateNodes: (ids) => {
    recordHistory();
    const newIds: string[] = [];
    set((state) => {
      const nodes = { ...state.nodes };
      for (const id of ids) {
        const src = state.nodes[id];
        if (!src) continue;
        const newId = generateId();
        nodes[newId] = { ...src, id: newId, x: src.x + 60, y: src.y + 60 };
        newIds.push(newId);
      }
      return { nodes };
    });
    useFileStore.getState().markDirty();
    return newIds;
  },

  addChildNode: (parentId) => {
    const parent = get().nodes[parentId];
    if (!parent) return null;
    recordHistory();
    const childId = generateId();
    const edgeId = generateId();
    set((state) => ({
      nodes: {
        ...state.nodes,
        [childId]: { id: childId, x: parent.x + CHILD_OFFSET_X, y: parent.y, text: "", color: nextColor() },
      },
      edges: {
        ...state.edges,
        [edgeId]: { id: edgeId, fromNodeId: parentId, toNodeId: childId },
      },
    }));
    useFileStore.getState().markDirty();
    return childId;
  },

  loadFile: (nodes, edges) =>
    set({
      nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
      edges: Object.fromEntries(edges.map((e) => [e.id, e])),
    }),

  clear: () => set({ nodes: {}, edges: {} }),
}));
