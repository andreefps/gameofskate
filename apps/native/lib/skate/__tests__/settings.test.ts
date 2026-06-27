import { describe, expect, it } from "vitest";

import { DOMAINS } from "@/lib/skate/domains";
import { hydrate, makeDefaultSettings, settingsReducer } from "@/lib/skate/settings";
import type { Settings, SettingsAction } from "@/lib/skate/settings";

function run(state: Settings, ...actions: SettingsAction[]): Settings {
  return actions.reduce(settingsReducer, state);
}

describe("makeDefaultSettings", () => {
  const d = makeDefaultSettings();

  it("starts on flatground with haptics on", () => {
    expect(d.activeDomain).toBe("flatground");
    expect(d.hapticsEnabled).toBe(true);
  });

  it("defaults each domain to Advanced with everything enabled", () => {
    expect(d.domains.flatground.difficulty).toBe("advanced");
    expect(d.domains.flatground.enabledStances).toHaveLength(4);
    expect(d.domains.flatground.enabledBases).toHaveLength(DOMAINS.flatground.bases.length);
    expect(d.domains.grinds.enabledBases).toHaveLength(DOMAINS.grinds.bases.length);
  });

  it("returns a fresh object each call", () => {
    expect(makeDefaultSettings()).not.toBe(makeDefaultSettings());
    expect(makeDefaultSettings().domains.flatground).not.toBe(d.domains.flatground);
  });
});

describe("settingsReducer", () => {
  it("switches the active domain", () => {
    expect(run(makeDefaultSettings(), { type: "setActiveDomain", domain: "grinds" }).activeDomain).toBe(
      "grinds",
    );
  });

  it("toggles haptics", () => {
    expect(run(makeDefaultSettings(), { type: "toggleHaptics" }).hapticsEnabled).toBe(false);
  });

  describe("setDifficulty applies the preset", () => {
    const beginner = run(makeDefaultSettings(), {
      type: "setDifficulty",
      domain: "flatground",
      tier: "beginner",
    });

    it("stores the level and enables only that level's stances/bases", () => {
      expect(beginner.domains.flatground.difficulty).toBe("beginner");
      expect(beginner.domains.flatground.enabledStances).toEqual(["regular", "fakie"]);
      expect(beginner.domains.flatground.enabledBases).toEqual([
        "ollie",
        "shuvit",
        "180",
        "kickflip",
        "heelflip",
      ]);
    });

    it("leaves the other domain untouched", () => {
      expect(beginner.domains.grinds.difficulty).toBe("advanced");
    });
  });

  it("lets the user customize after a difficulty change without moving the level", () => {
    const customized = run(
      makeDefaultSettings(),
      { type: "setDifficulty", domain: "flatground", tier: "beginner" },
      { type: "toggleStance", domain: "flatground", stance: "switch" },
      { type: "toggleBase", domain: "flatground", base: "laser-flip" },
    );
    expect(customized.domains.flatground.difficulty).toBe("beginner");
    expect(customized.domains.flatground.enabledStances).toContain("switch");
    expect(customized.domains.flatground.enabledBases).toContain("laser-flip");
  });

  it("re-applying a difficulty overwrites customizations", () => {
    const reapplied = run(
      makeDefaultSettings(),
      { type: "setDifficulty", domain: "flatground", tier: "beginner" },
      { type: "toggleStance", domain: "flatground", stance: "switch" },
      { type: "setDifficulty", domain: "flatground", tier: "beginner" },
    );
    expect(reapplied.domains.flatground.enabledStances).toEqual(["regular", "fakie"]);
  });

  it("removes a stance and refuses to remove the last one", () => {
    const oneLeft = run(
      makeDefaultSettings(),
      { type: "toggleStance", domain: "flatground", stance: "fakie" },
      { type: "toggleStance", domain: "flatground", stance: "switch" },
      { type: "toggleStance", domain: "flatground", stance: "nollie" },
    );
    expect(oneLeft.domains.flatground.enabledStances).toEqual(["regular"]);
    const stillOne = run(oneLeft, { type: "toggleStance", domain: "flatground", stance: "regular" });
    expect(stillOne.domains.flatground.enabledStances).toEqual(["regular"]);
  });

  it("removes a base and refuses to remove the last one", () => {
    const start = makeDefaultSettings();
    const off = run(start, { type: "toggleBase", domain: "flatground", base: "ollie" });
    expect(off.domains.flatground.enabledBases).not.toContain("ollie");
    expect(off.domains.flatground.enabledBases.length).toBe(
      start.domains.flatground.enabledBases.length - 1,
    );
  });

  it("does not mutate the input state", () => {
    const start = makeDefaultSettings();
    const snapshot = JSON.stringify(start);
    run(start, { type: "setDifficulty", domain: "flatground", tier: "beginner" });
    expect(JSON.stringify(start)).toBe(snapshot);
  });

  it("reset restores the true default", () => {
    const changed = run(makeDefaultSettings(), { type: "setDifficulty", domain: "flatground", tier: "beginner" });
    expect(run(changed, { type: "reset" })).toEqual(makeDefaultSettings());
  });
});

describe("hydrate", () => {
  it("falls back to defaults for non-object input", () => {
    expect(hydrate(null)).toEqual(makeDefaultSettings());
    expect(hydrate("garbage")).toEqual(makeDefaultSettings());
    expect(hydrate(42)).toEqual(makeDefaultSettings());
  });

  it("fills missing fields from defaults", () => {
    expect(hydrate({})).toEqual(makeDefaultSettings());
  });

  it("round-trips a valid settings object", () => {
    const s = run(makeDefaultSettings(), { type: "toggleHaptics" }, {
      type: "setDifficulty",
      domain: "grinds",
      tier: "beginner",
    });
    expect(hydrate(JSON.parse(JSON.stringify(s)))).toEqual(s);
  });

  it("keeps valid scalars and defaults invalid ones", () => {
    expect(hydrate({ hapticsEnabled: false }).hapticsEnabled).toBe(false);
    expect(hydrate({ activeDomain: "xyz" }).activeDomain).toBe("flatground");
    expect(hydrate({ domains: { flatground: { difficulty: "pro" } } }).domains.flatground.difficulty).toBe(
      "advanced",
    );
    expect(
      hydrate({ domains: { flatground: { difficulty: "beginner" } } }).domains.flatground.difficulty,
    ).toBe("beginner");
  });

  it("drops stale base ids but keeps valid ones", () => {
    const h = hydrate({ domains: { flatground: { enabledBases: ["ollie", "ghost-trick"] } } });
    expect(h.domains.flatground.enabledBases).toEqual(["ollie"]);
  });

  it("falls back to default bases when filtering empties the list", () => {
    const h = hydrate({ domains: { flatground: { enabledBases: ["ghost-trick"] } } });
    expect(h.domains.flatground.enabledBases).toHaveLength(DOMAINS.flatground.bases.length);
  });

  it("ignores an old `tiers` field from a previous version", () => {
    const h = hydrate({ domains: { flatground: { enabledBases: ["ollie"], tiers: ["beginner"] } } });
    expect(h.domains.flatground.enabledBases).toEqual(["ollie"]);
    expect(h.domains.flatground.difficulty).toBe("advanced");
    expect(h.domains.flatground).not.toHaveProperty("tiers");
  });
});
