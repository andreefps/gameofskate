import { describe, expect, it } from "vitest";

import { pickFillers, reelPlan, spinStrength } from "@/lib/ui/reel";

const WORDS = ["KICKFLIP", "HEELFLIP", "OLLIE", "NOLLIE", "FAKIE", "SHUVIT", "BIGSPIN", "360"];

describe("pickFillers", () => {
  it("fits width, never repeats back to back, never ends on the final word", () => {
    for (let seed = 0; seed < 50; seed++) {
      let x = seed + 1;
      const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
      const out = pickFillers(WORDS, "OLLIE", 12, 6, rng);
      expect(out).toHaveLength(12);
      for (let i = 0; i < out.length; i++) {
        expect(out[i].length).toBeLessThanOrEqual(6);
        if (i > 0) expect(out[i]).not.toBe(out[i - 1]);
      }
      expect(out[out.length - 1]).not.toBe("OLLIE");
    }
  });

  it("falls back to the final word when nothing fits", () => {
    expect(pickFillers(WORDS, "X", 3, 1)).toEqual(["X", "X", "X"]);
  });
});

describe("reelPlan", () => {
  it("cascades, caps the total, and scales with strength", () => {
    const tap = reelPlan(3, 0.4);
    expect(tap.durations[0]).toBeGreaterThanOrEqual(650);
    expect(tap.durations[1] - tap.durations[0]).toBe(140);
    expect(tap.total).toBeGreaterThan(900);
    expect(tap.total).toBeLessThanOrEqual(1300);
    expect(reelPlan(5, 1).total).toBeLessThanOrEqual(1300);
    expect(reelPlan(3, 1).total).toBeGreaterThan(tap.total);
    expect(tap.fillerCounts.every((k) => k >= 8 && k <= 14)).toBe(true);
  });
});

describe("spinStrength", () => {
  it("is at least the default and caps at 1", () => {
    expect(spinStrength(-100)).toBe(0.4);
    expect(spinStrength(-5000)).toBe(1);
  });
});
