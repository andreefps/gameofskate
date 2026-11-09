import { useEffect } from "react";
import { Platform } from "react-native";

import { shouldSkipHotkey } from "@/lib/hotkey-target";

type Handler = (event: KeyboardEvent) => void;

/**
 * Web-only global key bindings, keyed by `KeyboardEvent.key` (" " for Space).
 * Ctrl/Cmd combos use the "mod+<lowercase key>" form. Ignored while focus is in an editable field or when `enabled` is false.
 * No-op on native.
 */
export function useHotkeys(bindings: Record<string, Handler>, enabled = true): void {
  useEffect(() => {
    if (Platform.OS !== "web" || !enabled || typeof window === "undefined") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.repeat) return;
      // Ctrl/Cmd combos are looked up as "mod+<key>" (e.g. "mod+z").
      const mod = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement | null;
      if (
        shouldSkipHotkey(
          target && { tag: target.tagName, role: target.getAttribute?.("role"), editable: target.isContentEditable },
          event.key,
        )
      )
        return;
      // Undo only: Cmd/Ctrl+Shift+Z is redo and must not trigger it.
      if (mod && event.shiftKey && event.key.toLowerCase() === "z") return;
      const handler = bindings[mod ? `mod+${event.key.toLowerCase()}` : event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bindings, enabled]);
}
