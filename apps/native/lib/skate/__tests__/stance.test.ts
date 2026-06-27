import { describe, expect, it } from "vitest";

import { STANCE_MOD, stancePrefix } from "@/lib/skate/stance";

describe("STANCE_MOD", () => {
  it("orders difficulty regular < fakie < nollie < switch", () => {
    expect(STANCE_MOD.regular).toBe(0);
    expect(STANCE_MOD.fakie).toBe(1);
    expect(STANCE_MOD.nollie).toBe(2);
    expect(STANCE_MOD.switch).toBe(3);
  });
});

describe("stancePrefix", () => {
  it("omits the prefix for regular", () => {
    expect(stancePrefix("regular")).toBe("");
  });

  it("title-cases the other stances", () => {
    expect(stancePrefix("fakie")).toBe("Fakie");
    expect(stancePrefix("switch")).toBe("Switch");
    expect(stancePrefix("nollie")).toBe("Nollie");
  });
});
