import * as SecureStore from "expo-secure-store";
import { AppState, Platform } from "react-native";

const isWeb = Platform.OS === "web";

function readSync(key: string): string | null {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItem(key);
}

function writeAsync(key: string, value: string): void {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // private mode / quota: ignore
    }
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
const pending: Record<string, unknown> = {};

function writeNow(key: string, value: unknown): void {
  try {
    writeAsync(key, JSON.stringify(value));
  } catch {
    // ignore serialization/storage failures
  }
}

/** Debounced write. Safe to call on every settings change. */
export function save(key: string, value: unknown, delayMs = 300): void {
  const existing = timers[key];
  if (existing) clearTimeout(existing);
  pending[key] = value;
  timers[key] = setTimeout(() => {
    delete timers[key];
    delete pending[key];
    writeNow(key, value);
  }, delayMs);
}

/** Write every pending debounced value immediately (app backgrounding / page close). */
export function flushAll(): void {
  for (const key of Object.keys(pending)) {
    clearTimeout(timers[key]);
    delete timers[key];
    const value = pending[key];
    delete pending[key];
    writeNow(key, value);
  }
}

/** Flush pending writes when the app is backgrounded or the page is closed. Returns cleanup. */
export function installFlushOnExit(): () => void {
  if (isWeb) {
    if (typeof window === "undefined" || typeof document === "undefined") return () => {};
    const onHide = () => {
      if (document.visibilityState === "hidden") flushAll();
    };
    window.addEventListener("pagehide", flushAll);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flushAll);
      document.removeEventListener("visibilitychange", onHide);
    };
  }
  const sub = AppState.addEventListener("change", (s) => {
    if (s === "background" || s === "inactive") flushAll();
  });
  return () => sub.remove();
}
