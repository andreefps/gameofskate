import { STANCE_MOD, stancePrefix } from "@/lib/skate/stance";
import type { BaseTrick, Dir, Domain, Stance, Trick } from "@/lib/skate/types";

const cache = new WeakMap<Domain, Trick[]>();

export const DIR_WORD: Record<Dir, string> = { fs: "Frontside", bs: "Backside" };

function composeName(stance: Stance, dir: Dir | undefined, base: BaseTrick): string {
  const override = base.stanceNames?.[stance];
  const head = override ?? stancePrefix(stance);
  const tail = override !== undefined ? "" : base.name;
  return [head, dir ? DIR_WORD[dir] : "", tail].filter(Boolean).join(" ");
}

type AliasRule = { stance: Stance; base: string; dir?: Dir; alias: string };

/** Well-known trick nicknames. `dir` omitted = matches tricks without direction. */
const ALIAS_RULES: AliasRule[] = [
  { stance: "fakie", base: "180", dir: "bs", alias: "Half Cab" },
  { stance: "fakie", base: "360", dir: "bs", alias: "Full Cab" },
  { stance: "fakie", base: "180-kickflip", dir: "bs", alias: "Half Cab Flip" },
  { stance: "regular", base: "360-flip", alias: "Tre Flip" },
  { stance: "nollie", base: "360-flip", alias: "Nollie Tre Flip" },
  { stance: "switch", base: "360-flip", alias: "Switch Tre Flip" },
  { stance: "fakie", base: "360-flip", alias: "Fakie Tre Flip" },
];

function aliasFor(stance: Stance, base: string, dir: Dir | undefined): string | undefined {
  return ALIAS_RULES.find((r) => r.stance === stance && r.base === base && r.dir === dir)?.alias;
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
        const alias = domain.id === "flatground" ? aliasFor(stance, base.id, dir) : undefined;
        tricks.push({
          id: `${domain.id}:${stance}:${base.id}:${dir ?? "x"}`,
          domain: domain.id,
          name: composeName(stance, dir, base),
          difficulty: Math.max(1, base.base + stanceMod),
          stance,
          base: base.id,
          ...(dir ? { dir } : {}),
          ...(alias ? { alias } : {}),
        });
      }
    }
  }

  cache.set(domain, tricks);
  return tricks;
}
