// components/exportPanel.js

export function initializeExportPanel() {
  const exportPanel = document.querySelector("#exportPanel");
  const exportButton = document.createElement("button");

  // Add semantic class and attributes for better accessibility
  exportButton.className = "export-button";
  exportButton.setAttribute("aria-label", "Export drawing as PNG");
  exportButton.textContent = "Export as PNG";

  const handleExport = () => {
    const canvas = document.querySelector("#drawingCanvas");
    // Add error handling in case canvas doesn't exist
    if (!canvas) {
      console.error("Canvas element not found");
      return;
    }

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `drawing-${Date.now()}.png`;
      link.click();
    } catch (error) {
      console.error("Error exporting canvas:", error);
    }
  };

  exportButton.addEventListener("click", handleExport);
  exportPanel.appendChild(exportButton);
}
