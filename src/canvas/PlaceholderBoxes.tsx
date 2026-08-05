const PASTELS = ["#f2c9d8", "#c9e0f2", "#d8f2c9", "#f2e0c9", "#e0c9f2", "#c9f2ec"];

// 18x18 grid (324 boxes) spread over ~4000px, used to visually verify
// pan/zoom/transform correctness and stress-test render performance.
const GRID_SIZE = 18;
const SPACING = 220;

interface Box {
  id: string;
  x: number;
  y: number;
  color: string;
}

function generateBoxes(): Box[] {
  const boxes: Box[] = [];
  const half = Math.floor(GRID_SIZE / 2);
  for (let row = -half; row < GRID_SIZE - half; row++) {
    for (let col = -half; col < GRID_SIZE - half; col++) {
      boxes.push({
        id: `${row}-${col}`,
        x: col * SPACING,
        y: row * SPACING,
        color: PASTELS[(row + col + GRID_SIZE * 2) % PASTELS.length],
      });
    }
  }
  return boxes;
}

const BOXES = generateBoxes();

export function PlaceholderBoxes() {
  return (
    <>
      {BOXES.map((box) => (
        <div
          key={box.id}
          className="placeholder-box"
          style={{ left: box.x, top: box.y, backgroundColor: box.color }}
        >
          {box.id}
        </div>
      ))}
    </>
  );
}
