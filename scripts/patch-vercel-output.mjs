// scripts/patch-vercel-output.mjs
// Nitro + plugin Nitro genera .vercel/output/ automáticamente con las
// dependencias INLINE/bundled, evitando "Cannot find package 'react'".
// Este POST-PROCESS solo ajusta 2 cosas:
//   1. Fuerza .vc-config.json a shouldAddHelpers: false (mínima capa Vercel)
//   2. Sustituye el entry del render.func por NUESTRO index.cjs custom
//      (con dispatcher, debug HTML con stack, logs exhaustivos, etc.)

import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(projectRoot, ".vercel", "output");
const FUNCTIONS_DIR = path.join(OUTPUT_DIR, "functions");

// Si no hay .vercel/output (build local sin preset=vercel), no hacemos nada.
if (!existsSync(FUNCTIONS_DIR)) {
  console.log("[patch-vercel-output] No se encontró .vercel/output/functions. — skip (no es build Vercel)");
  process.exit(0);
}

// Buscar el render.func: Nitro lo llama "render.func", "index.func" o a veces otra cosa.
function findRenderFunc() {
  if (!existsSync(FUNCTIONS_DIR)) return null;
  const entries = readdirSync(FUNCTIONS_DIR, { withFileTypes: true });
  for (const e of entries) {
    if (!e.isDirectory() || !e.name.endsWith(".func")) continue;
    return path.join(FUNCTIONS_DIR, e.name);
  }
  return null;
}
const RENDER_FUNC = findRenderFunc();
if (!RENDER_FUNC) {
  console.log("[patch-vercel-output] No se encontró *.func en .vercel/output/functions — skip");
  process.exit(0);
}
console.log("[patch-vercel-output] Patching: " + path.relative(projectRoot, RENDER_FUNC));

// 1. Escribir .vc-config.json simple
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

// 2. Detectar el entry Nitro real dentro del render.func
function detectNitroServerEntry(funcDir) {
  const candidates = [
    ["server", "server.mjs"],
    ["server", "server.js"],
    ["server", "index.mjs"],
    ["server", "index.js"],
    ["index.mjs"],
    ["index.js"],
    ["handler.mjs"],
    ["handler.js"],
  ];
  for (const rel of candidates) {
    const abs = path.join(funcDir, ...rel);
    if (existsSync(abs)) return "./" + rel.join("/");
  }
  if (existsSync(funcDir)) {
    const top = readdirSync(funcDir, { withFileTypes: true });
    for (const e of top) {
      if (!e.isFile()) continue;
      if (/\.m?js$/.test(e.name) && e.name !== "index.cjs") return "./" + e.name;
    }
  }
  return "./server/server.mjs";
}
const NITRO_ENTRY = detectNitroServerEntry(RENDER_FUNC);
console.log("[patch-vercel-output] Nitro server entry inside func: " + NITRO_ENTRY);

// Construye nuestro index.cjs limpio (sin parches corruptos de AsyncLocalStorage o CSRF)
const indexCjs = buildIndexCjs(NITRO_ENTRY);
writeFileSync(path.join(RENDER_FUNC, "index.cjs"), indexCjs);

console.log("[patch-vercel-output] Patched OK ✓");
console.log("  - .vc-config.json: shouldAddHelpers=false, runtime=nodejs20.x");
console.log("  - index.cjs: dispatcher (req,res)+(event,context) + debug HTML + stack traces");
console.log("  - Nitro server entry: " + NITRO_ENTRY);

// ============================================================
// BUILD de index.cjs
// ============================================================
function buildIndexCjs(nitroEntryRel) {
  return `"use strict";
const { Readable } = require("node:stream");
var nitroEntryRelSafe = ${JSON.stringify(nitroEntryRel)};

function envReport() {
  if (typeof process === "undefined" || !process.env) return "(no process.env)";
  var keys = Object.keys(process.env).filter(function (k) {
    return /SUPABASE|VERCEL|NODE|PORT|URL|HOST|DATABASE|JWT|SECRET|KEY|AUTH|SMTP/i.test(k);
  }).sort().map(function (k) {
    var v = process.env[k];
    return k + "=" + (v ? ("set (" + String(v).length + " chars)") : "(empty)");
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
      console.error("[vercel-render] loading nitro entry: " + nitroEntryRelSafe);
      return import(nitroEntryRelSafe);
    })
    .then(function (m) {
      var app = m && (m.default || m);
      if (app && typeof app.fetch === "function") {
        console.error("[vercel-render] nitro loaded OK, using app.fetch()");
        return app;
      }
      if (app && typeof app.handler === "function") {
        console.error("[vercel-render] nitro loaded OK, wrapping app.handler() as fetch()");
        return {
          fetch: function (req, env, ctx) {
            return Promise.resolve(app.handler(req, env, ctx));
          }
        };
      }
      throw new Error("[vercel-render] entry no exporta { fetch / handler } — keys: " + Object.keys(m || {}).join(","));
    })
    .catch(function (e) {
      console.error("[vercel-render] FATAL loading nitro:\\n" + fullDescribe(e));
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
.tag.ok{background:#dcfce7;color:#166534}.tag.info{background:#dbeafe;color:#1e40af}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}</style></head>
<body>
<div class=row>
  <span class=tag>\${esc(title)}</span>
  <span class="tag ok">debug SSR — quitar antes de prod</span>
  <span class="tag info">entry: index.cjs dispatcher via nitro</span>
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
      waitUntil: function (p) { Promise.resolve(p).catch(function (e) { console.error("[vercel-render] waitUntil rejected:\\n", fullDescribe(e)); }); },
      passThroughOnException: function () {},
    }).then(function (resp) {
      console.error("[vercel-render] render done status=" + resp.status + " url=" + request.url);
      return resp;
    });
  });
}

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

function dispatcher(a, b) {
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
}