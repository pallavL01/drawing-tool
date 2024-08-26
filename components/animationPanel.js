// components/animationPanel.js

export function initializeAnimationPanel(canvas) {
    if (!canvas) {
        console.error('Canvas element is undefined');
        return;
    }

    const ctx = canvas.getContext('2d');
    const frames = [];
    let currentFrameIndex = 0;

    function addFrame() {
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = canvas.width;
        frameCanvas.height = canvas.height;
        frames.push(frameCanvas);
        currentFrameIndex = frames.length - 1;
        updateAnimationUI();
    }

    function saveCurrentFrame() {
        const currentFrame = frames[currentFrameIndex];
        const frameCtx = currentFrame.getContext('2d');
        frameCtx.clearRect(0, 0, canvas.width, canvas.height);
        frameCtx.drawImage(canvas, 0, 0);
    }

    function updateAnimationUI() {
        // Example: Update the UI to reflect current frame (you can expand this as needed)
        console.log(`Current frame: ${currentFrameIndex + 1} / ${frames.length}`);
    }

    document.addEventListener('DOMContentLoaded', () => {
        const addFrameButton = document.getElementById('addFrameButton');
        const saveFrameButton = document.getElementById('saveFrameButton');

        if (addFrameButton) {
            addFrameButton.addEventListener('click', addFrame);
        }

        if (saveFrameButton) {
            saveFrameButton.addEventListener('click', saveCurrentFrame);
        }

        // Initialize with one frame
        addFrame();
    });
}
