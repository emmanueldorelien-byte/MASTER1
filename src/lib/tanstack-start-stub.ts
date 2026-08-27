export function createServerFn() {
  return {
    validator() {
      return this;
    },
    handler<T extends (...args: any[]) => any>(fn: T) {
      return fn;
    },
  };
}

export function useServerFn<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function getRequest(): Request | undefined {
  return undefined;
}

export const server = {
  getRequest,
};

export default {
  createServerFn,
  useServerFn,
  getRequest,
  server,
};
