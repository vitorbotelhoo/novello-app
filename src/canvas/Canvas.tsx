import { useEffect, useRef } from "react";
import { useCanvasPan } from "./useCanvasPan";
import { useCanvasZoom } from "./useCanvasZoom";
import { useCanvasKeyboard } from "./useCanvasKeyboard";
import { useWorldTransform } from "./useWorldTransform";
import { useCreateNode } from "./useCreateNode";
import { useMarqueeSelect } from "./useMarqueeSelect";
import { useWindowTitle } from "./useWindowTitle";
import { useNativeMenu } from "./useNativeMenu";
import { useEditFocusZoom } from "./useEditFocusZoom";
import { useToolShortcuts } from "./useToolShortcuts";
import { useWindowChrome } from "./useWindowChrome";
import { useWebPersistence } from "./useWebPersistence";
import { useSelectionStore } from "./selectionStore";
import { useToolStore } from "./toolStore";
import { CanvasGrid } from "./CanvasGrid";
import { EdgeLayer } from "./EdgeLayer";
import { NodeLayer } from "./NodeLayer";
import { Toolbar } from "./Toolbar";
import { ZoomIndicator } from "./ZoomIndicator";
import { TitleBar } from "./TitleBar";
import { ShortcutsOverlay } from "./ShortcutsOverlay";
import "./Canvas.css";

export function Canvas() {
  const rootRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const pan = useCanvasPan();
  const zoom = useCanvasZoom();
  const createNode = useCreateNode();
  const marquee = useMarqueeSelect();
  const tool = useToolStore((s) => s.tool);
  const isSpaceHeld = useToolStore((s) => s.isSpaceHeld);
  const effectiveTool = isSpaceHeld ? "hand" : tool;

  useCanvasKeyboard();
  useWorldTransform(worldRef);
  useWindowTitle();
  useNativeMenu();
  useEditFocusZoom();
  useToolShortcuts();
  useWindowChrome();
  useWebPersistence();

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

  const onRootClick = (e: React.MouseEvent) => {
    if (marquee.moved.current) {
      marquee.moved.current = false;
      return;
    }
    if (e.target === e.currentTarget) {
      useSelectionStore.getState().clearSelection();
    }
  };

  const onRootPointerDown = (e: React.PointerEvent) => {
    pan.onPointerDown(e);
    if (!pan.isPanning.current) marquee.onPointerDown(e);
  };
  const onRootPointerMove = (e: React.PointerEvent) => {
    pan.onPointerMove(e);
    marquee.onPointerMove(e);
  };
  const onRootPointerUp = (e: React.PointerEvent) => {
    pan.onPointerUp(e);
    marquee.onPointerUp(e);
  };

  return (
    <div
      ref={rootRef}
      className={`canvas-root${effectiveTool === "hand" ? " canvas-root--hand" : ""}`}
      onPointerDown={onRootPointerDown}
      onPointerMove={onRootPointerMove}
      onPointerUp={onRootPointerUp}
      onClick={onRootClick}
      onDoubleClick={createNode.onDoubleClick}
    >
      <TitleBar />
      <CanvasGrid />
      <div ref={worldRef} className="canvas-world">
        <EdgeLayer />
        <NodeLayer />
      </div>
      {marquee.rect && (
        <div
          className="canvas-marquee"
          style={{
            left: marquee.rect.x,
            top: marquee.rect.y,
            width: marquee.rect.width,
            height: marquee.rect.height,
          }}
        />
      )}
      <ZoomIndicator />
      <Toolbar />
      <ShortcutsOverlay />
    </div>
  );
}
