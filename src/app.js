import { initializeToolbar } from "./components/toolbar.js";
import { initializeShapeTools } from "./components/shapeTools.js";
import { initializeTextTool } from "./components/textTool.js";
import { initializeColorPicker } from "./components/colorPicker.js";
import { CanvasWorkerFramework } from "./canvasWorkerFramework.js";
import init, { apply_gaussian_blur } from "./wasm-filters/wasm_filters.js";
import initPhysics, { World } from "./wasm-physics/wasm_physics.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize WASM modules
    await Promise.all([
      init().catch((e) => console.error("Error initializing filters WASM:", e)),
      initPhysics().catch((e) =>
        console.error("Error initializing physics WASM:", e)
      ),
    ]);
    console.log("WASM modules initialized successfully");

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

    let physicsWorld = null;
    let isSimulationRunning = false;
    let animationFrameId = null;

    // Add UI controls for environmental effects
    const controls = {
      gravity: 9.81,
      wind: 0,
      turbulence: 0,
      temperature: 20,
    };

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
        if (
          shape &&
          (currentTool === "rectangle" || currentTool === "circle")
        ) {
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

    function initializePhysicsSimulation() {
      if (physicsWorld) {
        physicsWorld.free();
      }
      physicsWorld = World.new(9.81, 0.016);
      isSimulationRunning = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    }

    function startSimulation(numberOfParticles) {
      if (!physicsWorld) {
        initializePhysicsSimulation();
      }

      const particleTypes = ["heavy", "light", "bouncy"];

      for (let i = 0; i < numberOfParticles; i++) {
        const type =
          particleTypes[Math.floor(Math.random() * particleTypes.length)];
        const mass = type === "heavy" ? 5.0 : type === "light" ? 0.5 : 1.0;
        const bounce = type === "bouncy" ? 0.9 : 0.3;

        physicsWorld.add_particle(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          mass,
          bounce
        );
      }

      isSimulationRunning = true;
      updateSimulation();
    }

    function updateSimulation() {
      if (!isSimulationRunning) return;

      physicsWorld.update();
      const positions = physicsWorld.get_particle_positions();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (uploadedImage) {
        ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
      }

      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        const type = positions[i + 2];

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = type === 0 ? "red" : type === 1 ? "blue" : "green";
        ctx.fill();
        ctx.closePath();
      }

      animationFrameId = requestAnimationFrame(updateSimulation);
    }

    function addParticleEmitter(x, y, rate, lifetime) {
      setInterval(() => {
        if (isSimulationRunning) {
          physicsWorld.add_particle(
            x,
            y,
            (Math.random() - 0.5) * 50,
            -Math.random() * 200,
            1.0
          );
        }
      }, rate);

      setTimeout(() => clearInterval(emitterId), lifetime);
    }

    function updateEnvironment() {
      physicsWorld.set_gravity(controls.gravity);
      physicsWorld.set_wind(controls.wind);
      physicsWorld.add_turbulence(controls.turbulence);
      physicsWorld.set_temperature(controls.temperature);
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
        if (filterName === "blur-wasm") {
          const blendFactor = parseFloat(
            document.getElementById("blurIntensity").value
          );
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Call the WASM function with blend factor
          apply_gaussian_blur(
            imageData.data,
            canvas.width,
            canvas.height,
            blendFactor
          );

          ctx.putImageData(imageData, 0, 0);
        } else if (filterName) {
          applyFilter(filterName);
        }
      });

    // Handle image upload
    document
      .getElementById("imageUpload")
      .addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
              try {
                uploadedImage = img;
                ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
                originalImageData = ctx.getImageData(
                  0,
                  0,
                  canvas.width,
                  canvas.height
                );
                console.log("Image loaded successfully");
              } catch (error) {
                console.error("Error loading image:", error);
              }
            };
            img.onerror = function (error) {
              console.error("Error loading image:", error);
            };
            img.src = e.target.result;
          };
          reader.onerror = function (error) {
            console.error("Error reading file:", error);
          };
          reader.readAsDataURL(file);
        }
      });

    // Add event listener for clear canvas button
    document
      .getElementById("clearCanvasButton")
      .addEventListener("click", clearCanvas);

    // Add event listener for start simulation button
    document
      .getElementById("startSimulationButton")
      .addEventListener("click", () => {
        startSimulation(100);
      });

    // Add event listener for reset simulation button
    document
      .getElementById("resetSimulationButton")
      .addEventListener("click", () => {
        initializePhysicsSimulation();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (uploadedImage) {
          ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
        }
      });

    // Add event listener for blur intensity slider
    const blurSlider = document.getElementById("blurIntensity");
    blurSlider.addEventListener("input", (event) => {
      // If blur is currently active, reapply it with new intensity
      if (document.getElementById("filterDropdown").value === "blur-wasm") {
        const blendFactor = parseFloat(event.target.value);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        apply_gaussian_blur(
          imageData.data,
          canvas.width,
          canvas.height,
          blendFactor
        );

        ctx.putImageData(imageData, 0, 0);
      }

      document.getElementById("blurValue").textContent = event.target.value;
    });

    // Clean up physics world when page unloads
    window.addEventListener("unload", () => {
      if (physicsWorld) {
        physicsWorld.free();
      }
    });

    // Add mouse interaction with particles
    canvas.addEventListener("mousemove", (event) => {
      if (isSimulationRunning) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        physicsWorld.add_force_field(x, y, 50.0, 100.0); // Attract/repel particles
      }
    });

    // Add after your existing event listeners
    document
      .getElementById("gravityControl")
      .addEventListener("input", (event) => {
        const gravity = parseFloat(event.target.value);
        controls.gravity = gravity;
        if (physicsWorld) {
          physicsWorld.set_gravity(gravity);
        }
      });

    document
      .getElementById("windControl")
      .addEventListener("input", (event) => {
        const wind = parseFloat(event.target.value);
        controls.wind = wind;
        if (physicsWorld) {
          physicsWorld.set_wind(wind);
        }
      });

    // Add event listeners for the filter buttons
    document
      .getElementById("filterDropdown")
      .addEventListener("change", (event) => {
        const filterName = event.target.value;
        console.log("Applying filter:", filterName); // Debug log

        if (!canvas.getContext) {
          console.error("Canvas context not available");
          return;
        }

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        if (filterName === "blur-wasm") {
          try {
            const blendFactor = parseFloat(
              document.getElementById("blurIntensity").value
            );
            console.log("Applying WASM blur with blend factor:", blendFactor); // Debug log

            apply_gaussian_blur(
              imageData.data,
              canvas.width,
              canvas.height,
              blendFactor
            );
            ctx.putImageData(imageData, 0, 0);
          } catch (error) {
            console.error("Error applying WASM blur:", error);
          }
        } else if (filterName === "reset") {
          if (originalImageData) {
            ctx.putImageData(originalImageData, 0, 0);
          }
        } else {
          try {
            workerFramework
              .processCanvasTask(imageData, "applyFilter", {
                filter: filterName,
              })
              .then((filteredData) => {
                ctx.putImageData(filteredData, 0, 0);
              })
              .catch((error) => {
                console.error("Error applying filter:", error);
              });
          } catch (error) {
            console.error("Error processing filter task:", error);
          }
        }
      });
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});
