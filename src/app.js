import { initializeToolbar } from "./components/toolbar.js";
import { initializeShapeTools } from "./components/shapeTools.js";
import { initializeTextTool } from "./components/textTool.js";
import { CanvasWorkerFramework } from "./canvasWorkerFramework.js"; // Import your worker framework

let currentTool = "brush"; // Default tool
let uploadedImage = null; // Store uploaded image
let originalImageData = null; // Store the original image data for reset

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

let isDrawing = false;
let shapes = []; // Array to hold shapes and freeform drawings
let currentFreeform = null; // To hold the current freeform drawing
let draggingShape = null;
let offsetX = 0;
let offsetY = 0;

// Initialize your worker framework
const workerFramework = new CanvasWorkerFramework("worker.js", 4);

function setCurrentTool(tool) {
  currentTool = tool;
  console.log(`Current tool set to: ${currentTool}`);
}

function startDrawing(event) {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);

  if (currentTool === "rectangle" || currentTool === "circle") {
    let shape = {
      type: currentTool,
      x: event.offsetX,
      y: event.offsetY,
      width: 0,
      height: 0,
      radius: 0,
      color: currentTool === "rectangle" ? "#FF0000" : "#0000FF",
    };
    shapes.push(shape);
  } else if (currentTool === "brush" || currentTool === "eraser") {
    currentFreeform = {
      type: "freeform",
      points: [{ x: event.offsetX, y: event.offsetY }],
      color: currentTool === "eraser" ? "#FFFFFF" : "#000000",
      lineWidth: 5,
    };
    shapes.push(currentFreeform);
  }
}

function draw(event) {
  if (!isDrawing) return;

  if (currentTool === "rectangle" || currentTool === "circle") {
    let shape = shapes[shapes.length - 1];
    if (currentTool === "rectangle") {
      shape.width = event.offsetX - shape.x;
      shape.height = event.offsetY - shape.y;
    } else if (currentTool === "circle") {
      shape.radius = Math.sqrt(
        Math.pow(event.offsetX - shape.x, 2) +
          Math.pow(event.offsetY - shape.y, 2)
      );
    }
  } else if (currentTool === "brush" || currentTool === "eraser") {
    currentFreeform.points.push({ x: event.offsetX, y: event.offsetY });
    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.strokeStyle = currentFreeform.color;
    ctx.lineWidth = currentFreeform.lineWidth;
    ctx.stroke();
  }

  redrawCanvas();
}

function stopDrawing() {
  isDrawing = false;
  ctx.closePath();
}

function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw uploaded image first if available
  if (uploadedImage) {
    ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
  }

  // Draw shapes and freeform drawings on top
  shapes.forEach((shape) => {
    if (shape.type === "rectangle") {
      ctx.fillStyle = shape.color;
      ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
    } else if (shape.type === "circle") {
      ctx.fillStyle = shape.color;
      ctx.beginPath();
      ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.closePath();
    } else if (shape.type === "freeform") {
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      shape.points.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = shape.lineWidth;
      ctx.stroke();
      ctx.closePath();
    } else if (shape.type === "text") {
      ctx.fillStyle = shape.color;
      ctx.font = `${shape.fontSize}px Arial`;
      ctx.fillText(shape.text, shape.x, shape.y);
    }
  });
}

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the entire canvas
  shapes = []; // Clear the shapes array
  uploadedImage = null; // Clear the uploaded image
  originalImageData = null; // Clear the original image data

  // Reset the file input so that the same image can be re-uploaded
  const imageUploadInput = document.getElementById("imageUpload");
  imageUploadInput.value = ""; // Clear the file input

  // Optionally redraw the canvas to ensure it's fully cleared visually
  redrawCanvas();
}

function getShapeAtCoordinates(x, y) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (shape.type === "rectangle") {
      if (
        x >= shape.x &&
        x <= shape.x + shape.width &&
        y >= shape.y &&
        y <= shape.y + shape.height
      ) {
        return shape;
      }
    } else if (shape.type === "circle") {
      const distance = Math.sqrt(
        Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2)
      );
      if (distance <= shape.radius) {
        return shape;
      }
    }
  }
  return null;
}

function onMouseDown(event) {
  if (currentTool === "text") {
    const text = prompt("Enter text:");
    if (text) {
      const fontSize = 20; // Default font size
      shapes.push({
        type: "text",
        text: text,
        x: event.offsetX,
        y: event.offsetY,
        fontSize: fontSize,
        color: "#000000", // Default text color
      });
      redrawCanvas();
    }
  } else {
    const shape = getShapeAtCoordinates(event.offsetX, event.offsetY);
    if (shape && (currentTool === "rectangle" || currentTool === "circle")) {
      draggingShape = shape;
      offsetX = event.offsetX - shape.x;
      offsetY = event.offsetY - shape.y;
    } else {
      startDrawing(event);
    }
  }
}

function onMouseMove(event) {
  if (draggingShape) {
    draggingShape.x = event.offsetX - offsetX;
    draggingShape.y = event.offsetY - offsetY;
    redrawCanvas();
  } else if (isDrawing) {
    draw(event);
  }
}

function onMouseUp(event) {
  if (draggingShape) {
    draggingShape = null;
  } else {
    stopDrawing();
  }
}

// Set up event listeners for drawing, erasing, etc.
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("mouseout", onMouseUp);

// Initialize all components
initializeToolbar(setCurrentTool); // Pass setCurrentTool to toolbar.js
initializeShapeTools(setCurrentTool); // Pass setCurrentTool to shapeTools.js
initializeTextTool(setCurrentTool); // Initialize the text tool

// Offload filters to the worker
function applyFilter(filterName) {
  if (filterName === "reset") {
    if (originalImageData) {
      ctx.putImageData(originalImageData, 0, 0); // Restore the original image data
    }
  } else {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    workerFramework
      .processCanvasTask(imageData, "applyFilter", { filter: filterName })
      .then((filteredData) => {
        ctx.putImageData(filteredData, 0, 0);
      })
      .catch((error) => {
        console.error("Error applying filter:", error);
      });
  }
}

// Add event listener for filter dropdown
document
  .getElementById("filterDropdown")
  .addEventListener("change", (event) => {
    const filterName = event.target.value;
    if (filterName) {
      applyFilter(filterName);
    }
  });

// Handle image upload
document.getElementById("imageUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        uploadedImage = img;
        ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height); // Save original image data
        redrawCanvas(); // Draw the uploaded image on the canvas
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Add event listener for clear canvas button
document
  .getElementById("clearCanvasButton")
  .addEventListener("click", clearCanvas);
