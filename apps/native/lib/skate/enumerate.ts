import { STANCE_MOD, stancePrefix } from "@/lib/skate/stance";
import type { Dir, Domain, Stance, Trick } from "@/lib/skate/types";

const cache = new WeakMap<Domain, Trick[]>();

const DIR_WORD: Record<Dir, string> = { fs: "Frontside", bs: "Backside" };

function composeName(stance: Stance, dir: Dir | undefined, baseName: string): string {
  return [stancePrefix(stance), dir ? DIR_WORD[dir] : "", baseName]
    .filter(Boolean)
    .join(" ");
}

/**
 * Expand a domain's components (stance x base x direction) into the full set of
 * valid, named, difficulty-scored tricks. Result is memoized per domain object.
 */
export function enumerate(domain: Domain): Trick[] {
  const cached = cache.get(domain);
  if (cached) return cached;

  const tricks: Trick[] = [];

  for (const stance of domain.stances) {
    const stanceMod = STANCE_MOD[stance];
    for (const base of domain.bases) {
      const dirs: (Dir | undefined)[] =
        base.dir === "none" ? [undefined] : ["fs", "bs"];
      for (const dir of dirs) {
        tricks.push({
          id: `${domain.id}:${stance}:${base.id}:${dir ?? "x"}`,
          domain: domain.id,
          name: composeName(stance, dir, base.name),
          difficulty: Math.max(1, base.base + stanceMod),
          stance,
          base: base.id,
          ...(dir ? { dir } : {}),
        });
      }
    }
  }

  cache.set(domain, tricks);
  return tricks;
}
