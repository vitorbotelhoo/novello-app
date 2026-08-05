/** Builds a gently wiggly (single cubic-bezier "thread") SVG path between two world points. */
export function buildThreadPath(x1: number, y1: number, x2: number, y2: number, edgeId: string): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  let seed = 0;
  for (let i = 0; i < edgeId.length; i++) seed += edgeId.charCodeAt(i);
  const wiggle = Math.min(len * 0.18, 40) * (seed % 2 === 0 ? 1 : -1);

  const c1x = x1 + dx * 0.33 + nx * wiggle;
  const c1y = y1 + dy * 0.33 + ny * wiggle;
  const c2x = x1 + dx * 0.66 - nx * wiggle;
  const c2y = y1 + dy * 0.66 - ny * wiggle;

  return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}
