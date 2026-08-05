import { create } from "zustand";

export type Tool = "select" | "hand";

interface ToolState {
  tool: Tool;
  /** Space bar temporarily forces hand tool regardless of `tool`, matching Figma. */
  isSpaceHeld: boolean;
  setTool: (tool: Tool) => void;
  setSpaceHeld: (held: boolean) => void;
}

export const useToolStore = create<ToolState>((set) => ({
  tool: "select",
  isSpaceHeld: false,
  setTool: (tool) => set({ tool }),
  setSpaceHeld: (isSpaceHeld) => set({ isSpaceHeld }),
}));

export function getEffectiveTool(): Tool {
  const { tool, isSpaceHeld } = useToolStore.getState();
  return isSpaceHeld ? "hand" : tool;
}
