import { create } from "zustand";

interface SelectionState {
  selectedNodeIds: Set<string>;
  selectedEdgeIds: Set<string>;
  editingNodeId: string | null;
  selectNode: (id: string, additive: boolean) => void;
  selectEdge: (id: string, additive: boolean) => void;
  setSelection: (nodeIds: string[], edgeIds: string[]) => void;
  clearSelection: () => void;
  startEditing: (id: string) => void;
  stopEditing: () => void;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selectedNodeIds: new Set(),
  selectedEdgeIds: new Set(),
  editingNodeId: null,

  selectNode: (id, additive) =>
    set((state) => {
      if (!additive) return { selectedNodeIds: new Set([id]), selectedEdgeIds: new Set() };
      const next = new Set(state.selectedNodeIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedNodeIds: next };
    }),

  selectEdge: (id, additive) =>
    set((state) => {
      if (!additive) return { selectedNodeIds: new Set(), selectedEdgeIds: new Set([id]) };
      const next = new Set(state.selectedEdgeIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedEdgeIds: next };
    }),

  setSelection: (nodeIds, edgeIds) =>
    set({ selectedNodeIds: new Set(nodeIds), selectedEdgeIds: new Set(edgeIds) }),

  clearSelection: () =>
    set({ selectedNodeIds: new Set(), selectedEdgeIds: new Set(), editingNodeId: null }),

  startEditing: (id) => set({ editingNodeId: id }),
  stopEditing: () => set({ editingNodeId: null }),
}));
