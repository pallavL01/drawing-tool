// components/layersPanel.js

export function initializeLayersPanel() {
  const canvasContainer = document.getElementById("canvasContainer");
  const layersPanel = document.getElementById("layersPanel");

  const layers = []; // Array to hold canvas layers
  let currentLayerIndex = 0;

  // Function to create a new layer
  function createLayer() {
    const layer = document.createElement("canvas");
    layer.width = 800;
    layer.height = 800;
    layer.style.position = "absolute";
    canvasContainer.appendChild(layer);
    layers.push(layer);
    currentLayerIndex = layers.length - 1;
    updateLayersUI();
  }

  // Function to update the layers UI
  function updateLayersUI() {
    layersPanel.innerHTML = "";
    layers.forEach((layer, index) => {
      const layerItem = document.createElement("div");
      layerItem.textContent = `Layer ${index + 1}`;
      layerItem.style.cursor = "pointer";
      layerItem.style.padding = "5px";
      layerItem.style.border =
        index === currentLayerIndex ? "2px solid #000" : "1px solid #ccc";
      layerItem.addEventListener("click", () => setActiveLayer(index));
      layersPanel.appendChild(layerItem);
    });
  }

  // Function to set the active layer
  function setActiveLayer(index) {
    currentLayerIndex = index;
    updateLayersUI();
  }

  // Function to delete the current layer
  function deleteLayer() {
    if (layers.length > 1) {
      layers[currentLayerIndex].remove();
      layers.splice(currentLayerIndex, 1);
      currentLayerIndex = Math.max(0, currentLayerIndex - 1);
      updateLayersUI();
    } else {
      alert("At least one layer must remain.");
    }
  }

  // Wait for the DOM to fully load before adding event listeners
  document.addEventListener("DOMContentLoaded", () => {
    const addLayerButton = document.getElementById("addLayerButton");
    const deleteLayerButton = document.getElementById("deleteLayerButton");

    if (addLayerButton) {
      addLayerButton.addEventListener("click", createLayer);
    }

    if (deleteLayerButton) {
      deleteLayerButton.addEventListener("click", deleteLayer);
    }

    // Initialize with one layer
    createLayer();
  });
}
