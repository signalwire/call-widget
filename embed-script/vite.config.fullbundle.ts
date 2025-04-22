import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "C2CWidget",
      formats: ["umd"],
      fileName: () => "c2c-widget-full.umd.js",
    },
    rollupOptions: {
      external: [],
    },
    minify: true,
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: false,
  },
});
