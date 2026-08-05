import { create } from "zustand";

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4;

export const DEFAULT_VIEWPORT: Viewport = { x: 0, y: 0, zoom: 1 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface CanvasState {
  viewport: Viewport;
  setViewport: (viewport: Viewport) => void;
  pan: (dx: number, dy: number) => void;
  /** Zoom by `factor`, keeping the world point under (screenX, screenY) fixed on screen. */
  zoomAt: (screenX: number, screenY: number, factor: number) => void;
  reset: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  viewport: { ...DEFAULT_VIEWPORT },

  setViewport: (viewport) => set({ viewport }),

  pan: (dx, dy) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        x: state.viewport.x + dx,
        y: state.viewport.y + dy,
      },
    })),

  zoomAt: (screenX, screenY, factor) => {
    const { x, y, zoom } = get().viewport;
    const newZoom = clamp(zoom * factor, MIN_ZOOM, MAX_ZOOM);
    if (newZoom === zoom) return;

    const worldX = (screenX - x) / zoom;
    const worldY = (screenY - y) / zoom;

    set({
      viewport: {
        x: screenX - worldX * newZoom,
        y: screenY - worldY * newZoom,
        zoom: newZoom,
      },
    });
  },

  reset: () => set({ viewport: { ...DEFAULT_VIEWPORT } }),
}));
