import { describe, expect, it } from "vitest";

import { TIERS, tierOf } from "@/lib/skate/tier";

describe("TIERS", () => {
  it("lists tiers easiest-first", () => {
    expect(TIERS).toEqual(["beginner", "intermediate", "advanced"]);
  });
});

describe("tierOf", () => {
  it("maps 1-4 to beginner", () => {
    expect(tierOf(1)).toBe("beginner");
    expect(tierOf(4)).toBe("beginner");
  });

  it("maps 5-8 to intermediate", () => {
    expect(tierOf(5)).toBe("intermediate");
    expect(tierOf(8)).toBe("intermediate");
  });

  it("maps 9 and up to advanced", () => {
    expect(tierOf(9)).toBe("advanced");
    expect(tierOf(15)).toBe("advanced");
  });
});
