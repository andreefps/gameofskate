export type TrickByTurn = Record<number, string>;

export const TURN_MAP_CAP = 40;

/** Remember the trick for a turn, keeping only the most recent `cap` turns. */
export function rememberTrick(map: TrickByTurn, turn: number, id: string, cap = TURN_MAP_CAP): TrickByTurn {
  const next: TrickByTurn = { ...map, [turn]: id };
  const turns = Object.keys(next).map(Number).sort((a, b) => a - b);
  for (const t of turns.slice(0, Math.max(0, turns.length - cap))) delete next[t];
  return next;
}

/** Drop entries for turns after `turn` (they belong to an undone future). */
export function forgetAfter(map: TrickByTurn, turn: number): TrickByTurn {
  const next: TrickByTurn = {};
  for (const [k, v] of Object.entries(map)) if (Number(k) <= turn) next[Number(k)] = v;
  return next;
}

export function hydrateTrickMap(raw: unknown): TrickByTurn {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: TrickByTurn = {};
  for (const [k, v] of Object.entries(raw)) {
    const t = Number(k);
    if (Number.isInteger(t) && t >= 0 && typeof v === "string") out[t] = v;
  }
  return out;
}

export function hydrateNames(raw: unknown, max: number): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every((n) => typeof n === "string")) return null;
  return (raw as string[]).slice(0, max);
}
