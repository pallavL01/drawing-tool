import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@wasm-filters": "/src/wasm-filters/wasm_filters.js",
      "@wasm-physics": "/src/wasm-physics/wasm_physics.js",
    },
  },
  build: {
    target: "esnext",
    modulePreload: {
      polyfill: true,
    },
  },
  optimizeDeps: {
    exclude: ["@wasm-filters", "@wasm-physics"],
  },
});
