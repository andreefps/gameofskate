const INTERACTIVE_ROLES = ["button", "radio", "checkbox", "switch", "link", "tab", "textbox"];
const INTERACTIVE_TAGS = ["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"];
const EDITABLE_TAGS = ["INPUT", "TEXTAREA", "SELECT"];

export type KeyTarget = { tag?: string; role?: string | null; editable?: boolean } | null;

/** True when a global hotkey should not fire because the focused element owns the key. */
export function shouldSkipHotkey(target: KeyTarget, key: string): boolean {
  if (!target) return false;
  const tag = target.tag?.toUpperCase();
  if (target.editable || (tag && EDITABLE_TAGS.includes(tag))) return true;
  if (key !== " " && key !== "Enter") return false;
  return (!!tag && INTERACTIVE_TAGS.includes(tag)) || (!!target.role && INTERACTIVE_ROLES.includes(target.role));
}
