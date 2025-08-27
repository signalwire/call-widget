import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "CallWidget",
      formats: ["umd"],
      fileName: () => "call-widget-full.min.js",
    },
    rollupOptions: {
      external: [],
    },
    minify: true,
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: false,
  },
  define: {
    "process.env": {},
  },
});