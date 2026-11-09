export type HeroFit = { fontSize: number; lineHeight: number };

const MIN_FONT = 40;
const CHAR_WIDTH_EM = 0.48; // measured ~0.42em avg for uppercase Barlow Condensed 800; margin for wide glyphs (M, W)
const LINE_HEIGHT_RATIO = 0.92;

/**
 * Font size for a one-word-per-line hero so the longest word fits `width`
 * and the whole stack fits within 75% of `height`.
 */
export function fitHero(words: string[], width: number, height: number, maxSize: number): HeroFit {
  const longest = Math.max(1, ...words.map((w) => w.length));
  let fontSize = Math.min(maxSize, Math.max(MIN_FONT, width / (longest * CHAR_WIDTH_EM)));
  if (height > 0 && words.length > 0) {
    const byHeight = (height * 0.75) / (words.length * LINE_HEIGHT_RATIO);
    fontSize = Math.min(fontSize, byHeight);
  }
  // Width is a hard limit: never exceed it even below the soft minimum.
  fontSize = Math.min(fontSize, width / (longest * CHAR_WIDTH_EM));
  fontSize = Math.floor(Math.max(16, fontSize));
  return { fontSize, lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO) };
}
