// Generic localStorage-backed state — the same AsyncStorage-over-localStorage shim
// tokenStore.ts already uses for auth tokens, generalized so every other piece of
// user-generated state (applications, saved cards, community posts, etc.) survives a page
// refresh the same way login does, instead of resetting because it only ever lived in
// React state. Reads happen synchronously off the underlying localStorage on first render
// (there's no real async storage backend here — see async-storage.js — so there's no
// reason to show a loading flash while "awaiting" a read that already completed
// synchronously under the hood); writes go through AsyncStorage.setItem to stay consistent
// with the rest of the app's storage access, but are fire-and-forget since the underlying
// write is itself synchronous.
import { useCallback, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "credo_state_";

function readSync<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// serialize/deserialize let a caller store a Map/Set (not natively JSON-able) as a plain
// array under the hood, converting back on read — every other shape (arrays, records,
// primitives) can omit both and round-trip through JSON.stringify/parse directly.
export function usePersistentState<T, S = T>(
  key: string,
  initial: T,
  options?: { serialize: (value: T) => S; deserialize: (stored: S) => T }
): [T, (updater: T | ((prev: T) => T)) => void] {
  const { serialize, deserialize } = options ?? {};
  const initialized = useRef(false);

  const [state, setState] = useState<T>(() => {
    if (!deserialize) return readSync<T>(key, initial);
    const stored = readSync<S | null>(key, null);
    return stored == null ? initial : deserialize(stored);
  });

  const persist = useCallback(
    (value: T) => {
      try {
        const toStore = serialize ? serialize(value) : value;
        AsyncStorage.setItem(PREFIX + key, JSON.stringify(toStore));
      } catch {
        // Storage full or unavailable (private-mode edge cases) — state still works for
        // the current session via the in-memory shim fallback, just won't survive reload.
      }
    },
    [key, serialize]
  );

  const setPersistentState = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  // First mount only: nothing to persist yet since we just read it, but marks the ref so
  // future logic (if ever needed) can distinguish "just hydrated" from "user changed it."
  if (!initialized.current) initialized.current = true;

  return [state, setPersistentState];
}

// Convenience serializers for the two non-JSON-native shapes used across contexts.
export const mapSerializer = <V,>() => ({
  serialize: (value: Map<string, V>) => Array.from(value.entries()),
  deserialize: (stored: [string, V][]) => new Map(stored),
});

export const setSerializer = () => ({
  serialize: (value: Set<string>) => Array.from(value),
  deserialize: (stored: string[]) => new Set(stored),
});
