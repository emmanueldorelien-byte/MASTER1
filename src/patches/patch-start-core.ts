// Runtime monkey-patch for @tanstack/start-server-core.getResponse
// This file is imported early from `src/start.ts` to provide a safe
// fallback in case the bundled library runs in an environment where the
// H3 event or `res` is missing.

async function applyPatch() {
  try {
    const mod = await import('@tanstack/start-server-core/src/request-response');
    if (!mod) return;
    const original = (mod as any).getResponse;
    if (typeof original !== 'function') return;

    (mod as any).getResponse = function patchedGetResponse(...args: any[]) {
      try {
        return original.apply(this, args);
      } catch (err) {
        // Defensive fallback: return minimal `res`-like object expected
        // by callers that read `headers`/`status`/`statusText`.
        return {
          headers: new Headers(),
          status: 500,
          statusText: '',
        } as any;
      }
    };
  } catch (e) {
    // Non-fatal: if patching fails, we log and continue. The node_modules
    // edit remains a last-resort local fix until upstream accepts a PR.
    // Avoid throwing during startup.
    // eslint-disable-next-line no-console
    console.warn('[patch-start-core] failed to apply patch', e);
  }
}

// Fire-and-forget; ensure we don't block startup.
void applyPatch();

export {};
