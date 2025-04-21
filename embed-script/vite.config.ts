import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      name: "C2CWidget",
      formats: ["es", "umd"],
      fileName: (format) => `c2c-widget.${format}.js`,
    },
    rollupOptions: {
      external: ["@signalwire/js"],
      output: {
        globals: {
          "@signalwire/js": "SignalWire",
        },
      },
    },
    minify: true,
    sourcemap: true,
  },
});
