// components/undoRedo.js

export function initializeUndoRedo(canvas) {
    const ctx = canvas.getContext('2d');
    const undoStack = [];
    const redoStack = [];

    // Save the current state of the canvas to the undo stack
    function saveState() {
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        // Clear the redo stack whenever a new action is taken
        redoStack.length = 0;
    }

    // Undo the last action
    function undo() {
        if (undoStack.length > 0) {
            redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // Save current state to redo stack
            const previousState = undoStack.pop(); // Pop the last state from the undo stack
            ctx.putImageData(previousState, 0, 0); // Restore the canvas to the previous state
        }
    }

    // Redo the last undone action
    function redo() {
        if (redoStack.length > 0) {
            undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); // Save current state to undo stack
            const nextState = redoStack.pop(); // Pop the last state from the redo stack
            ctx.putImageData(nextState, 0, 0); // Restore the canvas to the redone state
        }
    }

    // Initialize undo and redo buttons or keyboard shortcuts
    document.getElementById('undoButton').addEventListener('click', undo);
    document.getElementById('redoButton').addEventListener('click', redo);

    return {
        saveState,
        undo,
        redo
    };
}
