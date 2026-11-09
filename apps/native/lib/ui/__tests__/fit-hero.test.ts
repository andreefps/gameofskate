import { describe, expect, it } from "vitest";

import { fitHero } from "@/lib/ui/fit-hero";

describe("fitHero", () => {
  it("fits the longest word within width on a 375px phone", () => {
    for (const name of ["Switch Frontside Bigspin Flip", "Nollie Backside 360 Shuvit"]) {
      const words = name.toUpperCase().split(" ");
      const { fontSize, lineHeight } = fitHero(words, 327, 420, 104);
      const longest = Math.max(...words.map((w) => w.length));
      expect(fontSize * 0.48 * longest).toBeLessThanOrEqual(327);
      expect(words.length * lineHeight).toBeLessThanOrEqual(420 * 0.75 + words.length);
    }
  });

  it("respects the max size for short words", () => {
    expect(fitHero(["OLLIE"], 600, 800, 104).fontSize).toBe(104);
  });
});
