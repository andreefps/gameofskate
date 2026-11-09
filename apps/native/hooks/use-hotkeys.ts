import { useEffect } from "react";
import { Platform } from "react-native";

type Handler = (event: KeyboardEvent) => void;

/**
 * Web-only global key bindings, keyed by `KeyboardEvent.key` (" " for Space).
 * Ignored while focus is in an editable field or when `enabled` is false.
 * No-op on native.
 */
export function useHotkeys(bindings: Record<string, Handler>, enabled = true): void {
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) return;
      // Let a focused button handle its own Space/Enter activation.
      if (target?.getAttribute?.("role") === "button" && (event.key === " " || event.key === "Enter")) {
        if (target !== document.body) return;
      }
      const handler = bindings[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings, enabled]);
}
