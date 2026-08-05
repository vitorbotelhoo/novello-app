import { MousePointer2, Hand, SquarePlus, Maximize2, Focus } from "lucide-react";
import { useToolStore, type Tool } from "./toolStore";
import { useSelectionStore } from "./selectionStore";
import { useNodesStore } from "./nodesStore";
import { useCanvasStore } from "./store";
import { computeFitViewport, computeFitViewportForNodeIds } from "./zoomToFit";
import { animateViewport } from "./viewportAnimation";
import { screenToWorld } from "./coords";
import { Tooltip } from "./Tooltip";
import { SHORTCUT_KEYS } from "./shortcuts";
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

  const toolButton = (value: Tool, label: string, shortcut: string, Icon: typeof MousePointer2) => (
    <Tooltip label={label} shortcut={shortcut}>
      <button
        type="button"
        className={`novello-toolbar-button${tool === value ? " novello-toolbar-button--active" : ""}`}
        aria-label={label}
        aria-pressed={tool === value}
        onClick={() => setTool(value)}
      >
        <Icon size={18} strokeWidth={1.75} />
      </button>
    </Tooltip>
  );

  return (
    <div
      className="novello-toolbar"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      {toolButton("select", "Select", SHORTCUT_KEYS.select, MousePointer2)}
      {toolButton("hand", "Hand", SHORTCUT_KEYS.hand, Hand)}
      <div className="novello-toolbar-divider" />
      <Tooltip label="Add node">
        <button
          type="button"
          className="novello-toolbar-button"
          aria-label="Add node"
          onClick={addBoxAtViewportCenter}
        >
          <SquarePlus size={18} strokeWidth={1.75} />
        </button>
      </Tooltip>
      <Tooltip label="Fit to content" shortcut={SHORTCUT_KEYS.fitContent}>
        <button
          type="button"
          className="novello-toolbar-button"
          aria-label="Fit to content"
          onClick={fitToContent}
        >
          <Maximize2 size={18} strokeWidth={1.75} />
        </button>
      </Tooltip>
      <Tooltip label="Fit to selection" shortcut={SHORTCUT_KEYS.fitSelected}>
        <button
          type="button"
          className="novello-toolbar-button"
          aria-label="Fit to selection"
          disabled={!hasSelection}
          onClick={fitToSelected}
        >
          <Focus size={18} strokeWidth={1.75} />
        </button>
      </Tooltip>
    </div>
  );
}
