// components/gridSystem.js

export function initializeGridSystem(canvas) {
  const ctx = canvas.getContext("2d");
  const gridSize = 20; // Size of each grid square

  function drawGrid() {
    const width = canvas.width;
    const height = canvas.height;

    ctx.strokeStyle = "#ddd"; // Light gray grid lines
    ctx.lineWidth = 0.5; // Thin lines for the grid

    // Draw vertical lines
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }

  // Initially draw the grid
  drawGrid();

  return {
    drawGrid, // Expose the drawGrid function
    refreshGrid: drawGrid, // Alias for refreshing the grid
  };
}
