// components/exportPanel.js

export function initializeExportPanel() {
  const exportPanel = document.getElementById("exportPanel");
  const exportButton = document.createElement("button");
  exportButton.textContent = "Export as PNG";

  exportButton.addEventListener("click", () => {
    const canvas = document.getElementById("drawingCanvas");
    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = "drawing.png";
    link.click();
  });

  exportPanel.appendChild(exportButton);
}
