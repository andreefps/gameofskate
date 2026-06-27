import { describe, expect, it } from "vitest";

import { DOMAINS } from "@/lib/skate/domains";
import { presetFor } from "@/lib/skate/preset";

describe("presetFor — flatground", () => {
  it("beginner: regular + fakie, only easy bases", () => {
    const p = presetFor(DOMAINS.flatground, "beginner");
    expect(p.stances).toEqual(["regular", "fakie"]);
    expect(p.bases).toEqual(["ollie", "shuvit", "180", "kickflip", "heelflip"]);
  });

  it("intermediate: adds nollie + mid bases, still no advanced bases", () => {
    const p = presetFor(DOMAINS.flatground, "intermediate");
    expect(p.stances).toEqual(["regular", "fakie", "nollie"]);
    expect(p.bases).toContain("360-shuvit");
    expect(p.bases).toContain("bigspin");
    expect(p.bases).not.toContain("360-flip");
    expect(p.bases).not.toContain("laser-flip");
  });

  it("advanced: everything", () => {
    const p = presetFor(DOMAINS.flatground, "advanced");
    expect(p.stances).toEqual(DOMAINS.flatground.stances);
    expect(p.bases).toEqual(DOMAINS.flatground.bases.map((b) => b.id));
  });

  it("is cumulative (beginner subset of intermediate subset of advanced)", () => {
    const b = presetFor(DOMAINS.flatground, "beginner");
    const i = presetFor(DOMAINS.flatground, "intermediate");
    const a = presetFor(DOMAINS.flatground, "advanced");
    expect(b.bases.every((x) => i.bases.includes(x))).toBe(true);
    expect(i.bases.every((x) => a.bases.includes(x))).toBe(true);
    expect(b.stances.every((x) => i.stances.includes(x))).toBe(true);
  });
});

describe("presetFor — grinds", () => {
  it("beginner: regular + fakie, only easy bases", () => {
    const p = presetFor(DOMAINS.grinds, "beginner");
    expect(p.stances).toEqual(["regular", "fakie"]);
    expect(p.bases).toEqual(["50-50", "boardslide", "noseslide", "5-0", "nosegrind"]);
  });

  it("advanced: everything", () => {
    const p = presetFor(DOMAINS.grinds, "advanced");
    expect(p.bases).toEqual(DOMAINS.grinds.bases.map((b) => b.id));
  });
});
