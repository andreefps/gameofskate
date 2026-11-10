export const SPIN_DEFAULT_STRENGTH = 0.4;
const LINE0_BASE_MS = 650;
const LINE0_EXTRA_MS = 250;
const STAGGER_MS = 140;
const MAX_TOTAL_MS = 1300;
const MS_PER_FILLER = 90;
const MIN_FILLERS = 8;
const MAX_FILLERS = 14;

export type ReelPlan = {
  /** Spin duration (ms) per line; line 0 stops first. */
  durations: number[];
  /** Filler words per line (the final word is not included). */
  fillerCounts: number[];
  /** Duration of the last reel; meta fades in after this. */
  total: number;
};

/** Flick speed (px/s, any sign) -> 0..1 strength. Anything past the commit velocity is at least the default. */
export function spinStrength(velocity: number): number {
  const v = Math.abs(velocity);
  return Math.min(1, Math.max(SPIN_DEFAULT_STRENGTH, (v - 500) / 1500));
}

/** Cascade timing: line i stops STAGGER_MS after line i-1, last line capped at MAX_TOTAL_MS. */
export function reelPlan(lineCount: number, strength: number): ReelPlan {
  const s = Math.min(1, Math.max(0, strength));
  const d0 = LINE0_BASE_MS + LINE0_EXTRA_MS * s;
  const stagger = lineCount > 1 ? Math.min(STAGGER_MS, (MAX_TOTAL_MS - d0) / (lineCount - 1)) : 0;
  const durations = Array.from({ length: lineCount }, (_, i) => Math.round(d0 + i * stagger));
  const fillerCounts = durations.map((d) =>
    Math.min(MAX_FILLERS, Math.max(MIN_FILLERS, Math.round(d / MS_PER_FILLER))),
  );
  return { durations, fillerCounts, total: durations[lineCount - 1] ?? 0 };
}

/**
 * Pick `count` filler words for a reel column: each fits `maxChars`, no word twice in a
 * row, and the last filler differs from `final` (so the landing word never repeats).
 * Falls back to repeating what fits (or `final`) when the candidate list is too small.
 */
export function pickFillers(
  words: readonly string[],
  final: string,
  count: number,
  maxChars: number,
  rng: () => number = Math.random,
): string[] {
  const fits = [...new Set(words)].filter((w) => w.length > 0 && w.length <= maxChars);
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
