import { createStart, createMiddleware } from "@tanstack/react-start";
import { createCsrfMiddleware } from "@tanstack/start-client-core";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(
  async ({ request, handlerType, next }) => {
    try {
      return await next();
    } catch (error) {
      if (error != null && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      const message = error instanceof Error ? error.message : "Erè sistèm.";
      console.error("[server]", error);
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
            ...(error instanceof Error ? { name: error.name } : {}),
          }),
          {
            status: 500,
            headers: { "content-type": "application/json; charset=utf-8" },
          },
        );
      }
      return new Response(renderErrorPage(), {
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
