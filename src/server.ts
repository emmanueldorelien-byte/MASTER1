import "./lib/error-capture";

// Define a safe fallback for legacy compiled bundles referencing TOTAL_SPOTS
(globalThis as any).TOTAL_SPOTS = (globalThis as any).TOTAL_SPOTS ?? 200;

import { consumeLastCapturedError } from "./lib/error-capture";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function errorToStack(err: unknown): string {
  if (err instanceof Error) return err.stack ?? `${err.name}: ${err.message}`;
  try { return JSON.stringify(err); } catch { return String(err); }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      if (response.status >= 500) {
        const bodyText = await response.clone().text();
        const captured = consumeLastCapturedError();
        console.error(
          "[ssr-500] status=" + response.status +
          " content-type=" + (response.headers.get("content-type") ?? "") +
          " body=" + bodyText.slice(0, 2000),
        );
        if (captured) console.error("[ssr-500] captured:", errorToStack(captured));
        return new Response(debugErrorHtml(captured ?? new Error(bodyText || "HTTP " + response.status), bodyText), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      }
      return response;
    } catch (error) {
      console.error("[ssr-catch]", errorToStack(error));
      return new Response(debugErrorHtml(error, ""), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function debugErrorHtml(error: unknown, body: string): string {
  const msg = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack ?? "" : "";
  const envKeys = typeof process !== "undefined" && process.env
    ? Object.keys(process.env)
        .filter((k) => /SUPABASE|VERCEL|NODE|PORT|URL|HOST/i.test(k))
        .map((k) => `${k}=${process.env[k] ? "✓" : "(empty)"}`)
        .join("\n")
    : "(no process.env)";
  return `<!doctype html>
<html lang="ht">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SSR Debug — Erè</title>
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
    <span class="tag">500 SSR ERROR</span>
  </div>
  <h1>Error message</h1>
  <pre>${esc(msg)}</pre>
  <h2>Stack</h2>
  <pre>${esc(stack || "(no stack)")}</pre>
  <h2>h3 / response body (raw)</h2>
  <pre>${esc(body.slice(0, 2000) || "(empty)")}</pre>
  <h2>Environment keys (SUPABASE/VERCEL/NODE) — presence only</h2>
  <pre>${esc(envKeys)}</pre>
</body>
</html>`;
}
