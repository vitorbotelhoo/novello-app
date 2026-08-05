import { useEffect, useRef, useState } from "react";
import { useNodesStore, type CanvasNode } from "./nodesStore";
import { useSelectionStore } from "./selectionStore";
import { useNodeDrag } from "./useNodeDrag";
import { useConnectionHandle } from "./useConnectionHandle";

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
    e.stopPropagation();
    useSelectionStore.getState().startEditing(node.id);
  };

  const onClick = (e: React.MouseEvent) => {
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
      style={{ left: node.x, top: node.y, backgroundColor: node.color }}
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
