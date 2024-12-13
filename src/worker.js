import initFilters, {
  apply_gaussian_blur,
} from "./wasm-filters/wasm_filters.js";
import initPhysics, { World } from "./wasm-physics/wasm_physics.js";

const WASM_MODULES = {
  filters: {
    init: initFilters,
    path: new URL("./wasm-filters/wasm_filters_bg.wasm", import.meta.url).href,
    initialized: false,
  },
  physics: {
    init: initPhysics,
    path: new URL("./wasm-physics/wasm_physics_bg.wasm", import.meta.url).href,
    initialized: false,
  },
};

let world = null;

// Initialize WASM modules
async function loadWasm() {
  try {
    await Promise.all(
      Object.values(WASM_MODULES).map((module) =>
        module
          .init({ path: module.path })
          .then(() => (module.initialized = true))
      )
    );
    console.log("WASM modules initialized successfully");
  } catch (error) {
    console.error("Error initializing WASM modules:", error);
  }
}

// Image Processing Functions
const filters = {
  blur: (imageData) => {
    const { width, height } = imageData;
    const tempCanvas = new OffscreenCanvas(width, height);
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.putImageData(imageData, 0, 0);
    tempCtx.filter = "blur(5px)";
    tempCtx.drawImage(tempCanvas, 0, 0);
    return tempCtx.getImageData(0, 0, width, height);
  },

  invert: (imageData) => {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 255 - data[i];
      data[i + 1] = 255 - data[i + 1];
      data[i + 2] = 255 - data[i + 2];
    }
    return imageData;
  },

  grayscale: (imageData) => {
    const { data } = imageData;
    for (let i = 0; i < data.length; i += 4) {
      const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      data[i] = data[i + 1] = data[i + 2] = avg;
    }
    return imageData;
  },

  "blur-wasm": (imageData) => {
    const { width, height, data } = imageData;
    const uint8Array = new Uint8Array(data.buffer);
    apply_gaussian_blur(uint8Array, width, height);
    return new ImageData(
      new Uint8ClampedArray(uint8Array.buffer),
      width,
      height
    );
  },
};

// Physics Functions
const physics = {
  initWorld: ({ gravity, timeStep }) => {
    if (!world) {
      world = new World(gravity, timeStep);
      console.log("Physics world initialized");
    }
  },

  addParticles: ({ numberOfParticles, canvasWidth, canvasHeight }) => {
    if (!world) return;

    for (let i = 0; i < numberOfParticles; i++) {
      world.add_particle(
        Math.random() * canvasWidth,
        Math.random() * canvasHeight,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        Math.random() * 2 + 0.5
      );
    }
  },

  updateSimulation: () => {
    if (!world) return [];
    world.update();
    return world.get_particle_positions();
  },
};

// Message Handler
self.onmessage = async ({ data: { task, imageData, payload } }) => {
  if (!Object.values(WASM_MODULES).every((m) => m.initialized)) {
    await loadWasm();
  }

  const tasks = {
    applyFilter: () => {
      const filteredData = filters[payload?.filter]?.(imageData) || imageData;
      self.postMessage({ imageData: filteredData });
    },
    initPhysicsWorld: () => physics.initWorld(payload),
    addParticles: () => physics.addParticles(payload),
    updateSimulation: () => {
      const positions = physics.updateSimulation();
      self.postMessage({ task: "updateCanvas", positions });
    },
  };

  tasks[task]?.() || console.error("Unknown task:", task);
};
