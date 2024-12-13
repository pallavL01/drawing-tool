// components/gridSystem.js

export function initializeGridSystem(canvas) {
  if (!canvas) throw new Error("Canvas element is required");

  const ctx = canvas.getContext("2d");
  const GRID_SIZE = 20;
  const GRID_COLOR = "#ddd";
  const LINE_WIDTH = 0.5;

  function drawGrid() {
    const { width, height } = canvas;

    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.beginPath();

    // Draw vertical and horizontal lines in single loop
    for (let i = 0; i <= Math.max(width, height); i += GRID_SIZE) {
      if (i <= width) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, height);
      }
      if (i <= height) {
        ctx.moveTo(0, i);
        ctx.lineTo(width, i);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  drawGrid();

  return { drawGrid };
}
