import { initializeToolbar } from "./components/toolbar.js";
import { initializeShapeTools } from "./components/shapeTools.js";
import { initializeTextTool } from "./components/textTool.js";
import { initializeColorPicker } from "./components/colorPicker.js";
import { CanvasWorkerFramework } from "./canvasWorkerFramework.js";
import initFilters, {
  apply_gaussian_blur,
} from "./wasm-filters/wasm_filters.js";
import initPhysics, { World } from "./wasm-physics/wasm_physics.js";

const initializeApp = async () => {
  try {
    // Initialize WASM modules concurrently
    await Promise.all([initFilters(), initPhysics()]).catch((e) =>
      console.error("WASM initialization error:", e)
    );

    const state = {
      currentTool: "brush",
      currentColor: "#000000",
      uploadedImage: null,
      originalImageData: null,
      isDrawing: false,
      shapes: [],
      currentFreeform: null,
      draggingShape: null,
      offset: { x: 0, y: 0 },
      physicsWorld: null,
      isSimulationRunning: false,
      animationFrameId: null,
      environmentControls: {
        gravity: 9.81,
        wind: 0,
        turbulence: 0,
        temperature: 20,
      },
    };

    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const workerFramework = new CanvasWorkerFramework("./worker.js", 4);

    // Set canvas size to match display size
    function resizeCanvas() {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }
    }

    // Call once at start and add resize listener
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const drawingHandlers = {
      startDrawing: (event) => {
        state.isDrawing = true;
        const { offsetX, offsetY } = event;

        if (["rectangle", "circle"].includes(state.currentTool)) {
          state.shapes.push({
            type: state.currentTool,
            x: offsetX,
            y: offsetY,
            width: 0,
            height: 0,
            radius: 0,
            color: state.currentColor,
          });
        } else if (["brush", "eraser"].includes(state.currentTool)) {
          state.currentFreeform = {
            type: "freeform",
            points: [{ x: offsetX, y: offsetY }],
            color:
              state.currentTool === "eraser" ? "#FFFFFF" : state.currentColor,
            lineWidth: 5,
          };
          state.shapes.push(state.currentFreeform);
        }
      },

      draw: (event) => {
        if (!state.isDrawing) return;

        const { offsetX, offsetY } = event;
        const currentShape = state.shapes[state.shapes.length - 1];

        if (["rectangle", "circle"].includes(state.currentTool)) {
          if (state.currentTool === "rectangle") {
            currentShape.width = offsetX - currentShape.x;
            currentShape.height = offsetY - currentShape.y;
          } else {
            currentShape.radius = Math.hypot(
              offsetX - currentShape.x,
              offsetY - currentShape.y
            );
          }
        } else if (["brush", "eraser"].includes(state.currentTool)) {
          state.currentFreeform.points.push({ x: offsetX, y: offsetY });
        }

        redrawCanvas();
      },
    };

    const redrawCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (state.uploadedImage) {
        ctx.drawImage(state.uploadedImage, 0, 0, canvas.width, canvas.height);
      }

      state.shapes.forEach((shape) => {
        ctx.beginPath();
        ctx.fillStyle = shape.color;
        ctx.strokeStyle = shape.color;

        switch (shape.type) {
          case "rectangle":
            ctx.rect(shape.x, shape.y, shape.width, shape.height);
            ctx.stroke();
            break;

          case "circle":
            ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;

          case "freeform":
            if (shape.points.length > 0) {
              ctx.moveTo(shape.points[0].x, shape.points[0].y);
              shape.points.forEach((point) => {
                ctx.lineTo(point.x, point.y);
              });
              ctx.lineWidth = shape.lineWidth || 5;
              ctx.stroke();
            }
            break;

          case "text":
            if (shape.text) {
              ctx.font = `${shape.fontSize || 16}px Arial`;
              ctx.fillText(shape.text, shape.x, shape.y);
            }
            break;
        }

        ctx.closePath();
      });
    };

    // Event Listeners
    canvas.addEventListener("mousedown", drawingHandlers.startDrawing);
    canvas.addEventListener("mousemove", drawingHandlers.draw);
    canvas.addEventListener("mouseup", () => (state.isDrawing = false));
    canvas.addEventListener("mouseout", () => (state.isDrawing = false));

    // Initialize Components
    initializeToolbar((tool) => (state.currentTool = tool));
    initializeShapeTools((tool) => (state.currentTool = tool));
    initializeTextTool((tool) => (state.currentTool = tool));
    initializeColorPicker((color) => (state.currentColor = color));

    // Filter handling
    const handleFilter = async (filterName) => {
      if (!state.originalImageData) {
        state.originalImageData = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
      }

      if (filterName === "reset") {
        if (state.originalImageData) {
          ctx.putImageData(state.originalImageData, 0, 0);
          return;
        }
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if (filterName === "blur-wasm") {
        const blendFactor = parseFloat(
          document.getElementById("blurIntensity").value
        );
        apply_gaussian_blur(
          imageData.data,
          canvas.width,
          canvas.height,
          blendFactor
        );
        ctx.putImageData(imageData, 0, 0);
      } else {
        const filteredData = await workerFramework.processCanvasTask(
          imageData,
          "applyFilter",
          { filter: filterName }
        );
        ctx.putImageData(filteredData, 0, 0);
      }
    };

    document
      .getElementById("filterDropdown")
      .addEventListener("change", (e) => handleFilter(e.target.value));

    // Clean up
    window.addEventListener("unload", () => {
      if (state.physicsWorld) state.physicsWorld.free();
    });

    // Add these physics methods after redrawCanvas
    const physics = {
      initialize: () => {
        if (state.physicsWorld) {
          state.physicsWorld.free();
        }
        // Pass canvas dimensions to the physics world
        state.physicsWorld = World.new(
          state.environmentControls.gravity,
          0.016 // timestep
        );

        // Set the canvas boundaries in the physics world
        state.physicsWorld.set_boundaries(0, 0, canvas.width, canvas.height);

        state.isSimulationRunning = false;
        if (state.animationFrameId) {
          cancelAnimationFrame(state.animationFrameId);
        }
        state.particles = [];
      },

      startSimulation: (numberOfParticles) => {
        if (!state.physicsWorld) {
          physics.initialize();
        }

        // Add particles within canvas bounds
        for (let i = 0; i < numberOfParticles; i++) {
          const x = canvas.width * 0.5 + (Math.random() - 0.5) * 100; // Center horizontally
          const y = canvas.height * 0.3; // Start from upper third

          state.particles.push({
            color: physics.getRandomColor(),
            index: state.particles.length,
          });

          state.physicsWorld.add_particle(
            x,
            y,
            (Math.random() - 0.5) * 100, // Random horizontal velocity
            (Math.random() - 0.5) * 100, // Random vertical velocity
            1.0, // mass
            0.7 // bounce factor
          );
        }

        state.isSimulationRunning = true;
        physics.update();
      },

      update: () => {
        if (!state.isSimulationRunning) return;

        state.physicsWorld.update();
        const positions = state.physicsWorld.get_particle_positions();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (state.uploadedImage) {
          ctx.drawImage(state.uploadedImage, 0, 0, canvas.width, canvas.height);
        }

        // Draw particles with their stored colors
        for (let i = 0; i < positions.length; i += 2) {
          const particleIndex = Math.floor(i / 2);
          ctx.beginPath();
          ctx.arc(positions[i], positions[i + 1], 3, 0, 2 * Math.PI);

          // Use stored color or generate new one if not exists
          const particleColor =
            state.particles && state.particles[particleIndex]
              ? state.particles[particleIndex].color
              : physics.getRandomColor();

          ctx.fillStyle = particleColor;
          ctx.fill();
          ctx.closePath();
        }

        state.animationFrameId = requestAnimationFrame(physics.update);
      },

      addEmitter: (x, y, rate, duration) => {
        if (!state.isSimulationRunning) return;

        let particlesEmitted = 0;
        // Add a particles array to store colors if not exists
        if (!state.particles) {
          state.particles = [];
        }

        const emitInterval = setInterval(() => {
          if (!state.isSimulationRunning || particlesEmitted >= 100) {
            clearInterval(emitInterval);
            return;
          }

          // Store the particle color when creating a new particle
          state.particles.push({
            color: physics.getRandomColor(),
            index: state.particles.length,
          });

          state.physicsWorld.add_particle(
            x,
            y,
            (Math.random() - 0.5) * 50,
            -150 - Math.random() * 50,
            1.0,
            0.7
          );
          particlesEmitted++;
        }, rate);

        if (duration) {
          setTimeout(() => clearInterval(emitInterval), duration);
        }
      },

      toggleAttractor: (enabled) => {
        state.attractorEnabled = enabled;
        if (enabled) {
          canvas.addEventListener("mousemove", physics.updateAttractor);
        } else {
          canvas.removeEventListener("mousemove", physics.updateAttractor);
        }
      },

      updateAttractor: (event) => {
        if (!state.physicsWorld || !state.attractorEnabled) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Add force field at mouse position
        state.physicsWorld.add_force_field(x, y, 500, 100);
      },

      // Add this to the physics object
      getRandomColor: () => {
        const colors = [
          "#FF6B6B", // red
          "#4ECDC4", // turquoise
          "#45B7D1", // blue
          "#96CEB4", // green
          "#FFEEAD", // yellow
          "#FF9999", // pink
          "#D4A5A5", // rose
          "#9370DB", // purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    };

    // Add event listeners for simulation buttons
    document
      .getElementById("startSimulationButton")
      .addEventListener("click", () => physics.startSimulation(100));

    document
      .getElementById("resetSimulationButton")
      .addEventListener("click", physics.initialize);

    // Add after your existing event listeners
    document
      .getElementById("gravityControl")
      .addEventListener("input", (event) => {
        const gravity = parseFloat(event.target.value);
        state.environmentControls.gravity = gravity;
        if (state.physicsWorld) {
          state.physicsWorld.set_gravity(gravity);
          updateEnvironment();
        }
      });

    document
      .getElementById("windControl")
      .addEventListener("input", (event) => {
        const wind = parseFloat(event.target.value);
        state.environmentControls.wind = wind;
        if (state.physicsWorld) {
          state.physicsWorld.set_wind(wind);
          updateEnvironment();
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
          if (state.originalImageData) {
            ctx.putImageData(state.originalImageData, 0, 0);
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

    document
      .getElementById("imageUpload")
      .addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const img = new Image();
            img.onload = function () {
              // Calculate dimensions maintaining aspect ratio
              let width = canvas.width;
              let height = canvas.height;
              const ratio = Math.min(width / img.width, height / img.height);
              width = img.width * ratio;
              height = img.height * ratio;

              // Center the image
              const x = (canvas.width - width) / 2;
              const y = (canvas.height - height) / 2;

              try {
                state.uploadedImage = img;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(state.uploadedImage, x, y, width, height);
                state.originalImageData = ctx.getImageData(
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

    // Add event listener for the emitter button
    document
      .getElementById("addEmitterButton")
      .addEventListener("click", () => {
        if (isSimulationRunning) {
          addParticleEmitter(
            canvas.width / 2, // center x
            canvas.height, // bottom y
            100, // emit every 100ms
            5000 // run for 5 seconds
          );
        }
      });

    // Add emitter button
    document
      .getElementById("addEmitterButton")
      .addEventListener("click", () => {
        if (state.isSimulationRunning) {
          physics.addEmitter(
            canvas.width / 2, // x position
            canvas.height, // y position
            100, // emit rate (ms)
            5000 // duration (ms)
          );
        }
      });

    // Add attractor toggle
    document
      .getElementById("toggleAttractorButton")
      .addEventListener("click", (event) => {
        const isEnabled = event.target.classList.toggle("active");
        physics.toggleAttractor(isEnabled);
      });

    // Add clear canvas button handler
    document
      .getElementById("clearCanvasButton")
      .addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        state.shapes = [];
        state.uploadedImage = null;
        state.originalImageData = null;
        state.currentFreeform = null;
      });

    // Update the physics update method to include new state
    physics.update = () => {
      if (!state.isSimulationRunning) return;

      state.physicsWorld.update();
      const positions = state.physicsWorld.get_particle_positions();

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (state.uploadedImage) {
        ctx.drawImage(state.uploadedImage, 0, 0, canvas.width, canvas.height);
      }

      // Draw particles with their stored colors
      for (let i = 0; i < positions.length; i += 2) {
        const particleIndex = Math.floor(i / 2);
        ctx.beginPath();
        ctx.arc(positions[i], positions[i + 1], 3, 0, 2 * Math.PI);

        // Use stored color or generate new one if not exists
        const particleColor =
          state.particles && state.particles[particleIndex]
            ? state.particles[particleIndex].color
            : physics.getRandomColor();

        ctx.fillStyle = particleColor;
        ctx.fill();
        ctx.closePath();
      }

      state.animationFrameId = requestAnimationFrame(physics.update);
    };

    // Add to your HTML:
    /*
    <div class="controls">
      <input type="range" id="gravityControl" min="-20" max="20" value="9.81" step="0.1">
      <input type="range" id="windControl" min="-50" max="50" value="0" step="1">
      <button id="addEmitterButton">Add Emitter</button>
      <button id="toggleAttractorButton">Toggle Attractor</button>
    </div>
    */

    // Clean up
    window.addEventListener("unload", () => {
      if (state.physicsWorld) {
        state.physicsWorld.free();
      }
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
      }
      window.removeEventListener("resize", resizeCanvas);
    });
  } catch (error) {
    console.error("Application initialization error:", error);
  }
};

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize WASM modules
    await Promise.all([
      initFilters().catch((e) =>
        console.error("Error initializing filters WASM:", e)
      ),
      initPhysics().catch((e) =>
        console.error("Error initializing physics WASM:", e)
      ),
    ]);
    console.log("WASM modules initialized successfully");

    initializeApp();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Add this near other event listeners
document.getElementById("blurIntensity").addEventListener("input", (event) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const blendFactor = parseFloat(event.target.value);

  try {
    apply_gaussian_blur(
      imageData.data,
      canvas.width,
      canvas.height,
      blendFactor
    );
    ctx.putImageData(imageData, 0, 0);
  } catch (error) {
    console.error("Error applying blur:", error);
  }
});
