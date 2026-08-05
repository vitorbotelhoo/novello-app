import { useCanvasStore } from "./store";
import "./ZoomIndicator.css";

export function ZoomIndicator() {
  const zoom = useCanvasStore((s) => s.viewport.zoom);
  return <div className="novello-zoom-indicator">{Math.round(zoom * 100)}%</div>;
}
