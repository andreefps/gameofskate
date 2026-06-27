import { describe, expect, it } from "vitest";

import { enumerate } from "@/lib/skate/enumerate";
import type { Domain, Trick } from "@/lib/skate/types";

const TEST_DOMAIN: Domain = {
  id: "flatground",
  label: "Test",
  stances: ["regular", "switch"],
  bases: [
    { id: "ollie", name: "Ollie", base: 1, dir: "none" },
    { id: "shuv", name: "Shuvit", base: 2, dir: "optional" },
    { id: "one80", name: "180", base: 2, dir: "required" },
  ],
};

function find(tricks: Trick[], id: string): Trick {
  const t = tricks.find((x) => x.id === id);
  if (!t) throw new Error(`missing trick ${id}`);
  return t;
}

describe("enumerate", () => {
  const tricks = enumerate(TEST_DOMAIN);

  it("expands stance x base x dir (none=1, optional=2, required=2)", () => {
    // 2 stances * (1 + 2 + 2) = 10
    expect(tricks).toHaveLength(10);
  });

  it("omits the regular stance from names and emits no direction for dir:none", () => {
    const ollie = find(tricks, "flatground:regular:ollie:x");
    expect(ollie.name).toBe("Ollie");
    expect(ollie.dir).toBeUndefined();
    expect(ollie.difficulty).toBe(1);
  });

  it("adds the stance modifier to difficulty and prefixes the name", () => {
    const sw = find(tricks, "flatground:switch:ollie:x");
    expect(sw.name).toBe("Switch Ollie");
    expect(sw.difficulty).toBe(4); // 1 + switch(3)
  });

  it("expands optional bases into Frontside and Backside variants", () => {
    expect(find(tricks, "flatground:regular:shuv:fs").name).toBe("Frontside Shuvit");
    expect(find(tricks, "flatground:regular:shuv:bs").name).toBe("Backside Shuvit");
  });

  it("composes stance + direction + base in order", () => {
    const t = find(tricks, "flatground:switch:one80:bs");
    expect(t.name).toBe("Switch Backside 180");
    expect(t.difficulty).toBe(5); // 2 + switch(3)
  });

  it("never emits a required-direction trick without a direction", () => {
    const required = tricks.filter((t) => t.base === "one80");
    expect(required).toHaveLength(4); // 2 stances * fs/bs
    expect(required.every((t) => t.dir === "fs" || t.dir === "bs")).toBe(true);
    expect(tricks.some((t) => t.name === "180" || t.name === "Switch 180")).toBe(false);
  });

  it("produces unique stable ids", () => {
    const ids = new Set(tricks.map((t) => t.id));
    expect(ids.size).toBe(tricks.length);
  });

  it("memoizes per domain (same reference on repeat calls)", () => {
    expect(enumerate(TEST_DOMAIN)).toBe(enumerate(TEST_DOMAIN));
  });

  it("clamps difficulty to at least 1", () => {
    const zeroDomain: Domain = {
      id: "grinds",
      label: "Zero",
      stances: ["regular"],
      bases: [{ id: "z", name: "Z", base: 0, dir: "none" }],
    };
    expect(enumerate(zeroDomain)[0]?.difficulty).toBe(1);
  });
});
