// components/animationPanel.js

export function initializeAnimationPanel(canvas) {
  if (!canvas) {
    console.error("Canvas element is undefined");
    return;
  }

  const ctx = canvas.getContext("2d");
  const frames = [];
  let currentFrameIndex = 0;

  const addFrame = () => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = canvas.width;
    frameCanvas.height = canvas.height;
    frames.push(frameCanvas);
    currentFrameIndex = frames.length - 1;
    updateAnimationUI();
  };

  const saveCurrentFrame = () => {
    const currentFrame = frames[currentFrameIndex];
    const frameCtx = currentFrame.getContext("2d");
    frameCtx.clearRect(0, 0, canvas.width, canvas.height);
    frameCtx.drawImage(canvas, 0, 0);
  };

  const updateAnimationUI = () => {
    console.log(`Current frame: ${currentFrameIndex + 1} / ${frames.length}`);
  };

  const setupEventListeners = () => {
    const addFrameButton = document.getElementById("addFrameButton");
    const saveFrameButton = document.getElementById("saveFrameButton");

    if (addFrameButton) {
      addFrameButton.addEventListener("click", addFrame);
    }

    if (saveFrameButton) {
      saveFrameButton.addEventListener("click", saveCurrentFrame);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    addFrame();
  });
}
