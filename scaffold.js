const fs = require('fs');
const path = require('path');

// Define the project structure
const projectStructure = {
    'index.html': `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Advanced Drawing Canvas</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div id="toolbar">
        <!-- Toolbar with tools for drawing, erasing, shapes, text, and more -->
    </div>
    <div id="canvasContainer">
        <canvas id="drawingCanvas" width="800" height="800"></canvas>
    </div>
    <div id="layersPanel">
        <!-- Layers Panel for managing layers -->
    </div>
    <div id="colorPicker">
        <!-- Color Picker for choosing colors -->
    </div>
    <div id="animationPanel">
        <!-- Animation Panel for creating frame-by-frame animations -->
    </div>
    <div id="exportPanel">
        <!-- Export options for saving or exporting work -->
    </div>

    <script type="module" src="app.js"></script>
</body>
</html>
`,
    'style.css': `
body {
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f0f0f0;
}

canvas {
    border: 2px solid #000;
    cursor: crosshair;
    background-color: #fff;
}

button {
    margin-top: 20px;
    padding: 10px 20px;
    font-size: 16px;
}
`,
    'app.js': `import { initializeToolbar } from './components/toolbar.js';
import { initializeLayersPanel } from './components/layersPanel.js';
import { initializeColorPicker } from './components/colorPicker.js';
import { initializeShapeTools } from './components/shapeTools.js';
import { initializeTextTool } from './components/textTool.js';
import { initializeGridSystem } from './components/gridSystem.js';
import { initializeAnimationPanel } from './components/animationPanel.js';
import { initializeExportPanel } from './components/exportPanel.js';
import { initializeUndoRedo } from './components/undoRedo.js';
import { CanvasWorkerFramework } from './canvasWorkerFramework.js';

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;
let currentTool = 'brush'; // Default tool
let imageData = null;

// Initialize all components
initializeToolbar();
initializeLayersPanel();
initializeColorPicker();
initializeShapeTools();
initializeTextTool();
initializeGridSystem();
initializeAnimationPanel();
initializeExportPanel();
initializeUndoRedo();

// Initialize worker framework for processing tasks
const framework = new CanvasWorkerFramework('worker.js', 4);

// Set up event listeners for drawing, erasing, etc.
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

function startDrawing(event) {
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}

function draw(event) {
    if (!isDrawing) return;

    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.strokeStyle = currentTool === 'eraser' ? '#fff' : '#000'; // Eraser or Brush
    ctx.lineWidth = 2;  // Can be adjusted via UI
    ctx.stroke();
}

function stopDrawing() {
    isDrawing = false;
    ctx.closePath();
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

// Example function to apply blur using Web Worker
function applyBlur() {
    if (imageData) {
        framework.processCanvasTask(imageData, 'blur', { radius: 5 })
            .then((processedData) => {
                ctx.putImageData(processedData, 0, 0);
                imageData = processedData;
            })
            .catch((error) => console.error('Error processing the drawing:', error));
    }
}
`,
    'canvasWorkerFramework.js': `export class CanvasWorkerFramework {
    constructor(workerScriptUrl, poolSize = 4) {
        this.workerScriptUrl = workerScriptUrl;
        this.workerPool = new Map(); // Map to store worker instances
        this.taskQueue = []; // Queue to store tasks
        this.activeWorkers = new Set(); // Set to track active workers
        this.poolSize = poolSize;

        // Initialize the worker pool
        this.initializeWorkerPool();
    }

    // Initialize the worker pool with a specified size
    initializeWorkerPool() {
        for (let i = 0; i < this.poolSize; i++) {
            this.createWorker(i);
        }
    }

    // Create a new worker and add it to the pool
    createWorker(workerId) {
        const worker = new Worker(this.workerScriptUrl);
        worker.onmessage = this.handleWorkerResponse.bind(this, workerId);
        worker.onerror = this.handleWorkerError.bind(this, workerId);
        this.workerPool.set(workerId, worker);
    }

    // Handle the worker's response and resolve the associated task
    handleWorkerResponse(workerId, event) {
        const { imageData } = event.data;
        const [resolve] = this.taskQueue.shift(); // Retrieve the task from the queue
        resolve(imageData); // Resolve the promise with the processed data

        this.activeWorkers.delete(workerId); // Mark the worker as idle
        this.processNextTask(workerId); // Process the next task in the queue
    }

    // Handle any errors that occur in the worker
    handleWorkerError(workerId, error) {
        console.error(\`Worker \${workerId} encountered an error:\`, error);
        this.terminateWorker(workerId);

        if (this.taskQueue.length > 0) {
            const [, reject] = this.taskQueue.shift(); // Retrieve and reject the task
            reject(error); // Reject the promise with the error
        }
    }

    // Add a task to the queue and assign it to an available worker
    processCanvasTask(imageData, task, options = {}) {
        return new Promise((resolve, reject) => {
            this.taskQueue.push([resolve, reject, imageData, task, options]);
            this.assignTaskToWorker();
        });
    }

    // Assign the next task in the queue to an available worker
    assignTaskToWorker() {
        for (let [workerId, worker] of this.workerPool.entries()) {
            if (!this.activeWorkers.has(workerId) && this.taskQueue.length > 0) {
                this.processNextTask(workerId); // Delegate task to an idle worker
                break; // Exit the loop after assigning one task
            }
        }
    }

    // Process the next task in the queue for the specified worker
    processNextTask(workerId) {
        if (this.taskQueue.length > 0) {
            const [, , imageData, task, options] = this.taskQueue[0]; // Peek at the next task
            const worker = this.workerPool.get(workerId);
            worker.postMessage({ imageData, task, options }); // Send task to the worker
            this.activeWorkers.add(workerId); // Mark the worker as active
        }
    }

    // Terminate the specified worker and remove it from the pool
    terminateWorker(workerId) {
        const worker = this.workerPool.get(workerId);
        if (worker) {
            worker.terminate();
            this.workerPool.delete(workerId); // Remove worker from the pool
        }
    }
}
`,
    'worker.js': `self.onmessage = function(event) {
    const { imageData, task, options } = event.data;

    let processedData;

    switch (task) {
        case 'blur':
            processedData = applyBoxBlur(imageData, options.radius || 1);
            break;
        // Add other tasks as needed
        default:
            console.error('Unknown task:', task);
    }

    self.postMessage({ imageData: processedData });
};

function applyBoxBlur(imageData, radius) {
    const { width, height, data } = imageData;
    const copy = new Uint8ClampedArray(data);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0, count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const index = (ny * width + nx) * 4;
                        r += copy[index];
                        g += copy[index + 1];
                        b += copy[index + 2];
                        count++;
                    }
                }
            }

            const i = (y * width + x) * 4;
            data[i] = r / count;
            data[i + 1] = g / count;
            data[i + 2] = b / count;
        }
    }

    return imageData;
}
`,
    'components/toolbar.js': '',
    'components/layersPanel.js': '',
    'components/colorPicker.js': '',
    'components/shapeTools.js': '',
    'components/textTool.js': '',
    'components/gridSystem.js': '',
    'components/animationPanel.js': '',
    'components/exportPanel.js': '',
    'components/undoRedo.js': '',
    'assets/textures/': null,
    'assets/patterns/': null
};

// Helper function to create directories and files
function createStructure(basePath, structure) {
    for (const name in structure) {
        const content = structure[name];
        const fullPath = path.join(basePath, name);

        if (typeof content === 'object' && content !== null) {
            fs.mkdirSync(fullPath, { recursive: true });
            createStructure(fullPath, content);
        } else if (content === null) {
            fs.mkdirSync(fullPath, { recursive: true }); // Ensure directories are created
        } else {
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(fullPath, content || '');
        }
    }
}

// Create the project structure
createStructure('.', projectStructure);

console.log('Project structure has been created successfully!');
