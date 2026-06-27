import * as SecureStore from "expo-secure-store";

/**
 * Read and JSON-parse a persisted value synchronously (instant boot hydration,
 * no flash of defaults). Returns `undefined` on miss or parse error.
 */
export function loadSync(key: string): unknown {
  try {
    const raw = SecureStore.getItem(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const timers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Debounced async write. Safe to call on every settings change. */
export function save(key: string, value: unknown, delayMs = 300): void {
  const existing = timers[key];
  if (existing) clearTimeout(existing);
  timers[key] = setTimeout(() => {
    void SecureStore.setItemAsync(key, JSON.stringify(value)).catch(() => {
      // best-effort persistence; ignore write failures
    });
  }, delayMs);
}
