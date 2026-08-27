import * as reactStart from "@tanstack/react-start";

export type SafeMiddlewareFactory = (
  options?: { type?: "function" | "request" | string },
) => {
  client: <T>(handler: T) => T;
  server: <T>(handler: T) => T;
};

const rawCreateMiddleware = (reactStart as any)?.createMiddleware as
  | ((options?: { type?: "function" | "request" | string }) => any)
  | undefined;

export const createSafeMiddleware: SafeMiddlewareFactory = (options) => {
  if (typeof rawCreateMiddleware !== "function") {
    return {
      client: <T>(handler: T) => handler,
      server: <T>(handler: T) => handler,
    };
  }

  return rawCreateMiddleware(options ?? {});
};
