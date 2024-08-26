// components/shapeTools.js

export function initializeShapeTools(setCurrentTool) {
  const rectangleButton = document.getElementById("rectangleToolButton");
  const circleButton = document.getElementById("circleToolButton");

  if (rectangleButton) {
    rectangleButton.addEventListener("click", () => {
      setCurrentTool("rectangle");
      console.log("Rectangle tool selected");
    });
  }

  if (circleButton) {
    circleButton.addEventListener("click", () => {
      setCurrentTool("circle");
      console.log("Circle tool selected");
    });
  }
}
