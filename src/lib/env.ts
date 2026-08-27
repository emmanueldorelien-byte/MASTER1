// Centralized environment variable resolver.
// Safe to import from both server and client code (will just return undefined
// or the VITE_ prefixed value on the client).

export type EnvNameMap = Record<string, string | undefined>;

export function getProcessEnvSafe(): EnvNameMap {
  try {
    if (typeof process !== "undefined" && process.env) {
      return process.env as EnvNameMap;
    }
  } catch {
    /* ignore */
  }
  try {
    const g = globalThis as any;
    if (g.process && g.process.env) {
      return g.process.env as EnvNameMap;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function getImportMetaEnvSafe(): EnvNameMap {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as any).env) {
      return (import.meta as any).env as EnvNameMap;
    }
  } catch {
    /* ignore */
  }
  try {
    const g = globalThis as any;
    if (g.import_meta_env && typeof g.import_meta_env === "object") {
      return g.import_meta_env as EnvNameMap;
    }
  } catch {
    /* ignore */
  }
  return {};
}

/**
 * Resolve an environment variable searching multiple sources in order:
 *   1. process.env[name]         (Node / SSR runtime)
 *   2. process.env[viteName]     (if provided)
 *   3. import.meta.env[name]     (Vite build time)
 *   4. import.meta.env[viteName] (if provided)
 *   5. globalThis fallback copies
 */
export function resolveEnv(
  name: string,
  viteName?: string,
): string | undefined {
  const procEnv = getProcessEnvSafe();
  if (procEnv[name]) return procEnv[name];
  if (viteName && procEnv[viteName]) return procEnv[viteName];

  const metaEnv = getImportMetaEnvSafe();
  if (metaEnv[name]) return metaEnv[name];
  if (viteName && metaEnv[viteName]) return metaEnv[viteName];

  return undefined;
}
