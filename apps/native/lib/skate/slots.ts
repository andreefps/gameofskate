import { DIR_WORD } from "@/lib/skate/enumerate";
import { stancePrefix } from "@/lib/skate/stance";
import type { BaseTrick, Domain, Stance, Trick } from "@/lib/skate/types";

export type SlotKind = "stance" | "dir" | "rotation" | "trick";

/** One semantic part of a trick name; `words` keep display case ("Varial", "Kickflip"). */
export type Slot = { kind: SlotKind; words: string[] };

const ROTATION = /^(180|360|540|720)\b/;

function splitBase(name: string): { rotation?: string; trick?: string } {
  const m = ROTATION.exec(name);
  if (!m) return { trick: name };
  const rest = name.slice(m[0].length).trim();
  return { rotation: m[0], ...(rest ? { trick: rest } : {}) };
}

function slot(kind: SlotKind, text: string | undefined): Slot[] {
  return text ? [{ kind, words: text.split(" ") }] : [];
}

/**
 * Split a trick's name into ordered semantic slots: stance, direction, rotation, trick.
 * Empty parts are omitted. A stance name override (nollie Ollie = "Nollie") is the
 * stance slot when it is just the stance prefix, otherwise it is the trick slot and
 * is placed before the direction, as in the composed name.
 * Invariant: the slots' words joined with spaces equal `trick.name`.
 */
export function trickSlots(trick: Trick, domain: Domain): Slot[] {
  const base = domain.bases.find((b) => b.id === trick.base);
  if (!base) throw new Error(`Unknown base "${trick.base}" in domain "${domain.id}"`);
  const prefix = stancePrefix(trick.stance);
  const dir = slot("dir", trick.dir ? DIR_WORD[trick.dir] : undefined);
  const override = base.stanceNames?.[trick.stance];
  if (override !== undefined) {
    return [...slot(override === prefix ? "stance" : "trick", override), ...dir];
  }
  const { rotation, trick: rest } = splitBase(base.name);
  return [...slot("stance", prefix), ...dir, ...slot("rotation", rotation), ...slot("trick", rest)];
}

function overrides(base: BaseTrick, stances: Stance[]): string[] {
  return stances.flatMap((s) => {
    const o = base.stanceNames?.[s];
    return o !== undefined && o !== stancePrefix(s) ? [o] : [];
  });
}

/** Filler values per slot kind (space-joined, deduped) for a domain. */
export function slotVocab(domain: Domain): Record<SlotKind, string[]> {
  const stance = domain.stances.filter((s) => s !== "regular").map(stancePrefix);
  const rotation: string[] = [];
  const trick: string[] = [];
  for (const base of domain.bases) {
    const parts = splitBase(base.name);
    if (parts.rotation) rotation.push(parts.rotation);
    if (parts.trick) trick.push(parts.trick);
    trick.push(...overrides(base, domain.stances));
  }
  return {
    stance: [...new Set(stance)],
    dir: Object.values(DIR_WORD),
    rotation: [...new Set(rotation)],
    trick: [...new Set(trick)],
  };
}
