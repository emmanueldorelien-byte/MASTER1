// scripts/vercel-output.mjs
// Post-build: genera .vercel/output (Build Output API v3) para Vercel.
//   - static/: assets cliente
//   - functions/render.func/: SSR handler en Node.js 20.x CJS wrapper -> Nitro ESM
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

if (existsSync(OUTPUT_DIR)) rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(STATIC_DIR, { recursive: true });
mkdirSync(RENDER_FUNC, { recursive: true });

// 1. Assets estaticos
if (existsSync(DIST_CLIENT)) {
  for (const entry of readdirSync(DIST_CLIENT)) {
    cpSync(path.join(DIST_CLIENT, entry), path.join(STATIC_DIR, entry), {
      recursive: true,
    });
  }
}

// 2. Copiar dist/server al interior de render.func/server (ESM, no lo ejecutamos directamente)
const RENDER_SERVER = path.join(RENDER_FUNC, "server");
cpSync(DIST_SERVER, RENDER_SERVER, { recursive: true });

// 3. Configuracion Vercel Build Output para render.func (Node.js 20.x - minimalista y estable)
writeFileSync(
  path.join(RENDER_FUNC, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.cjs",
      launcherType: "Nodejs",
      shouldAddHelpers: true,
    },
    null,
    2,
  ) + "\n",
);

