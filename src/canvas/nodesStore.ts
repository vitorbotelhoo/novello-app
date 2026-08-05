import { create } from "zustand";

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

const NODE_PASTELS = ["#f2c9d8", "#c9e0f2", "#d8f2c9", "#f2e0c9", "#e0c9f2", "#c9f2ec"];

let colorCursor = 0;
function nextColor(): string {
  const color = NODE_PASTELS[colorCursor % NODE_PASTELS.length];
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
}

export const useNodesStore = create<NodesState>((set, get) => ({
  nodes: {},
  edges: {},

  addNode: (x, y, text = "") => {
    const id = generateId();
    const node: CanvasNode = { id, x, y, text, color: nextColor() };
    set((state) => ({ nodes: { ...state.nodes, [id]: node } }));
    return id;
  },

  updateText: (id, text) =>
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, text } } };
    }),

  moveNode: (id, x, y) =>
    set((state) => {
      const node = state.nodes[id];
      if (!node) return state;
      return { nodes: { ...state.nodes, [id]: { ...node, x, y } } };
    }),

  moveNodes: (ids, dx, dy) =>
    set((state) => {
      const nodes = { ...state.nodes };
      for (const id of ids) {
        const node = nodes[id];
        if (node) nodes[id] = { ...node, x: node.x + dx, y: node.y + dy };
      }
      return { nodes };
    }),

  deleteNodes: (ids) =>
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
    }),

  addEdge: (fromNodeId, toNodeId) => {
    if (fromNodeId === toNodeId) return null;
    const alreadyExists = Object.values(get().edges).some(
      (edge) =>
        (edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId) ||
        (edge.fromNodeId === toNodeId && edge.toNodeId === fromNodeId),
    );
    if (alreadyExists) return null;

    const id = generateId();
    const edge: CanvasEdge = { id, fromNodeId, toNodeId };
    set((state) => ({ edges: { ...state.edges, [id]: edge } }));
    return id;
  },

  deleteEdges: (ids) =>
    set((state) => {
      const edges = { ...state.edges };
      for (const id of ids) delete edges[id];
      return { edges };
    }),

  edgesForNode: (nodeId) =>
    Object.values(get().edges)
      .filter((edge) => edge.fromNodeId === nodeId || edge.toNodeId === nodeId)
      .map((edge) => edge.id),
}));
