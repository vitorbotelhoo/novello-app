import { useEffect, useRef } from "react";
import { useCanvasPan } from "./useCanvasPan";
import { useCanvasZoom } from "./useCanvasZoom";
import { useCanvasKeyboard } from "./useCanvasKeyboard";
import { useWorldTransform } from "./useWorldTransform";
import { CanvasGrid } from "./CanvasGrid";
import { PlaceholderBoxes } from "./PlaceholderBoxes";
import "./Canvas.css";

export function Canvas() {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pan = useCanvasPan();
  const zoom = useCanvasZoom();

  useCanvasKeyboard();
  useWorldTransform(worldRef);

  // Wheel needs a native, non-passive listener so we can preventDefault
  // (React's onWheel is passive by default and can't stop page scroll/zoom).
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey) zoom.onWheel(e);
      else pan.onWheel(e);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pan.onWheel, zoom.onWheel]);

  return (
    <div
      ref={rootRef}
      className="canvas-root"
      onPointerDown={pan.onPointerDown}
      onPointerMove={pan.onPointerMove}
      onPointerUp={pan.onPointerUp}
    >
      <CanvasGrid />
      <div ref={worldRef} className="canvas-world">
        <PlaceholderBoxes />
      </div>
    </div>
  );
}
