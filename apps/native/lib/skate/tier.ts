import type { Tier } from "@/lib/skate/types";

/** Tiers ordered easiest-first. */
export const TIERS: Tier[] = ["beginner", "intermediate", "advanced"];

/** Bucket a numeric difficulty into a tier (beginner 1-4, intermediate 5-8, advanced 9+). */
export function tierOf(difficulty: number): Tier {
  if (difficulty <= 4) return "beginner";
  if (difficulty <= 8) return "intermediate";
  return "advanced";
}
