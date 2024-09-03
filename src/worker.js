// Import and initialize the Wasm modules
import initFilters, {
  apply_gaussian_blur,
} from "./wasm-filters/wasm_filters.js";
import initPhysics, { World } from "./wasm-physics/wasm_physics.js";

let wasmFiltersInitialized = false;
let wasmPhysicsInitialized = false;
let world = null;

// Initialize the WebAssembly modules
async function loadWasm() {
  try {
    await Promise.all([
      initFilters({
        path: new URL("./wasm-filters/wasm_filters_bg.wasm", import.meta.url)
          .href,
      }),
      initPhysics({
        path: new URL("./wasm-physics/wasm_physics_bg.wasm", import.meta.url)
          .href,
      }),
    ]);
    wasmFiltersInitialized = true;
    wasmPhysicsInitialized = true;
    console.log("WASM modules initialized successfully");
  } catch (error) {
    console.error("Error initializing WASM modules:", error);
  }
}

self.onmessage = async function (event) {
  const { task, imageData, payload } = event.data;

  if (!wasmFiltersInitialized || !wasmPhysicsInitialized) {
    await loadWasm();
  }

  switch (task) {
    case "applyFilter":
      handleApplyFilter(imageData, payload);
      break;
    case "initPhysicsWorld":
      handleInitPhysicsWorld(payload);
      break;
    case "addParticles":
      handleAddParticles(payload);
      break;
    case "updateSimulation":
      handleUpdateSimulation();
      break;
    default:
      console.error("Unknown task:", task);
  }
};

function handleApplyFilter(imageData, payload) {
  const filter = payload?.filter;
  const filteredData =
    filter === "blur-wasm"
      ? applyGaussianBlurWasm(imageData)
      : applyFilter(imageData, filter);
  self.postMessage({ imageData: filteredData });
}

function handleInitPhysicsWorld(payload) {
  if (payload) {
    console.log("Initializing physics world with:", payload);
    initializePhysicsWorld(payload.gravity, payload.timeStep);
  } else {
    console.error("initPhysicsWorld task received without a valid payload");
  }
}

function handleAddParticles(payload) {
  if (payload) {
    console.log("Adding particles:", payload.numberOfParticles);
    addParticles(
      payload.numberOfParticles,
      payload.canvasWidth,
      payload.canvasHeight
    );
  } else {
    console.error("addParticles task received without a valid payload");
  }
}

function handleUpdateSimulation() {
  const positions = updatePhysicsSimulation();
  console.log("Updating simulation, positions:", positions);
  self.postMessage({ task: "updateCanvas", positions });
}

// Image Processing Functions
function applyFilter(imageData, filter) {
  switch (filter) {
    case "blur":
      return blurFilter(imageData);
    case "invert":
      return invertFilter(imageData);
    case "grayscale":
      return grayscaleFilter(imageData);
    default:
      return imageData;
  }
}

function blurFilter(imageData) {
  const radius = 5; // Example blur radius
  const { width, height } = imageData;
  const tempCanvas = new OffscreenCanvas(width, height);
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.putImageData(imageData, 0, 0);
  tempCtx.filter = `blur(${radius}px)`;
  tempCtx.drawImage(tempCanvas, 0, 0);

  return tempCtx.getImageData(0, 0, width, height);
}

function invertFilter(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]; // Red
    data[i + 1] = 255 - data[i + 1]; // Green
    data[i + 2] = 255 - data[i + 2]; // Blue
  }
  return imageData;
}

function grayscaleFilter(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg; // Red
    data[i + 1] = avg; // Green
    data[i + 2] = avg; // Blue
    data[i + 3] = 255; // Alpha
  }
  return imageData;
}

function applyGaussianBlurWasm(imageData) {
  const { width, height, data } = imageData;
  const uint8Array = new Uint8Array(data.buffer);

  apply_gaussian_blur(uint8Array, width, height);

  return new ImageData(new Uint8ClampedArray(uint8Array.buffer), width, height);
}

// Physics Simulation Functions
function createPhysicsWorld(gravity, timeStep) {
  console.log("Creating new physics world");
  return new World(gravity, timeStep);
}

function initializePhysicsWorld(gravity, timeStep) {
  if (world === null) {
    world = createPhysicsWorld(gravity, timeStep);
  }
}

function addParticles(numberOfParticles, canvasWidth, canvasHeight) {
  if (world !== null) {
    console.log(`Adding ${numberOfParticles} particles`);
    for (let i = 0; i < numberOfParticles; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const vx = (Math.random() - 0.5) * 2;
      const vy = (Math.random() - 0.5) * 2;
      const mass = Math.random() * 2 + 0.5;
      world.add_particle(x, y, vx, vy, mass);
    }
    console.log("Particles added to world.");
  }
}

function updatePhysicsSimulation() {
  if (world !== null) {
    console.log("Updating physics world");
    world.update();
    const positions = world.get_particle_positions();
    console.log("Particle positions:", positions);
    return positions;
  }
  return [];
}
