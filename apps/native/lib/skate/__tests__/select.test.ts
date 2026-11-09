import { describe, expect, it } from "vitest";

import { enumerate } from "@/lib/skate/enumerate";
import { buildPool, pick, RECENT_WINDOW } from "@/lib/skate/select";
import type { Domain, DomainSettings, Trick } from "@/lib/skate/types";

const DOMAIN: Domain = {
  id: "flatground",
  label: "Test",
  stances: ["regular", "switch"],
  bases: [
    { id: "ollie", name: "Ollie", base: 1, dir: "none" }, // reg=1 beg, sw=4 beg
    { id: "tre", name: "360 Flip", base: 6, dir: "none" }, // reg=6 int, sw=9 adv
  ],
};

const ALL: DomainSettings = {
  difficulty: "advanced",
  enabledStances: ["regular", "switch"],
  enabledBases: ["ollie", "tre"],
};

function trick(id: string, difficulty: number): Trick {
  return { id, domain: "flatground", name: id, difficulty, stance: "regular", base: id };
}

describe("buildPool", () => {
  it("returns the full enumeration when everything is enabled", () => {
    expect(buildPool(DOMAIN, ALL)).toHaveLength(enumerate(DOMAIN).length); // 4
  });

  it("filters by enabled stances", () => {
    const pool = buildPool(DOMAIN, { ...ALL, enabledStances: ["regular"] });
    expect(pool.every((t) => t.stance === "regular")).toBe(true);
    expect(pool).toHaveLength(2);
  });

  it("filters by enabled bases", () => {
    const pool = buildPool(DOMAIN, { ...ALL, enabledBases: ["ollie"] });
    expect(pool.every((t) => t.base === "ollie")).toBe(true);
    expect(pool).toHaveLength(2);
  });

  it("can produce an empty pool", () => {
    expect(buildPool(DOMAIN, { ...ALL, enabledBases: [] })).toHaveLength(0);
  });
});

describe("pick", () => {
  it("returns null for an empty pool", () => {
    expect(pick([], [])).toBeNull();
  });

  it("returns the only trick even when it is recent (single-item pool)", () => {
    const a = trick("a", 1);
    expect(pick([a], ["a"])).toBe(a);
  });

  it("never returns the previous trick when the pool has more than one", () => {
    const a = trick("a", 1);
    const b = trick("b", 1);
    expect(pick([a, b], ["a"], () => 0)).toBe(b);
    expect(pick([a, b], ["a"], () => 0.999)).toBe(b);
  });

  it("weights easier tricks more heavily", () => {
    const easy = trick("easy", 1); // weight = max(9)-1+1 = 9
    const hard = trick("hard", 9); // weight = 9-9+1 = 1, total = 10
    // cumulative: easy covers [0,9), hard covers [9,10)
    expect(pick([easy, hard], [], () => 0)?.id).toBe("easy");
    expect(pick([easy, hard], [], () => 0.85)?.id).toBe("easy");
    expect(pick([easy, hard], [], () => 0.95)?.id).toBe("hard");
  });
});

describe("pick history window", () => {
  const pool = ["a", "b", "c", "d", "e", "f"].map((id) => trick(id, 1));

  it("excludes all recent ids up to half the pool", () => {
    for (const r of [0, 0.2, 0.5, 0.99]) {
      const p = pick(pool, ["a", "b", "c"], () => r);
      expect(["d", "e", "f"]).toContain(p?.id);
    }
  });

  it("caps the excluded window at floor(pool/2), keeping the most recent", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) seen.add(pick(pool, ["a", "b", "c", "d", "e"], () => i / 100)!.id);
    expect(seen.has("a")).toBe(false);
    expect(seen.has("b")).toBe(false);
    expect(seen.has("c")).toBe(false);
    expect(seen.has("d")).toBe(true);
  });

  it("works with a pair pool and long history", () => {
    const [a, b] = pool;
    expect(pick([a!, b!], ["a", "b"], () => 0)?.id).toBe("b");
  });

  it("exports a window constant", () => {
    expect(RECENT_WINDOW).toBe(8);
  });
});
