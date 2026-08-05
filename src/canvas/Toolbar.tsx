import { MousePointer2, Hand, SquarePlus, Maximize2, Focus } from "lucide-react";
import { useToolStore, type Tool } from "./toolStore";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { useCanvasStore } from "./store";
import { computeFitViewport, computeFitViewportForNodeIds } from "./zoomToFit";
import { animateViewport } from "./viewportAnimation";
import { screenToWorld } from "./coords";
import "./Toolbar.css";

function addBoxAtViewportCenter() {
  const viewport = useCanvasStore.getState().viewport;
  const world = screenToWorld({ x: window.innerWidth / 2, y: window.innerHeight / 2 }, viewport);
  const id = useNodesStore.getState().addNode(world.x, world.y);
  useSelectionStore.getState().selectNode(id, false);
}

function fitToContent() {
  const target = computeFitViewport();
  if (target) animateViewport(target);
}

function fitToSelected() {
  const selectedIds = Array.from(useSelectionStore.getState().selectedNodeIds);
  const target = computeFitViewportForNodeIds(selectedIds);
  if (target) animateViewport(target);
}

export function Toolbar() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);
  const hasSelection = useSelectionStore((s) => s.selectedNodeIds.size > 0);

  const toolButton = (value: Tool, label: string, Icon: typeof MousePointer2) => (
    <button
      type="button"
      className={`novello-toolbar-button${tool === value ? " novello-toolbar-button--active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={tool === value}
      onClick={() => setTool(value)}
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );

  return (
    <div
      className="novello-toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {toolButton("select", "Select (V)", MousePointer2)}
      {toolButton("hand", "Hand (H)", Hand)}
      <div className="novello-toolbar-divider" />
      <button
        type="button"
        className="novello-toolbar-button"
        title="Add box"
        aria-label="Add box"
        onClick={addBoxAtViewportCenter}
      >
        <SquarePlus size={18} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="novello-toolbar-button"
        title="Fit to content (⌘1)"
        aria-label="Fit to content"
        onClick={fitToContent}
      >
        <Maximize2 size={18} strokeWidth={1.75} />
      </button>
      <button
        type="button"
        className="novello-toolbar-button"
        title="Fit to selected (⌘2)"
        aria-label="Fit to selected"
        disabled={!hasSelection}
        onClick={fitToSelected}
      >
        <Focus size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}
