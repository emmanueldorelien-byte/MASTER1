import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const polyfillPath = path.resolve(__dirname, "src/polyfills/async_hooks.js");

const nitroPreset = process.env.NITRO_PRESET;
const isVercel =
  nitroPreset === "vercel" ||
  (nitroPreset === undefined &&
    Boolean(process.env.VERCEL || process.env.VERCEL_ENV));

const vercelPresetRuntimeConfig = {
  // Fuerza a Nitro a BUNDLEAR todas las deps runtime (react, etc.)
  // inline en el chunk del servidor, evitando missing packages.
  // https://nitro.build/deploy/providers/vercel
  rollupConfig: {
    external: [],
  },
};

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
        preset: isVercel ? "node-server" : nitroPreset || undefined,
      },
    }),
    nitro({
      config: {
        preset: isVercel ? "vercel" : nitroPreset || "node-server",
        // Bundle inline de TODAS las dependencias runtime para evitar
        // "Cannot find package 'react'" cuando Vercel ejecuta SSR.
        // No hay external: todo se incluye en .output/server/chunks/.
        rollupConfig: {
          external: [],
        },
        vercel: {
          // Config Vercel Build Output API v3 + maximum compatibility
          shouldAddHelpers: false,
        },
      },
    }),
    viteReact(),
  ],
});
