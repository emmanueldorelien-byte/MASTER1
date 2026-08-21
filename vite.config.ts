import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const polyfillPath = path.resolve(__dirname, "src/polyfills/async_hooks.js");

const isVercel = Boolean(process.env["VERCEL"]);

export default defineConfig({
  vite: {
    resolve: {
      alias: [
        { find: /^node:async_hooks$/, replacement: polyfillPath },
        { find: /^async_hooks$/, replacement: polyfillPath },
      ],
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: isVercel ? "vercel" : "node",
  },
});
