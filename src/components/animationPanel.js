// components/animationPanel.js

export function initializeAnimationPanel(canvas) {
  if (!canvas) throw new Error("Canvas element is required");

  const state = {
    ctx: canvas.getContext("2d"),
    frames: [],
    currentFrameIndex: 0,
  };

  const createFrame = () => {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = canvas.width;
    frameCanvas.height = canvas.height;
    return frameCanvas;
  };

  const handlers = {
    addFrame: () => {
      state.frames.push(createFrame());
      state.currentFrameIndex = state.frames.length - 1;
      updateUI();
    },

    saveFrame: () => {
      const { frames, currentFrameIndex } = state;
      const frameCtx = frames[currentFrameIndex].getContext("2d");
      frameCtx.clearRect(0, 0, canvas.width, canvas.height);
      frameCtx.drawImage(canvas, 0, 0);
    },
  };

  const updateUI = () => {
    const { currentFrameIndex, frames } = state;
    console.log(`Current frame: ${currentFrameIndex + 1} / ${frames.length}`);
  };

  const bindEvents = () => {
    ["addFrame", "saveFrame"].forEach((action) => {
      const button = document.getElementById(`${action}Button`);
      button?.addEventListener("click", handlers[action]);
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    handlers.addFrame();
  });
}
