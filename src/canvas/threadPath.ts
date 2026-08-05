import { hashString, mulberry32 } from "./prng";

const THREAD_PASTELS = ["#c9a7d1", "#a7c3d1", "#a7d1b8", "#d1c3a7", "#d1a7c0", "#a7add1"];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface Point {
  x: number;
  y: number;
}

/** Smooth curve through waypoints via Catmull-Rom converted to cubic Beziers. */
function catmullRomPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

const SEGMENTS = 12;

/** Builds a wiggly "cotton thread" SVG path between two world points, unique but stable per edge id. */
export function buildThreadPath(x1: number, y1: number, x2: number, y2: number, edgeId: string): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  const rand = mulberry32(hashString(edgeId));
  const waveCount = clamp(len / 180, 0.8, 3) * (0.85 + rand() * 0.3);
  const phase = rand() * Math.PI * 2;
  const amplitude = clamp(len * 0.05, 4, 18) * (0.75 + rand() * 0.5);

  const points: Point[] = [];
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    const envelope = Math.sin(Math.PI * t); // tapers to 0 at both ends
    const wave = Math.sin(t * waveCount * Math.PI * 2 + phase);
    const offset = amplitude * envelope * wave;
    points.push({ x: x1 + dx * t + nx * offset, y: y1 + dy * t + ny * offset });
  }

  return catmullRomPath(points);
}

/** Deterministic pastel color per edge, so threads read as distinct strands rather than a uniform mesh. */
export function threadColor(edgeId: string): string {
  const rand = mulberry32(hashString(edgeId + ":color"));
  return THREAD_PASTELS[Math.floor(rand() * THREAD_PASTELS.length)];
}
