// scripts/vercel-output.mjs
// Post-build script: genera .vercel/output (Vercel Build Output API v3)
// a partir del build de Vite + TanStack Start (Nitro) sin depender del preset.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const DIST_CLIENT = path.join(projectRoot, "dist", "client");
const DIST_SERVER = path.join(projectRoot, "dist", "server");
const OUTPUT_DIR = path.join(projectRoot, ".vercel", "output");
const FUNCTIONS_DIR = path.join(OUTPUT_DIR, "functions");
const STATIC_DIR = path.join(OUTPUT_DIR, "static");
const RENDER_FUNC = path.join(FUNCTIONS_DIR, "render.func");

// 1. Limpiar output previo
if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(STATIC_DIR, { recursive: true });
mkdirSync(RENDER_FUNC, { recursive: true });

// 2. Copiar assets estaticos (dist/client -> static/)
if (existsSync(DIST_CLIENT)) {
  for (const entry of readdirSync(DIST_CLIENT)) {
    cpSync(path.join(DIST_CLIENT, entry), path.join(STATIC_DIR, entry), {
      recursive: true,
    });
  }
}

// 3. Copiar el build del servidor al interior de render.func
const RENDER_SERVER = path.join(RENDER_FUNC, "server");
cpSync(DIST_SERVER, RENDER_SERVER, { recursive: true });

// 4. Escribir el entry point de la funcion Vercel (Node.js 20.x)
//    Convierte (req, res) de Vercel -> Request/Response de Fetch API que Nitro espera.
const vcConfigJson = {
  runtime: "nodejs20.x",
  handler: "index.js",
  launcherType: "Nodejs",
  shouldAddHelpers: true,
};
writeFileSync(
  path.join(RENDER_FUNC, ".vc-config.json"),
  JSON.stringify(vcConfigJson, null, 2) + "\n",
);

writeFileSync(
  path.join(RENDER_FUNC, "package.json"),
  JSON.stringify(
    {
      name: "render-func",
      version: "1.0.0",
      private: true,
      type: "module",
    },
    null,
    2,
  ) + "\n",
);

const indexJs = `// render.func/index.js — Vercel Node.js entry -> Nitro fetch adapter
import http from "node:http";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverMod = await import("./server/server.js");
const nitroApp = serverMod.default || serverMod;

function toWebRequest(req) {
  const protocol =
    req.headers["x-forwarded-proto"] ||
    (req.socket && req.socket.encrypted ? "https" : "http") ||
    "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const url = protocol + "://" + host + (req.url || "/");

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else headers.set(key, String(value));
  }

  const method = req.method || "GET";
  let body;
  if (method !== "GET" && method !== "HEAD") {
    body = Readable.toWeb(req);
  }
  return new Request(url, { method, headers, body, duplex: body ? "half" : void 0 });
}

async function writeWebResponse(res, webResponse) {
  const { status, headers } = webResponse;
  const resHeaders = {};
  for (const [k, v] of headers.entries()) resHeaders[k] = v;
  res.writeHead(status, resHeaders);
  if (!webResponse.body) { res.end(); return; }
  const reader = webResponse.body.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value && value.length) res.write(Buffer.from(value));
    }
  } finally {
    try { reader.releaseLock(); } catch {}
    res.end();
  }
}

export default async function handler(req, res) {
  try {
    const request = toWebRequest(req);
    const response = await nitroApp.fetch(request, process.env, {});
    await writeWebResponse(res, response);
  } catch (err) {
    console.error("[vercel-render]", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/html; charset=utf-8");
    const fallback = serverMod.t ? serverMod.t() :
      \`<!doctype html><html><head><meta charset=utf-8><title>Server Error</title></head><body><h1>Server Error</h1><p>\${String(err && err.message || err)}</p></body></html>\`;
    res.end(fallback);
  }
}
`;
writeFileSync(path.join(RENDER_FUNC, "index.js"), indexJs);

// 5. Escribir config.json de Vercel Build Output API
//    - Primero assets estaticos (cache largo)
//    - Luego enviar todo lo demas a la SSR function /render
const configJson = {
  version: 3,
  routes: [
    {
      src: "^/assets/(.*)$",
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
      },
      continue: true,
    },
    {
      handle: "filesystem",
    },
    {
      src: "/(.*)",
      dest: "/render",
    },
  ],
};
writeFileSync(
  path.join(OUTPUT_DIR, "config.json"),
  JSON.stringify(configJson, null, 2) + "\n",
);

console.log("[vercel-output] Built .vercel/output/ ✓");
console.log("  - static/: " + listSize(STATIC_DIR) + " files");
console.log("  - functions/render.func/: " + listSize(RENDER_FUNC) + " files");

function listSize(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) n += listSize(path.join(dir, entry.name));
    else n++;
  }
  return n;
}
