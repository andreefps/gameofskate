import { describe, expect, it } from "vitest";

import { DOMAINS } from "@/lib/skate/domains";
import { enumerate } from "@/lib/skate/enumerate";
import type { Domain, Trick } from "@/lib/skate/types";

function names(tricks: Trick[]): string[] {
  return tricks.map((t) => t.name);
}

function diffOf(tricks: Trick[], name: string): number {
  const t = tricks.find((x) => x.name === name);
  if (!t) throw new Error(`missing trick "${name}"`);
  return t.difficulty;
}

describe("DOMAINS registry", () => {
  it("exposes flatground and grinds with matching ids", () => {
    expect(DOMAINS.flatground.id).toBe("flatground");
    expect(DOMAINS.grinds.id).toBe("grinds");
  });

  it("uses all four stances per domain", () => {
    for (const d of Object.values(DOMAINS) as Domain[]) {
      expect([...d.stances].sort()).toEqual(["fakie", "nollie", "regular", "switch"]);
    }
  });

  it("has unique base ids within each domain", () => {
    for (const d of Object.values(DOMAINS) as Domain[]) {
      const ids = d.bases.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("flatground enumeration", () => {
  const tricks = enumerate(DOMAINS.flatground);

  it("enumerates 104 tricks (26 variants x 4 stances)", () => {
    expect(tricks).toHaveLength(104);
  });

  it("names combinatorial tricks correctly", () => {
    expect(names(tricks)).toContain("Kickflip");
    expect(names(tricks)).toContain("Switch Laser Flip");
    expect(names(tricks)).toContain("Nollie Backside 360 Shuvit");
    expect(names(tricks)).toContain("Fakie Frontside Bigspin");
  });

  it("derives difficulty from base + stance", () => {
    expect(diffOf(tricks, "Kickflip")).toBe(3);
    expect(diffOf(tricks, "360 Flip")).toBe(6);
    expect(diffOf(tricks, "Switch Laser Flip")).toBe(10); // 7 + 3
    expect(diffOf(tricks, "Nollie Backside 360 Shuvit")).toBe(6); // 4 + 2
  });

  it("never emits a bare required-direction trick", () => {
    expect(names(tricks)).not.toContain("180");
    expect(names(tricks)).not.toContain("Bigspin");
    expect(names(tricks)).toContain("Frontside 180");
    expect(names(tricks)).toContain("Backside Bigspin");
  });
});

describe("flatground naming + aliases", () => {
  const tricks = enumerate(DOMAINS.flatground);
  const byName = (n: string) => tricks.find((t) => t.name === n);

  it("names nollie ollie just Nollie, keeps Fakie/Switch Ollie", () => {
    expect(byName("Nollie")?.id).toBe("flatground:nollie:ollie:x");
    expect(byName("Nollie Ollie")).toBeUndefined();
    expect(byName("Fakie Ollie")).toBeDefined();
    expect(byName("Switch Ollie")).toBeDefined();
  });

  it("generates the new classic tricks", () => {
    for (const n of [
      "Frontside Flip", "Backside Flip", "Switch Frontside Flip",
      "Frontside Heelflip", "Backside Heelflip", "Frontside 360", "Backside 360",
      "Double Kickflip", "Shuvit".replace("Shuvit", "Frontside Shuvit"),
    ]) expect(byName(n), n).toBeDefined();
    expect(byName("Flip")).toBeUndefined();
    expect(byName("360")).toBeUndefined();
  });

  it("keeps bases sorted by base difficulty", () => {
    const b = DOMAINS.flatground.bases.map((x) => x.base);
    expect(b).toEqual([...b].sort((x, y) => x - y));
  });

  it("assigns aliases from the rule table", () => {
    expect(byName("Fakie Backside 180")?.alias).toBe("Half Cab");
    expect(byName("Fakie Backside 360")?.alias).toBe("Full Cab");
    expect(byName("Fakie Backside Flip")?.alias).toBe("Half Cab Flip");
    expect(byName("360 Flip")?.alias).toBe("Tre Flip");
    expect(byName("Nollie 360 Flip")?.alias).toBe("Nollie Tre Flip");
    expect(byName("Switch 360 Flip")?.alias).toBe("Switch Tre Flip");
    expect(byName("Fakie 360 Flip")?.alias).toBe("Fakie Tre Flip");
    expect(byName("Backside 180")?.alias).toBeUndefined();
    expect(tricks.filter((t) => t.alias)).toHaveLength(7);
  });
});

describe("grinds enumeration", () => {
  const tricks = enumerate(DOMAINS.grinds);

  it("enumerates 96 tricks (24 variants x 4 stances)", () => {
    expect(tricks).toHaveLength(96);
  });

  it("names ledge/rail tricks correctly", () => {
    expect(names(tricks)).toContain("Backside 50-50");
    expect(names(tricks)).toContain("Switch Frontside Boardslide");
    expect(names(tricks)).toContain("Nollie Frontside Crooked Grind");
  });

  it("derives difficulty from base + stance", () => {
    expect(diffOf(tricks, "Backside 50-50")).toBe(1);
    expect(diffOf(tricks, "Switch Frontside Boardslide")).toBe(5); // 2 + 3
  });
});
