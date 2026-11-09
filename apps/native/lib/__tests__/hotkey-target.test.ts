import { describe, expect, it } from "vitest";

import { shouldSkipHotkey } from "@/lib/hotkey-target";

describe("shouldSkipHotkey", () => {
  it("never skips without a target", () => expect(shouldSkipHotkey(null, " ")).toBe(false));
  it("skips every key in editable fields", () => {
    expect(shouldSkipHotkey({ tag: "INPUT" }, "z")).toBe(true);
    expect(shouldSkipHotkey({ tag: "DIV", editable: true }, "Enter")).toBe(true);
  });
  it("skips Space/Enter on interactive roles and tags", () => {
    for (const role of ["button", "radio", "checkbox", "switch", "link", "tab", "textbox"]) {
      expect(shouldSkipHotkey({ tag: "DIV", role }, " ")).toBe(true);
    }
    expect(shouldSkipHotkey({ tag: "BUTTON" }, "Enter")).toBe(true);
    expect(shouldSkipHotkey({ tag: "A" }, " ")).toBe(true);
  });
  it("lets other keys through on buttons and plain elements", () => {
    expect(shouldSkipHotkey({ tag: "BUTTON" }, "z")).toBe(false);
    expect(shouldSkipHotkey({ tag: "BODY" }, " ")).toBe(false);
  });
});
