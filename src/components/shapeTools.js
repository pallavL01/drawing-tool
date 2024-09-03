// components/shapeTools.js

export function initializeShapeTools(setCurrentTool) {
  const shapeTools = [
    { id: "rectangleToolButton", name: "rectangle" },
    { id: "circleToolButton", name: "circle" }
  ];

  for (const tool of shapeTools) {
    const button = document.getElementById(tool.id);
    if (button) {
      button.addEventListener("click", () => {
        setCurrentTool(tool.name);
        console.log(`${tool.name.charAt(0).toUpperCase() + tool.name.slice(1)} tool selected`);
      });
    }
  }
}
