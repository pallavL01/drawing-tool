// components/textTool.js

export function initializeTextTool(setCurrentTool) {
  const textButton = document.getElementById("textToolButton");

  if (textButton) {
    textButton.addEventListener("click", () => {
      setCurrentTool("text");
      console.log("Text tool selected");
    });
  }
}
