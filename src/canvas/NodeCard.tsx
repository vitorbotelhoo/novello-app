import { useEffect, useMemo, useRef, useState } from "react";
import { useNodesStore, type CanvasNode } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useNodeDrag } from "./useNodeDrag";
import { useConnectionHandle } from "./useConnectionHandle";
import { hashString, mulberry32 } from "./prng";
import { getEffectiveTool } from "./toolStore";

const MAX_TILT_DEGREES = 2.5;

/** Small deterministic tilt per node, like a hand-placed sticky note rather than a rigid grid. */
function nodeTilt(nodeId: string): number {
  const rand = mulberry32(hashString(nodeId + ":tilt"));
  return (rand() * 2 - 1) * MAX_TILT_DEGREES;
}

interface NodeCardProps {
  node: CanvasNode;
}

export function NodeCard({ node }: NodeCardProps) {
  const isSelected = useSelectionStore((s) => s.selectedNodeIds.has(node.id));
  const isEditing = useSelectionStore((s) => s.editingNodeId === node.id);
  const drag = useNodeDrag(node.id);
  const handle = useConnectionHandle(node.id);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(node.text);
  const tilt = useMemo(() => nodeTilt(node.id), [node.id]);

  useEffect(() => {
    if (isEditing) setDraft(node.text);
  }, [isEditing, node.text]);

  useEffect(() => {
    if (isEditing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [isEditing]);

  const commit = () => {
    useNodesStore.getState().updateText(node.id, draft);
    useSelectionStore.getState().stopEditing();
  };

  const cancel = () => {
    setDraft(node.text);
    useSelectionStore.getState().stopEditing();
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (getEffectiveTool() !== "select") return;
    e.stopPropagation();
    useSelectionStore.getState().startEditing(node.id);
  };

  const onClick = (e: React.MouseEvent) => {
    if (getEffectiveTool() !== "select") return;
    e.stopPropagation();
    if (drag.moved.current) {
      drag.moved.current = false;
      return;
    }
    useSelectionStore.getState().selectNode(node.id, e.shiftKey);
  };

  if (isEditing) {
    return (
      <div
        className="canvas-node canvas-node--editing"
        style={{ left: node.x, top: node.y, backgroundColor: node.color }}
        data-node-id={node.id}
      >
        <textarea
          ref={textareaRef}
          className="canvas-node-textarea"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`canvas-node${isSelected ? " canvas-node--selected" : ""}`}
      style={{ left: node.x, top: node.y, backgroundColor: node.color, "--node-tilt": `${tilt}deg` } as React.CSSProperties}
      data-node-id={node.id}
      onPointerDown={drag.onPointerDown}
      onPointerMove={drag.onPointerMove}
      onPointerUp={drag.onPointerUp}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <span className="canvas-node-text">{node.text || "New idea"}</span>
      <div
        className="canvas-node-handle"
        onPointerDown={handle.onPointerDown}
        onPointerMove={handle.onPointerMove}
        onPointerUp={handle.onPointerUp}
      />
    </div>
  );
}
