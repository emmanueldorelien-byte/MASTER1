// Runtime monkey-patch for @tanstack/start-server-core.getResponse
// This file is imported early from `src/start.ts` to provide a safe
// fallback in case the bundled library runs in an environment where the
// H3 event or `res` is missing.

// Only run on server (Node). Guard against bundlers by building the
// import path dynamically so Vite's static resolver doesn't try to
// analyze or bundle the deep import.
if (typeof window === 'undefined') {
  ;(async function applyPatch() {
    try {
      const pkg = '@tanstack/start-server-core'
      const modPath = pkg + '/src/request-response'
      // Tell Vite to ignore static analysis for this dynamic runtime-only import
      const mod = await import(/* @vite-ignore */ modPath as any)
      if (!mod) return
      const original = (mod as any).getResponse
      if (typeof original !== 'function') return

      ;(mod as any).getResponse = function patchedGetResponse(...args: any[]) {
        try {
          return original.apply(this, args)
        } catch (err) {
          return {
            headers: new Headers(),
            status: 500,
            statusText: '',
          } as any
        }
      }
    } catch (e) {
      // Non-fatal: log and continue. Avoid throwing during startup.
      // eslint-disable-next-line no-console
      console.warn('[patch-start-core] failed to apply patch', e)
    }
  })()
}

export {}
