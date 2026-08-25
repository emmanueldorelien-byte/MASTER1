// scripts/vercel-output.mjs
// Genera .vercel/output (Build Output API v3) para Vercel.
//  - static/: assets cliente
//  - functions/render.func/: SSR handler (Node.js 20.x CJS entry, doble firma: (req,res) + (event,context))
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

if (existsSync(DIST_CLIENT)) {
  for (const entry of readdirSync(DIST_CLIENT)) {
    cpSync(path.join(DIST_CLIENT, entry), path.join(STATIC_DIR, entry), { recursive: true });
  }
}
const RENDER_SERVER = path.join(RENDER_FUNC, "server");
cpSync(DIST_SERVER, RENDER_SERVER, { recursive: true });

// Formato simple y estable: runtime nodejs20.x, handler index.cjs, helpers desactivados
// para evitar que Vercel cambie la firma del handler.
writeFileSync(
  path.join(RENDER_FUNC, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.cjs",
      shouldAddHelpers: false,
    },
    null,
    2,
  ) + "\n",
);

// index.cjs — entry CJS doble firma (req,res / event,context) con stack traces visibles.
const indexCjs = `"use strict";
const { Readable } = require("node:stream");

(function polyfillAsyncLocalStorage() {
  if (typeof globalThis !== "undefined" && globalThis.AsyncLocalStorage) return;
  var STORE_KEY = "__tanstack_als_store__";
  function defaultStore() { return { startOptions: {} }; }
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
      return res.then(function(v){ self[STORE_KEY] = prev; return v; }, function(e){ self[STORE_KEY] = prev; throw e; });
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
      return res.then(function(v){ self[STORE_KEY] = prev; return v; }, function(e){ self[STORE_KEY] = prev; throw e; });
    }
    return res;
  };
  BPAsyncLocalStorage.prototype.enterWith = function (s) { this[STORE_KEY] = s || defaultStore(); };
  BPAsyncLocalStorage.prototype.disable = function () { this[STORE_KEY] = defaultStore(); };
  try { Object.defineProperty(globalThis, "AsyncLocalStorage", { value: BPAsyncLocalStorage, writable: true, configurable: true }); }
  catch (e) { globalThis.AsyncLocalStorage = BPAsyncLocalStorage; }
  if (!globalThis.__tanstack_start_storage_singleton__) {
    globalThis.__tanstack_start_storage_singleton__ = new BPAsyncLocalStorage();
  }
})();

function envReport() {
  if (typeof process === "undefined" || !process.env) return "(no process.env)";
  var keys = Object.keys(process.env).filter(function (k) {
    return /SUPABASE|VERCEL|NODE|PORT|URL|HOST|DATABASE|JWT|SECRET|KEY|AUTH|SMTP/i.test(k);
  }).sort().map(function (k) {
    var v = process.env[k];
    return k + "=" + (v ? ("✓ set (" + String(v).length + " chars)") : "(empty)");
  });
  return keys.length ? keys.join("\\n") : "(no matching env keys)";
}

function fullDescribe(err) {
  if (err instanceof Error) return err.stack || (err.name + ": " + err.message);
  try { return JSON.stringify(err); } catch (_) { return String(err); }
}

var nitroAppPromise = null;
function loadNitro() {
  if (nitroAppPromise) return nitroAppPromise;
  nitroAppPromise = Promise.resolve()
    .then(function () {
      console.error("[vercel-render] loading server/server.js...");
      return import("./server/server.js");
    })
    .then(function (m) {
      var app = m && (m.default || m);
      if (!app || typeof app.fetch !== "function") {
        throw new Error("[vercel-render] server/server.js no exporta { fetch } — keys: " + Object.keys(m || {}).join(","));
      }
      console.error("[vercel-render] server entry loaded OK, fetch type:", typeof app.fetch);
      return app;
    })
    .catch(function (e) {
      console.error("[vercel-render] FATAL loading nitro:", fullDescribe(e));
      throw e;
    });
  return nitroAppPromise;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function debugHtml(title, message, stack, extra) {
  return \`<!doctype html>
<html lang=ht><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>\${esc(title)}</title>
<style>body{font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;max-width:960px;margin:32px auto;padding:0 16px;color:#111;background:#fafafa}
h1{color:#b91c1c;font-size:20px}h2{color:#1f2937;font-size:14px;margin-top:24px}
pre{background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:12px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12.5px}
.tag{display:inline-block;padding:2px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font-size:12px;margin-right:8px}
.tag.ok{background:#dcfce7;color:#166534}
.tag.info{background:#dbeafe;color:#1e40af}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}</style></head>
<body>
<div class=row>
  <span class=tag>\${esc(title)}</span>
  <span class="tag ok">debug SSR — quitar antes de prod</span>
  <span class="tag info">entry: index.cjs dispatcher</span>
</div>
<h1>\${esc(message || "(no message)")}</h1>
<h2>Stack / full detail</h2>
<pre>\${esc(stack || "(empty)")}</pre>
\${extra ? \`<h2>Extra / context</h2><pre>\\\${esc(extra)}</pre>\` : ""}
<h2>Environment keys (presence only)</h2>
<pre>\${esc(envReport())}</pre>
</body></html>\`;
}

function toWebRequest(reqOpts) {
  var protocol = (reqOpts.headers["x-forwarded-proto"] || "").toString().split(",")[0].trim() ||
    (reqOpts.socket && reqOpts.socket.encrypted ? "https" : "http") || "https";
  var host = reqOpts.headers["x-forwarded-host"] || reqOpts.headers.host || "localhost";
  var url = protocol + "://" + host + (reqOpts.url || "/");
  var hdrs = new Headers();
  Object.keys(reqOpts.headers || {}).forEach(function (k) {
    var v = reqOpts.headers[k];
    if (v == null) return;
    if (Array.isArray(v)) v.forEach(function (x) { hdrs.append(k, String(x)); });
    else hdrs.set(k, String(v));
  });
  var method = (reqOpts.method || "GET").toUpperCase();
  var init = { method: method, headers: hdrs };
  if (method !== "GET" && method !== "HEAD" && reqOpts._bodyReadable) {
    init.body = reqOpts._bodyReadable;
    init.duplex = "half";
  }
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
    try { reader.releaseLock(); } catch (_) {}
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

function renderToPromise(request) {
  console.error("[vercel-render] render start url=" + request.url + " method=" + request.method);
  return loadNitro().then(function (app) {
    return app.fetch(request, process.env, {
      waitUntil: function (p) { Promise.resolve(p).catch(function (e) { console.error("[vercel-render] waitUntil rejected:", fullDescribe(e)); }); },
      passThroughOnException: function () {},
    }).then(function (resp) {
      console.error("[vercel-render] render done status=" + resp.status + " url=" + request.url);
      return resp;
    });
  });
}

// Firma 1: estilo http.Server (req, res)
function handlerHttp(req, res) {
  Promise.resolve()
    .then(function () {
      var bodyReadable = null;
      try { bodyReadable = Readable.toWeb(req); } catch (_) {}
      return toWebRequest({
        url: req.url, method: req.method, headers: req.headers,
        socket: req.socket, _bodyReadable: bodyReadable,
      });
    })
    .then(renderToPromise)
    .then(function (resp) { return writeResponse(res, resp); })
    .catch(function (err) {
      var msg = err && err.message ? err.message : String(err || "Unknown SSR error");
      var full = fullDescribe(err);
      console.error("[vercel-render:http:catch]\\n" + full);
      res.statusCode = 500;
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.end(debugHtml("500 HTTP HANDLER ERROR", msg, full, "signature=(req,res) url=" + (req && req.url ? req.url : "?")));
    });
}

// Firma 2: estilo Vercel Node.js helpers/event (event.path + event.headers + event.body)
function handlerEvent(event, context) {
  if (!event || typeof event !== "object") {
    return { statusCode: 500, headers: { "content-type": "text/plain; charset=utf-8" },
             body: "500 handler called with invalid event: " + String(typeof event) };
  }
  return Promise.resolve()
    .then(function () {
      var headers = Object.assign({}, event.headers || {});
      var bodyReadable = null;
      if (event.body != null) {
        var stream = new Readable();
        stream.push(Buffer.isBuffer(event.body) ? event.body : Buffer.from(String(event.body), event.isBase64Encoded ? "base64" : "utf8"));
        stream.push(null);
        bodyReadable = Readable.toWeb(stream);
      }
      return toWebRequest({
        url: (event.path && !event.url) ? event.path : (event.url || "/"),
        method: event.httpMethod || event.method || "GET",
        headers: headers,
        socket: { encrypted: true },
        _bodyReadable: bodyReadable,
      });
    })
    .then(renderToPromise)
    .then(async function (resp) {
      var chunks = [];
      if (resp.body) {
        var reader = resp.body.getReader();
        while (true) { var r = await reader.read(); if (r.done) break; if (r.value) chunks.push(Buffer.from(r.value)); }
        try { reader.releaseLock(); } catch (_) {}
      }
      var h = {};
      resp.headers.forEach(function (v, k) { h[k] = v; });
      var buf = Buffer.concat(chunks);
      var ct = h["content-type"] || h["Content-Type"] || "";
      var isText = /^text\\//i.test(ct) || /json|javascript|xml|svg|css|html/i.test(ct);
      return {
        statusCode: resp.status || 200,
        headers: h,
        body: isText ? buf.toString("utf8") : buf.toString("base64"),
        isBase64Encoded: !isText,
      };
    })
    .catch(function (err) {
      var msg = err && err.message ? err.message : String(err || "Unknown SSR error");
      var full = fullDescribe(err);
      console.error("[vercel-render:event:catch]\\n" + full);
      var extra = "signature=(event,context) path=" + ((event && (event.path || event.url)) || "/");
      return { statusCode: 500,
               headers: { "content-type": "text/html; charset=utf-8" },
               body: debugHtml("500 EVENT HANDLER ERROR", msg, full, extra) };
    });
}

// Auto-detecta la firma y despacha
function dispatcher(a, b) {
  console.error("[vercel-render:dispatcher] called, args types: typeof a=" + typeof a + ", typeof b=" + typeof b +
    ", b.writeHead?=" + (b && typeof b.writeHead === "function") +
    ", a.on?=" + (a && typeof a.on === "function"));
  if (b && typeof b.writeHead === "function" && typeof b.end === "function") {
    return handlerHttp(a, b);
  }
  if (a && typeof a === "object") {
    return handlerEvent(a, b);
  }
  return handlerHttp(a, b);
}

module.exports = dispatcher;
module.exports.default = dispatcher;
module.exports.httpHandler = handlerHttp;
module.exports.eventHandler = handlerEvent;
`;

writeFileSync(path.join(RENDER_FUNC, "index.cjs"), indexCjs);

const configJson = {
  version: 3,
  routes: [
    {
      src: "^/assets/(.*)$",
      headers: { "cache-control": "public, max-age=31536000, immutable" },
      continue: true,
    },
    { handle: "filesystem" },
    { src: "/(.*)", dest: "/render" },
  ],
};
writeFileSync(path.join(OUTPUT_DIR, "config.json"), JSON.stringify(configJson, null, 2) + "\n");

console.log("[vercel-output] Built .vercel/output/ ✓");
console.log("  - static/: " + listSize(STATIC_DIR) + " files");
console.log("  - functions/render.func/: " + listSize(RENDER_FUNC) + " files");

function listSize(dir) {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    n += entry.isDirectory() ? listSize(path.join(dir, entry.name)) : 1;
  }
  return n;
}
