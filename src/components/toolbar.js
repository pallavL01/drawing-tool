export function initializeToolbar(setCurrentTool) {
  const tools = [
    { id: "brushToolButton", tool: "brush" },
    { id: "eraserToolButton", tool: "eraser" }
  ];

  tools.forEach(({ id, tool }) => {
    const button = document.getElementById(id);
    if (button) {
      button.addEventListener("click", () => {
        setCurrentTool(tool);
        console.log(`${tool.charAt(0).toUpperCase() + tool.slice(1)} tool selected`);
      });
    }
  });
}
