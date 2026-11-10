import { describe, expect, it } from "vitest";

import { fillerCandidates, pickFillers, reelPlan, spinStrength } from "@/lib/ui/reel";

const WORDS = ["KICKFLIP", "HEELFLIP", "OLLIE", "NOLLIE", "FAKIE", "SHUVIT", "BIGSPIN", "360"];
const ONE_LINE = ["OLLIE", "FAKIE", "NOLLIE"];

describe("pickFillers", () => {
  it("never repeats back to back, never ends on the final word", () => {
    for (let seed = 0; seed < 50; seed++) {
      let x = seed + 1;
      const rng = () => ((x = (x * 16807) % 2147483647) / 2147483647);
      const out = pickFillers(ONE_LINE, "OLLIE", 12, rng);
      expect(out).toHaveLength(12);
      for (let i = 0; i < out.length; i++) {
        if (i > 0) expect(out[i]).not.toBe(out[i - 1]);
      }
      expect(out[out.length - 1]).not.toBe("OLLIE");
    }
  });

  it("falls back to the final value when there are no candidates", () => {
    expect(pickFillers([], "X", 3)).toEqual(["X", "X", "X"]);
  });

  it("copes with a single candidate", () => {
    expect(pickFillers(["A"], "B", 3)).toEqual(["A", "A", "A"]);
  });
});

describe("fillerCandidates", () => {
  const vocab = ["Flip", "Heelflip", "Kickflip", "Varial Kickflip", "Double Kickflip", "Laser Flip"];

  it("limits by word count and width", () => {
    expect(fillerCandidates(vocab, 1, 6)).toEqual(["Flip"]);
    expect(fillerCandidates(vocab, 2, 5)).toEqual(["Flip", "Laser Flip"]);
  });

  it("prefers exact line count when at least 3 exist", () => {
    expect(fillerCandidates(vocab, 2, 10)).toEqual(["Varial Kickflip", "Double Kickflip", "Laser Flip"]);
    expect(fillerCandidates(vocab, 2, 7)).toEqual(["Flip", "Laser Flip"]);
  });
});

describe("reelPlan", () => {
  it("cascades, caps the total, and scales with strength", () => {
    const tap = reelPlan(3, 0.4);
    expect(tap.durations[0]).toBeGreaterThanOrEqual(600);
    expect(tap.durations[0]).toBeLessThanOrEqual(800);
    expect(tap.durations[1] - tap.durations[0]).toBe(200);
    expect(tap.total).toBeGreaterThan(900);
    expect(tap.total).toBeLessThanOrEqual(1500);
    expect(reelPlan(4, 1).total).toBeLessThanOrEqual(1500);
    expect(reelPlan(1, 0.4).total).toBeLessThan(tap.total);
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
