import { useNodesStore } from "./nodesStore";
import { NodeCard } from "./NodeCard";

export function NodeLayer() {
  const nodes = useNodesStore((s) => s.nodes);
  return (
    <>
      {Object.values(nodes).map((node) => (
        <NodeCard key={node.id} node={node} />
      ))}
    </>
  );
}
