import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const polyfillPath = path.resolve(__dirname, "src/polyfills/async_hooks.js");

const nitroPreset = process.env.NITRO_PRESET;
const isVercel =
  nitroPreset === "vercel" ||
  (nitroPreset === undefined &&
    Boolean(process.env.VERCEL || process.env.VERCEL_ENV));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^node:async_hooks$/, replacement: polyfillPath },
      { find: /^async_hooks$/, replacement: polyfillPath },
    ],
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      server: {
        entry: "server",
        preset: isVercel ? "vercel" : nitroPreset || undefined,
      },
    }),
    viteReact(),
  ],
});
