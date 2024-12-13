// components/layersPanel.js

export function initializeLayersPanel() {
  const elements = {
    container: document.getElementById("canvasContainer"),
    panel: document.getElementById("layersPanel"),
  };

  const state = {
    layers: [],
    currentIndex: 0,
  };

  const CANVAS_DIMENSIONS = { width: 800, height: 800 };

  const createCanvas = () => {
    const canvas = document.createElement("canvas");
    Object.assign(canvas, {
      ...CANVAS_DIMENSIONS,
      style: { position: "absolute" },
    });
    return canvas;
  };

  const createLayer = () => {
    const canvas = createCanvas();
    elements.container.appendChild(canvas);
    state.layers.push(canvas);
    state.currentIndex = state.layers.length - 1;
    updateLayersUI();
  };

  const updateLayersUI = () => {
    elements.panel.innerHTML = "";
    state.layers.forEach((_, index) => {
      const layerItem = document.createElement("div");
      Object.assign(layerItem, {
        textContent: `Layer ${index + 1}`,
        style: {
          cursor: "pointer",
          padding: "5px",
          border:
            index === state.currentIndex ? "2px solid #000" : "1px solid #ccc",
        },
        onclick: () => setActiveLayer(index),
      });
      elements.panel.appendChild(layerItem);
    });
  };

  const setActiveLayer = (index) => {
    state.currentIndex = index;
    updateLayersUI();
  };

  const deleteLayer = () => {
    if (state.layers.length <= 1) {
      alert("At least one layer must remain.");
      return;
    }

    state.layers[state.currentIndex].remove();
    state.layers.splice(state.currentIndex, 1);
    state.currentIndex = Math.max(0, state.currentIndex - 1);
    updateLayersUI();
  };

  const initEventListeners = () => {
    ["addLayerButton", "deleteLayerButton"].forEach((id) => {
      const button = document.getElementById(id);
      if (button) {
        button.addEventListener(
          "click",
          id === "addLayerButton" ? createLayer : deleteLayer
        );
      }
    });
    createLayer(); // Initialize with one layer
  };

  document.addEventListener("DOMContentLoaded", initEventListeners);
}
