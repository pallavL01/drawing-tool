export function initializeToolbar(setCurrentTool) {
  const brushButton = document.getElementById("brushToolButton");
  const eraserButton = document.getElementById("eraserToolButton");

  if (brushButton) {
    brushButton.addEventListener("click", () => {
      setCurrentTool("brush");
      console.log("Brush tool selected");
    });
  }

  if (eraserButton) {
    eraserButton.addEventListener("click", () => {
      setCurrentTool("eraser");
      console.log("Eraser tool selected");
    });
  }
}
