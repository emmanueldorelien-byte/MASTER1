import { AsyncLocalStorage } from 'node:async_hooks'

const GLOBAL_EVENT_STORAGE_KEY = Symbol.for('tanstack-start:event-storage')
const globalObj = globalThis as any

function buildFallbackH3(): any {
  const hdrs = new Headers()
  try {
    const ssrReq = globalObj.__SSR_REQUEST__
    if (ssrReq && ssrReq.headers && typeof ssrReq.headers === 'object') {
      for (const [k, v] of Object.entries(ssrReq.headers as Record<string, string>)) {
        if (typeof k === 'string' && typeof v === 'string') {
          hdrs.set(k, v)
        }
      }
    }
  } catch {
    // ignore
  }
  return {
    req: { headers: hdrs },
    res: {
      headers: new Headers(),
      status: 200,
      statusText: '',
    },
  }
}

function getFallbackStore(): any {
  return { h3Event: buildFallbackH3() }
}

try {
  const origGetStore = AsyncLocalStorage.prototype.getStore
  AsyncLocalStorage.prototype.getStore = function getStoreSafe(this: any) {
    const store = origGetStore.call(this)
    if (store !== undefined && store !== null) {
      if (this === globalObj[GLOBAL_EVENT_STORAGE_KEY]) {
        return (store as any).h3Event ? store : getFallbackStore()
      }
      return store
    }
    if (this === globalObj[GLOBAL_EVENT_STORAGE_KEY]) {
      return getFallbackStore()
    }
    return store
  }
} catch {
  // Runtime sin soporte de AsyncLocalStorage
}

if (typeof window === 'undefined') {
  try {
    const existingStorage = globalObj[GLOBAL_EVENT_STORAGE_KEY] as AsyncLocalStorage<any> | undefined
    if (existingStorage && typeof (existingStorage as any).enterWith === 'function') {
      try {
        ;(existingStorage as any).enterWith(getFallbackStore())
      } catch {
        // Fallback para Node antiguo
      }
    }
  } catch {
    // ignore
  }
}

export {}