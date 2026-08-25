import { createStart, createMiddleware } from "@tanstack/react-start";
import { createCsrfMiddleware } from "@tanstack/start-client-core";

import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

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
    <span class="tag ok">debug mode — quitar antes de producción</span>
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

const errorMiddleware = createMiddleware().server(
  async ({ request, handlerType, next }) => {
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

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, csrfMiddleware],
}));
