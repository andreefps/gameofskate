import type { Stance } from "@/lib/skate/types";

/** Difficulty added on top of a base trick for each stance. */
export const STANCE_MOD: Record<Stance, number> = {
  regular: 0,
  fakie: 1,
  nollie: 2,
  switch: 3,
};

/** Display prefix for a stance; "regular" is implicit and renders empty. */
export function stancePrefix(stance: Stance): string {
  if (stance === "regular") return "";
  return stance.charAt(0).toUpperCase() + stance.slice(1);
}
