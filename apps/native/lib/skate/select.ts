import { enumerate } from "@/lib/skate/enumerate";
import { tierOf } from "@/lib/skate/tier";
import type { Domain, DomainSettings, Tier, Trick } from "@/lib/skate/types";

/** All enabled tricks for a domain, filtered by the enabled stances and bases. */
export function buildPool(domain: Domain, settings: DomainSettings): Trick[] {
  return enumerate(domain).filter(
    (t) => settings.enabledStances.includes(t.stance) && settings.enabledBases.includes(t.base),
  );
}

/** Suggested length of the recent-trick history to pass to `pick`. */
export const RECENT_WINDOW = 8;

/** Pool size and per-tier counts (for settings UI). */
export function poolStats(pool: Trick[]): { count: number; byTier: Record<Tier, number> } {
  const byTier: Record<Tier, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const t of pool) byTier[tierOf(t.difficulty)]++;
  return { count: pool.length, byTier };
}

/**
 * Weighted-random pick from a pool. Easier tricks are weighted more heavily
 * (harder = rarer). Excludes the most recent ids (`recentIds` is most-recent-first),
 * using at most min(recentIds.length, floor(pool.length / 2)) of them so small
 * pools still work. Returns null for an empty pool. `rng` returns [0, 1).
 */
export function pick(
  pool: Trick[],
  recentIds: readonly string[],
  rng: () => number = Math.random,
): Trick | null {
  if (pool.length === 0) return null;

  const window = Math.min(recentIds.length, Math.floor(pool.length / 2));
  const excluded = new Set(recentIds.slice(0, window));
  const filtered = pool.filter((t) => !excluded.has(t.id));
  const candidates = filtered.length > 0 ? filtered : pool;

  const maxDiff = candidates.reduce((m, t) => Math.max(m, t.difficulty), 0);
  const weights = candidates.map((t) => maxDiff - t.difficulty + 1);
  const total = weights.reduce((sum, w) => sum + w, 0);

  let roll = rng() * total;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll < 0) return candidates[i] ?? null;
  }
  return candidates[candidates.length - 1] ?? null;
}
