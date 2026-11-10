import { describe, expect, it } from "vitest";

import { DOMAINS } from "@/lib/skate/domains";
import { enumerate } from "@/lib/skate/enumerate";
import { slotVocab, trickSlots } from "@/lib/skate/slots";

function slotsOf(domain: "flatground" | "grinds", name: string) {
  const d = DOMAINS[domain];
  const t = enumerate(d).find((x) => x.name === name);
  if (!t) throw new Error(`no trick ${name}`);
  return trickSlots(t, d).map((s) => [s.kind, s.words.join(" ")]);
}

describe("trickSlots", () => {
  it("flattens back to the trick name for every trick of every domain", () => {
    for (const d of Object.values(DOMAINS)) {
      for (const t of enumerate(d)) {
        expect(trickSlots(t, d).flatMap((s) => s.words).join(" ")).toBe(t.name);
      }
    }
  });

  it("splits stance, direction, rotation and trick", () => {
    expect(slotsOf("flatground", "Nollie Backside 360 Shuvit")).toEqual([
      ["stance", "Nollie"],
      ["dir", "Backside"],
      ["rotation", "360"],
      ["trick", "Shuvit"],
    ]);
  });

  it("omits empty parts", () => {
    expect(slotsOf("flatground", "Frontside 180")).toEqual([
      ["dir", "Frontside"],
      ["rotation", "180"],
    ]);
    expect(slotsOf("flatground", "Nollie")).toEqual([["stance", "Nollie"]]);
    expect(slotsOf("flatground", "Kickflip")).toEqual([["trick", "Kickflip"]]);
    expect(slotsOf("flatground", "Backside Flip")).toEqual([
      ["dir", "Backside"],
      ["trick", "Flip"],
    ]);
  });

  it("handles grinds", () => {
    expect(slotsOf("grinds", "Switch Frontside Crooked Grind")).toEqual([
      ["stance", "Switch"],
      ["dir", "Frontside"],
      ["trick", "Crooked Grind"],
    ]);
  });
});

describe("slotVocab", () => {
  it("collects per-kind fillers", () => {
    const v = slotVocab(DOMAINS.flatground);
    expect(v.stance).toEqual(["Fakie", "Switch", "Nollie"]);
    expect(v.dir).toEqual(["Frontside", "Backside"]);
    expect(v.rotation).toEqual(["180", "360"]);
    expect(v.trick).toContain("Varial Kickflip");
    expect(v.trick).toContain("Flip");
    expect(v.trick).not.toContain("360 Flip");
    expect(new Set(v.trick).size).toBe(v.trick.length);
    expect(slotVocab(DOMAINS.grinds).rotation).toEqual([]);
    expect(slotVocab(DOMAINS.grinds).trick).toContain("Boardslide");
  });
});
