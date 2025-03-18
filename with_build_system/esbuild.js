const esbuild = require("esbuild");
const dotenv = require("dotenv");

// Load environment variables
const env = dotenv.config().parsed || {};

// Convert env variables to esbuild `define` format
const define = Object.fromEntries(
  Object.entries(env).map(([key, value]) => [
    `process.env.${key}`,
    JSON.stringify(value),
  ])
);

esbuild
  .build({
    entryPoints: ["src/index.ts"],
    outfile: "dist/bundle.js",
    bundle: true,
    minify: true,
    sourcemap: false,
    target: "esnext",
    define, // Inject environment variables
  })
  .catch(() => process.exit(1));
