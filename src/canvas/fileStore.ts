import { create } from "zustand";

interface FileState {
  currentPath: string | null;
  isDirty: boolean;
  setCurrentPath: (path: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
}

export const useFileStore = create<FileState>((set) => ({
  currentPath: null,
  isDirty: false,
  setCurrentPath: (currentPath) => set({ currentPath }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),
}));
