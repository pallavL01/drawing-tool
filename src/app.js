import { initializeToolbar } from "./components/toolbar.js";
import { initializeShapeTools } from "./components/shapeTools.js";
import { initializeTextTool } from "./components/textTool.js";
import { initializeColorPicker } from "./components/colorPicker.js";
import { CanvasWorkerFramework } from "./canvasWorkerFramework.js";

document.addEventListener("DOMContentLoaded", () => {
  let currentTool = "brush";
  let currentColor = "#000000";
  let uploadedImage = null;
  let originalImageData = null;

  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  let isDrawing = false;
  let shapes = [];
  let currentFreeform = null;
  let draggingShape = null;
  let offsetX = 0;
  let offsetY = 0;

  const workerFramework = new CanvasWorkerFramework("./worker.js", 4);

  function setCurrentTool(tool) {
    currentTool = tool;
    console.log(`Current tool set to: ${currentTool}`);
  }

  function setCurrentColor(color) {
    currentColor = color;
    console.log(`Current color set to: ${currentColor}`);
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
        color: currentColor,
      };
      shapes.push(shape);
    } else if (currentTool === "brush" || currentTool === "eraser") {
      currentFreeform = {
        type: "freeform",
        points: [{ x: event.offsetX, y: event.offsetY }],
        color: currentTool === "eraser" ? "#FFFFFF" : currentColor,
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

    if (uploadedImage) {
      ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    }

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    shapes = [];
    uploadedImage = null;
    originalImageData = null;

    const imageUploadInput = document.getElementById("imageUpload");
    imageUploadInput.value = "";

    redrawCanvas();
  }

  function applyFilter(filterName) {
    if (filterName === "reset") {
      if (originalImageData) {
        ctx.putImageData(originalImageData, 0, 0);
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
        const fontSize = 20;
        shapes.push({
          type: "text",
          text: text,
          x: event.offsetX,
          y: event.offsetY,
          fontSize: fontSize,
          color: currentColor,
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

  function updateSimulation() {
    workerFramework.processCanvasTask(null, "updateSimulation").then((data) => {
      console.log("Received particle positions from worker:", data.positions);
      const positions = data.positions;
      redrawParticles(positions);
      requestAnimationFrame(updateSimulation); // Loop the simulation
    });
  }

  function redrawParticles(positions) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (uploadedImage) {
      ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
    }

    console.log("Drawing particles:", positions.length);
    positions.forEach(({ x, y }) => {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI); // Increase the particle size to 5
      ctx.fillStyle = "red";
      ctx.fill();
      ctx.closePath();
    });
  }

  // Set up event listeners for drawing, erasing, etc.
  canvas.addEventListener("mousedown", onMouseDown);
  canvas.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseup", onMouseUp);
  canvas.addEventListener("mouseout", onMouseUp);

  // Initialize all components
  initializeToolbar(setCurrentTool);
  initializeShapeTools(setCurrentTool);
  initializeTextTool(setCurrentTool);
  initializeColorPicker(setCurrentColor);

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
          originalImageData = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
          );
          redrawCanvas();
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

  // Physics Simulation
  function initializePhysicsSimulation() {
    workerFramework.processCanvasTask(null, "initPhysicsWorld", {
      gravity: 9.81,
      timeStep: 0.016,
    });
  }

  function startSimulation(numberOfParticles) {
    workerFramework.processCanvasTask(null, "addParticles", {
      numberOfParticles,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
    });

    updateSimulation();
  }

  // Add event listener for start simulation button
  document
    .getElementById("startSimulationButton")
    .addEventListener("click", () => startSimulation(1000));

  // Add event listener for reset simulation button
  document
    .getElementById("resetSimulationButton")
    .addEventListener("click", initializePhysicsSimulation);
});
