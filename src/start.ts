// Apply runtime patch to handle edge-case runtimes in @tanstack/start-server-core
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dotenvResult = config({ path: path.resolve(__dirname, "..", ".env") });

// Polyfill global `process` + merge dotenv + import.meta.env so server functions
// always see env vars even when Vite SSR runtime does not define `process`.
(function ensureGlobalProcess() {
  const g = globalThis as any;
  const mergedEnv: Record<string, string> = { ...(dotenvResult?.parsed ?? {}) };
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      Object.assign(mergedEnv, (import.meta as any).env);
    }
  } catch {
    /* ignore */
  }
  if (typeof process !== "undefined" && process.env) {
    Object.assign(mergedEnv, process.env);
  }
  if (!g.process) g.process = {};
  if (!g.process.env) g.process.env = {};
  Object.assign(g.process.env, mergedEnv);
  (g as any).import_meta_env = mergedEnv;
})();

import "./patches/patch-start-core";
import { createStart } from "@tanstack/react-start";

import { createSafeMiddleware } from "@/lib/safe-middleware";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const safeCreateMiddleware = () => {
  try {
    return createSafeMiddleware();
  } catch (error) {
    console.warn("[tanstack-start] createMiddleware is unavailable; request middleware will be disabled.", error);
    return null;
  }
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function debugMiddlewareErrorHtml(error: unknown, handlerType: string): string {
  const msg = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack ?? "" : "";
  const envKeys = typeof process !== "undefined" && process.env
    ? Object.keys(process.env)
        .filter((k) => /SUPABASE|VERCEL|NODE|PORT|URL|HOST|DATABASE|JWT|SECRET|KEY/i.test(k))
        .map((k) => `${k}=${process.env[k] ? "✓ set" : "(empty)"}`)
        .join("\n")
    : "(no process.env)";
  return `<!doctype html>
<html lang="ht">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>SSR Middleware Debug — Erè</title>
  <style>
    body { font: 14px/1.5 ui-monospace, Menlo, Consolas, monospace; max-width: 960px; margin: 32px auto; padding: 0 16px; color: #111; background: #fafafa; }
    h1 { color: #b91c1c; font-size: 20px; }
    h2 { color: #1f2937; font-size: 14px; margin-top: 24px; }
    pre { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; overflow: auto; white-space: pre-wrap; word-break: break-word; font-size: 12.5px; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #fee2e2; color: #991b1b; font-size: 12px; margin-right: 8px; }
    .tag.ok { background: #dcfce7; color: #166534; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  </style>
</head>
<body>
  <div class="row">
    <span class="tag">500 MIDDLEWARE ERROR</span>
    <span class="tag" style="background:#e0e7ff;color:#3730a3">handler: ${esc(handlerType)}</span>
  </div>
  <h1>Error message</h1>
  <pre>${esc(msg)}</pre>
  <h2>Stack</h2>
  <pre>${esc(stack || "(no stack)")}</pre>
  <h2>Environment keys (presence only)</h2>
  <pre>${esc(envKeys)}</pre>
</body>
</html>`;
}

const ssrRequestBridge = safeCreateMiddleware()?.server(
  async ({ request, next }: { request: any; next: any }) => {
    try {
      const headerObj: Record<string, string> = {};
      if (request?.headers?.forEach) {
        request.headers.forEach((v: string, k: string) => {
          headerObj[k.toLowerCase()] = v;
        });
      } else if (request?.headers) {
        for (const [k, v] of (request.headers as any).entries?.() ?? []) {
          headerObj[String(k).toLowerCase()] = String(v);
        }
      }
      (globalThis as any).__SSR_REQUEST__ = { headers: headerObj };
    } catch {
      // ignore bridge setup error
    }
    try {
      return await next();
    } finally {
      try {
        delete (globalThis as any).__SSR_REQUEST__;
      } catch {
        (globalThis as any).__SSR_REQUEST__ = undefined;
      }
    }
  },
);

const errorMiddleware = safeCreateMiddleware()?.server(
  async ({ request, handlerType, next }: { request: any; handlerType: any; next: any }) => {
    try {
      return await next();
    } catch (error) {
      if (error != null && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Erè sistèm.";
      console.error("[server-middleware] handler=" + handlerType, error instanceof Error ? (error.stack || error.message) : error);
      const isServerFn = handlerType === "serverFn";
      const accepts =
        request?.headers?.get?.("accept") ??
        request?.headers?.get?.("Accept") ??
        "";
      const wantsJson =
        isServerFn ||
        accepts.includes("application/json") ||
        (request?.url ?? "").includes("/_server/");
      if (wantsJson) {
        return new Response(
          JSON.stringify({
            message,
            ...(error instanceof Error ? { name: error.name, stack: error.stack } : {}),
          }),
          {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }
      return new Response(debugMiddlewareErrorHtml(error, String(handlerType ?? "unknown")), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
);

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth as any],
  requestMiddleware: [ssrRequestBridge, errorMiddleware].filter(Boolean) as any,
}));
