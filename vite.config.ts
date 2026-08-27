import { defineConfig, loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const polyfillPath = path.resolve(__dirname, "src/polyfills/async_hooks.js");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  process.env = { ...process.env, ...env };
  return {
    resolve: {
      alias: [
        { find: /^node:async_hooks$/, replacement: polyfillPath },
        { find: /^async_hooks$/, replacement: polyfillPath },
        { find: /^@tanstack\/react-start$/, replacement: path.resolve(__dirname, "src/lib/tanstack-react-start/index.ts") },
        { find: /^@tanstack\/react-start\/server$/, replacement: path.resolve(__dirname, "src/lib/tanstack-react-start/server.ts") },
        { find: /^@tanstack\/react-start\/server-entry$/, replacement: path.resolve(__dirname, "src/lib/tanstack-react-start/server.ts") },
      ],
      tsconfigPaths: true,
    },
    plugins: [
      tailwindcss(),
      viteReact(),
    ],
  };
});
