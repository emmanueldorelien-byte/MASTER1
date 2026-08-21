var __store__ = Symbol("__tanstack_als_store__");

function getDefaultStore() {
  if (typeof window !== "undefined") {
    var opts = window.__TSS_START_OPTIONS__;
    if (opts && typeof opts === "object") return { startOptions: opts };
  }
  return { startOptions: {} };
}

function AsyncLocalStorage() {
  this[__store__] = getDefaultStore();
}

AsyncLocalStorage.prototype.getStore = function () {
  if (
    !this[__store__] ||
    typeof this[__store__] !== "object" ||
    !("startOptions" in this[__store__])
  ) {
    this[__store__] = getDefaultStore();
  }
  return this[__store__];
};

AsyncLocalStorage.prototype.run = function (store, callback) {
  var prev = this[__store__];
  this[__store__] = store;
  var args = Array.prototype.slice.call(arguments, 2);
  try {
    var result = callback.apply(undefined, args);
    if (result && typeof result.then === "function") {
      var self = this;
      return result.then(
        function (v) {
          self[__store__] = prev;
          return v;
        },
        function (e) {
          self[__store__] = prev;
          throw e;
        },
      );
    }
    return result;
  } finally {
    if (!result || typeof result.then !== "function") {
      this[__store__] = prev;
    }
  }
};

AsyncLocalStorage.prototype.exit = function (callback) {
  var prev = this[__store__];
  this[__store__] = getDefaultStore();
  var args = Array.prototype.slice.call(arguments, 1);
  try {
    var result = callback.apply(undefined, args);
    if (result && typeof result.then === "function") {
      var self = this;
      return result.then(
        function (v) {
          self[__store__] = prev;
          return v;
        },
        function (e) {
          self[__store__] = prev;
          throw e;
        },
      );
    }
    return result;
  } finally {
    if (!result || typeof result.then !== "function") {
      this[__store__] = prev;
    }
  }
};

AsyncLocalStorage.prototype.enterWith = function (store) {
  this[__store__] = store;
};

AsyncLocalStorage.prototype.disable = function () {
  this[__store__] = getDefaultStore();
};

export { AsyncLocalStorage };
export default { AsyncLocalStorage: AsyncLocalStorage };
