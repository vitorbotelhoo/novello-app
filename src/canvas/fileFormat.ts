import type { CanvasNode, CanvasEdge } from "./nodesStore";

const CURRENT_VERSION = 1;

export interface NovelloFile {
  version: 1;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export function serialize(nodes: Record<string, CanvasNode>, edges: Record<string, CanvasEdge>): string {
  const file: NovelloFile = {
    version: CURRENT_VERSION,
    nodes: Object.values(nodes),
    edges: Object.values(edges),
  };
  return JSON.stringify(file, null, 2);
}

export function parse(json: string): NovelloFile {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Not a valid novello file: malformed JSON.");
  }

  if (typeof data !== "object" || data === null) {
    throw new Error("Not a valid novello file: expected an object.");
  }

  const { version, nodes, edges } = data as Partial<NovelloFile>;

  if (version !== CURRENT_VERSION) {
    throw new Error(`Unsupported novello file version: ${String(version)}.`);
  }
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    throw new Error("Not a valid novello file: missing nodes or edges.");
  }

  return { version, nodes, edges };
}
