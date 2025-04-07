import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      output: [
        {
          entryFileNames: "widget.js",
          dir: "dist",
          format: "iife",
        },
      ],
    },
    minify: true,
    sourcemap: true,
    terserOptions: {
      compress: {
        drop_console: true,
      },
    },
  },
});
