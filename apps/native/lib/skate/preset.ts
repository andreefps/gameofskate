import { STANCE_MOD } from "@/lib/skate/stance";
import { TIERS } from "@/lib/skate/tier";
import type { Domain, Stance, Tier } from "@/lib/skate/types";

/** Which difficulty level a stance belongs to (regular/fakie=0, nollie=1, switch=2). */
function stanceTierIndex(stance: Stance): number {
  const mod = STANCE_MOD[stance];
  return mod <= 1 ? 0 : mod === 2 ? 1 : 2;
}

/** Which difficulty level a base trick belongs to, by its base difficulty. */
function baseTierIndex(baseDifficulty: number): number {
  return baseDifficulty <= 3 ? 0 : baseDifficulty <= 5 ? 1 : 2;
}

export type Preset = { stances: Stance[]; bases: string[] };

/**
 * The curated set of stances + base tricks enabled at a difficulty level.
 * Cumulative: each level includes everything from the levels below it.
 * Advanced enables the whole domain.
 */
export function presetFor(domain: Domain, tier: Tier): Preset {
  const level = TIERS.indexOf(tier);
  return {
    stances: domain.stances.filter((s) => stanceTierIndex(s) <= level),
    bases: domain.bases.filter((b) => baseTierIndex(b.base) <= level).map((b) => b.id),
  };
}
