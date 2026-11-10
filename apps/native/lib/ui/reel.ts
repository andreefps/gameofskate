export const SPIN_DEFAULT_STRENGTH = 0.4;
const SLOT0_BASE_MS = 600;
const SLOT0_EXTRA_MS = 200;
const STAGGER_MS = 200;
const MAX_TOTAL_MS = 1500;
const MS_PER_FILLER = 90;
const MIN_FILLERS = 8;
const MAX_FILLERS = 14;

export type ReelPlan = {
  /** Spin duration (ms) per slot; slot 0 stops first. */
  durations: number[];
  /** Fillers per slot (the final value is not included). */
  fillerCounts: number[];
  /** Duration of the last reel; meta fades in after this. */
  total: number;
};

/** Flick speed (px/s, any sign) -> 0..1 strength. Anything past the commit velocity is at least the default. */
export function spinStrength(velocity: number): number {
  const v = Math.abs(velocity);
  return Math.min(1, Math.max(SPIN_DEFAULT_STRENGTH, (v - 500) / 1500));
}

/** Cascade timing: slot i stops STAGGER_MS after slot i-1, last slot capped at MAX_TOTAL_MS. */
export function reelPlan(slotCount: number, strength: number): ReelPlan {
  const s = Math.min(1, Math.max(0, strength));
  const d0 = SLOT0_BASE_MS + SLOT0_EXTRA_MS * s;
  const stagger = slotCount > 1 ? Math.min(STAGGER_MS, (MAX_TOTAL_MS - d0) / (slotCount - 1)) : 0;
  const durations = Array.from({ length: slotCount }, (_, i) => Math.round(d0 + i * stagger));
  const fillerCounts = durations.map((d) =>
    Math.min(MAX_FILLERS, Math.max(MIN_FILLERS, Math.round(d / MS_PER_FILLER))),
  );
  return { durations, fillerCounts, total: durations[slotCount - 1] ?? 0 };
}

/**
 * Filler candidates for a reel `lineCount` lines tall: entries (space-joined words) with at
 * most `lineCount` words, every word within `maxChars`. Exactly-`lineCount`-word entries win
 * when there are at least 3 of them.
 */
export function fillerCandidates(vocab: readonly string[], lineCount: number, maxChars: number): string[] {
  const fits = [...new Set(vocab)].filter((v) => {
    const words = v.split(" ");
    return words.length <= lineCount && words.every((w) => w.length > 0 && w.length <= maxChars);
  });
  const exact = fits.filter((v) => v.split(" ").length === lineCount);
  return exact.length >= 3 ? exact : fits;
}

/**
 * Pick `count` fillers for a reel column: no value twice in a
 * row, and the last filler differs from `final` (so the landing value never repeats).
 * Falls back to repeating the candidates (or `final`) when the list is too small.
 */
export function pickFillers(
  candidates: readonly string[],
  final: string,
  count: number,
  rng: () => number = Math.random,
): string[] {
  const fits = [...new Set(candidates)].filter((w) => w.length > 0);
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const avoid = new Set<string>();
    if (out.length > 0) avoid.add(out[out.length - 1]);
    if (i === count - 1) avoid.add(final);
    let options = fits.filter((w) => !avoid.has(w));
    if (options.length === 0) options = fits.length > 0 ? fits : [final];
    out.push(options[Math.min(options.length - 1, Math.floor(rng() * options.length))]);
  }
  return out;
}
