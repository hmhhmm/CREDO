// @react-native-async-storage/async-storage shim over localStorage. AsyncStorage's API is
// promise-based and localStorage's is synchronous, so every method just wraps the result.
const memory = new Map();

function backend() {
  try {
    // Private-mode Safari throws on access; fall back to an in-memory store so auth still
    // works for the session.
    window.localStorage.getItem('__probe__');
    return window.localStorage;
  } catch {
    return {
      getItem: (k) => (memory.has(k) ? memory.get(k) : null),
      setItem: (k, v) => memory.set(k, v),
      removeItem: (k) => memory.delete(k),
      clear: () => memory.clear(),
      key: (i) => Array.from(memory.keys())[i] ?? null,
      get length() {
        return memory.size;
      },
    };
  }
}

const AsyncStorage = {
  async getItem(key) {
    return backend().getItem(key);
  },
  async setItem(key, value) {
    backend().setItem(key, value);
  },
  async removeItem(key) {
    backend().removeItem(key);
  },
  async clear() {
    backend().clear();
  },
  async multiSet(pairs) {
    const store = backend();
    for (const [key, value] of pairs) store.setItem(key, value);
  },
  async multiGet(keys) {
    const store = backend();
    return keys.map((key) => [key, store.getItem(key)]);
  },
  async multiRemove(keys) {
    const store = backend();
    for (const key of keys) store.removeItem(key);
  },
  async getAllKeys() {
    const store = backend();
    return Array.from({ length: store.length }, (_, i) => store.key(i)).filter(Boolean);
  },
};

export default AsyncStorage;
