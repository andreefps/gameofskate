import { enumerate } from "@/lib/skate/enumerate";
import type { Domain, DomainSettings, Trick } from "@/lib/skate/types";

/** All enabled tricks for a domain, filtered by the enabled stances and bases. */
export function buildPool(domain: Domain, settings: DomainSettings): Trick[] {
  return enumerate(domain).filter(
    (t) => settings.enabledStances.includes(t.stance) && settings.enabledBases.includes(t.base),
  );
}

/**
 * Weighted-random pick from a pool. Easier tricks are weighted more heavily
 * (harder = rarer). Never repeats `lastId` unless the pool has a single trick.
 * Returns null for an empty pool. `rng` returns a float in [0, 1).
 */
export function pick(
  pool: Trick[],
  lastId: string | undefined,
  rng: () => number = Math.random,
): Trick | null {
  if (pool.length === 0) return null;

  const candidates =
    pool.length > 1 ? pool.filter((t) => t.id !== lastId) : pool;

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
