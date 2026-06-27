import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

function readSync(key: string): string | null {
  if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItem(key);
}

function writeAsync(key: string, value: string): void {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  void SecureStore.setItemAsync(key, value).catch(() => {
    // best-effort persistence; ignore write failures
  });
}

/**
 * Read and JSON-parse a persisted value synchronously (instant boot hydration,
 * no flash of defaults). Native uses expo-secure-store; web uses localStorage.
 * Returns `undefined` on miss, parse error, or unavailable storage.
 */
export function loadSync(key: string): unknown {
  try {
    const raw = readSync(key);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

const timers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Debounced write. Safe to call on every settings change. */
export function save(key: string, value: unknown, delayMs = 300): void {
  const existing = timers[key];
  if (existing) clearTimeout(existing);
  timers[key] = setTimeout(() => {
    try {
      writeAsync(key, JSON.stringify(value));
    } catch {
      // ignore serialization/storage failures
    }
  }, delayMs);
}