// 4. Entry point CJS: Vercel loader llama module.exports = handler.
//    Dentro, importamos dinamicamente el build ESM de Nitro/TanStack Start.
//    Tambien adaptamos Node (req,res) <-> Fetch API (Request/Response) que Nitro usa
//    y proveemos polyfill AsyncLocalStorage si faltara en runtime Vercel.
const indexCjs = `"use strict";
const http = require("node:http");
const { Readable } = require("node:stream");
const path = require("node:path");
const fs = require("node:fs");

// Polyfill AsyncLocalStorage singleton utilizado por TanStack storage context
(function polyfillAsyncLocalStorage() {
  if (typeof globalThis !== "undefined" && globalThis.AsyncLocalStorage) return;
  var STORE_KEY = "__tanstack_als_store__";
  function defaultStore() {
    return { startOptions: {} };
  }
  function BPAsyncLocalStorage() { this[STORE_KEY] = defaultStore(); }
  BPAsyncLocalStorage.prototype.getStore = function () {
    var s = this[STORE_KEY];
    if (!s || typeof s !== "object" || !("startOptions" in s)) {
      s = defaultStore(); this[STORE_KEY] = s;
    }
    return s;
  };
  BPAsyncLocalStorage.prototype.run = function (store, cb) {
    var prev = this[STORE_KEY]; this[STORE_KEY] = store || defaultStore();
    var args = Array.prototype.slice.call(arguments, 2); var res;
    try { res = cb.apply(null, args); }
    finally { if (!res || typeof res.then !== "function") { this[STORE_KEY] = prev; } }
    if (res && typeof res.then === "function") {
      var self = this;
      return res.then(
        function (v) { self[STORE_KEY] = prev; return v; },
        function (e) { self[STORE_KEY] = prev; throw e; }
      );
    }
    return res;
  };
  BPAsyncLocalStorage.prototype.exit = function (cb) {
    var prev = this[STORE_KEY]; this[STORE_KEY] = defaultStore();
    var args = Array.prototype.slice.call(arguments, 1); var res;
    try { res = cb.apply(null, args); }
    finally { if (!res || typeof res.then !== "function") { this[STORE_KEY] = prev; } }
    if (res && typeof res.then === "function") {
      var self = this;
      return res.then(
        function (v) { self[STORE_KEY] = prev; return v; },
        function (e) { self[STORE_KEY] = prev; throw e; }
      );
    }
    return res;
  };
  BPAsyncLocalStorage.prototype.enterWith = function (s) { this[STORE_KEY] = s || defaultStore(); };
  BPAsyncLocalStorage.prototype.disable = function () { this[STORE_KEY] = defaultStore(); };
  try { Object.defineProperty(globalThis, "AsyncLocalStorage", { value: BPAsyncLocalStorage, writable: true, configurable: true }); }
  catch (e) { globalThis.AsyncLocalStorage = BPAsyncLocalStorage; }
  // Singleton esperado por TanStack Start en browser/servidor
  if (!globalThis.__tanstack_start_storage_singleton__) {
    globalThis.__tanstack_start_storage_singleton__ = new BPAsyncLocalStorage();
  }
})();

var nitroAppPromise = null;
function loadNitro() {
  if (nitroAppPromise) return nitroAppPromise;
  nitroAppPromise = Promise.resolve()
    .then(function () {
      return import("./server/server.js");
    })
    .then(function (m) {
      var app = m && (m.default || m);
      if (!app || typeof app.fetch !== "function") {
        throw new Error("[vercel-render] server/server.js no exporta { fetch } - keys: " + Object.keys(m || {}).join(","));
      }
      return app;
    });
  return nitroAppPromise;
}

function fallbackHtml(err) {
  var msg = err && err.message ? String(err.message) : String(err || "Unknown error");
  return \`<!doctype html><html lang=ht><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Erè</title></head><body style="font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:64px auto;padding:0 16px;color:#111"><h1>Paj sa a pa chaje</h1><p style="color:#4b5563">Gen yon pwoblèm ki rive. Eseye rechaje oswa tounen sou paj akèy la.</p><pre style="white-space:pre-wrap;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;font-size:13px">\${msg}\n\${err && err.stack ? String(err.stack) : ""}</pre></body></html>\`;
}

// Adaptador (IncomingMessage -> Web Request)
function toWebRequest(req) {
  var protocol = (req.headers["x-forwarded-proto"] && req.headers["x-forwarded-proto"].split(",")[0].trim()) ||
    (req.socket && req.socket.encrypted ? "https" : "http") || "https";
  var host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  var url = protocol + "://" + host + (req.url || "/");
  var hdrs = new Headers();
  var raw = req.headers;
  Object.keys(raw).forEach(function (k) {
    var v = raw[k];
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(function (x) { hdrs.append(k, String(x)); });
    else hdrs.set(k, String(v));
  });
  var method = (req.method || "GET").toUpperCase();
  var body;
  if (method !== "GET" && method !== "HEAD") {
    body = Readable.toWeb(req);
  }
  var init = { method: method, headers: hdrs };
  if (body) { init.body = body; init.duplex = "half"; }
  return new Request(url, init);
}

async function pipeBodyTo(webResponse, res) {
  if (!webResponse.body) { res.end(); return; }
  var reader = webResponse.body.getReader();
  try {
    while (true) {
      var r = await reader.read();
      if (r.done) break;
      if (r.value && r.value.byteLength) res.write(Buffer.from(r.value));
    }
  } finally {
    try { reader.releaseLock(); } catch (_e) { /* noop */ }
    res.end();
  }
}

async function writeResponse(res, webResponse) {
  var status = webResponse.status || 200;
  var out = {};
  webResponse.headers.forEach(function (v, k) { out[k] = v; });
  res.writeHead(status, out);
  await pipeBodyTo(webResponse, res);
}

function handler(req, res) {
  Promise.resolve()
    .then(function () { return loadNitro(); })
    .then(function (app) {
      var request = toWebRequest(req);
      var env = process.env;
      var ctx = {
        waitUntil: function (p) { try { res.on && res.on("finish", function () { Promise.resolve(p).catch(function () {}); }); } catch (_e) {} },
        passThroughOnException: function () {},
      };
      return app.fetch(request, env, ctx);
    })
    .then(function (resp) { return writeResponse(res, resp); })
    .catch(function (err) {
      console.error("[vercel-render]", err && err.stack || err);
      res.statusCode = 500;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(fallbackHtml(err));
    });
}

module.exports = handler;
module.exports.default = handler;
`;
writeFileSync(path.join(RENDER_FUNC, "index.cjs"), indexCjs);

// 5. config.json Build Output API v3 (orden importante: headers staticos -> filesystem -> SSR fallback)
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
