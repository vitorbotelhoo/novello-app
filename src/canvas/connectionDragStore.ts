import { create } from "zustand";
import type { Point } from "./coords";

interface ConnectionDragState {
  fromNodeId: string | null;
  pointerWorld: Point | null;
  start: (fromNodeId: string, world: Point) => void;
  update: (world: Point) => void;
  end: () => void;
}

/** Ephemeral state for an in-progress "drag a handle to another node" connection gesture. */
export const useConnectionDragStore = create<ConnectionDragState>((set) => ({
  fromNodeId: null,
  pointerWorld: null,
  start: (fromNodeId, world) => set({ fromNodeId, pointerWorld: world }),
  update: (world) => set({ pointerWorld: world }),
  end: () => set({ fromNodeId: null, pointerWorld: null }),
}));
