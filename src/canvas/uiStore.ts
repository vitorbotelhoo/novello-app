import { create } from "zustand";

interface UiState {
  shortcutsOpen: boolean;
  toggleShortcuts: () => void;
  closeShortcuts: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  shortcutsOpen: false,
  toggleShortcuts: () => set((s) => ({ shortcutsOpen: !s.shortcutsOpen })),
  closeShortcuts: () => set({ shortcutsOpen: false }),
}));
