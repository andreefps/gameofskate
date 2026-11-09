import { describe, expect, it } from "vitest";

import { forgetAfter, hydrateNames, hydrateTrickMap, rememberTrick } from "@/lib/skate/trick-turns";

describe("trick-turns", () => {
  it("remembers and caps oldest turns", () => {
    let m = {};
    for (let t = 1; t <= 50; t++) m = rememberTrick(m, t, `t${t}`, 40);
    expect(Object.keys(m)).toHaveLength(40);
    expect((m as Record<number, string>)[10]).toBeUndefined();
    expect((m as Record<number, string>)[11]).toBe("t11");
  });

  it("forgets turns after a given turn", () => {
    expect(forgetAfter({ 1: "a", 2: "b", 3: "c" }, 2)).toEqual({ 1: "a", 2: "b" });
  });

  it("hydrates defensively", () => {
    expect(hydrateTrickMap({ 1: "a", x: "b", 2: 5 })).toEqual({ 1: "a" });
    expect(hydrateTrickMap(null)).toEqual({});
    expect(hydrateNames(["a", "b", "c"], 2)).toEqual(["a", "b"]);
    expect(hydrateNames([1], 2)).toBeNull();
    expect(hydrateNames([], 2)).toBeNull();
  });
});
