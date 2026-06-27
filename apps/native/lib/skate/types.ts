// Core domain types for the trick-generation engine.
// This module contains type declarations only — no runtime behavior.

export type Stance = "regular" | "fakie" | "switch" | "nollie";

/** Frontside / backside, where a trick takes a direction. */
export type Dir = "fs" | "bs";

/**
 * How a base trick relates to direction:
 * - "none": no FS/BS variant (e.g. Kickflip)
 * - "optional": emit both FS and BS variants (e.g. Shuvit, 50-50)
 * - "required": direction is part of the trick's identity; never emit it bare
 *   (e.g. 180, Bigspin)
 */
export type DirMode = "none" | "optional" | "required";

export type BaseTrick = {
  id: string;
  name: string;
  /** Base difficulty before stance/direction modifiers (1-10). */
  base: number;
  dir: DirMode;
};

export type DomainId = "flatground" | "grinds";

export type Domain = {
  id: DomainId;
  label: string;
  stances: Stance[];
  bases: BaseTrick[];
};

export type Trick = {
  /** Stable id: `${domain}:${stance}:${base}:${dir ?? "x"}`. */
  id: string;
  domain: DomainId;
  /** Composed display name; "regular" stance omitted. */
  name: string;
  /** base + stance modifier (+ dir modifier, 0 in v1), clamped >= 1. */
  difficulty: number;
  stance: Stance;
  /** BaseTrick id. */
  base: string;
  dir?: Dir;
};

export type Tier = "beginner" | "intermediate" | "advanced";

export type DomainSettings = {
  /** Difficulty level last selected on the bar; also picks the applied preset. */
  difficulty: Tier;
  /** At least one stance enabled. */
  enabledStances: Stance[];
  /** BaseTrick ids; at least one enabled. */
  enabledBases: string[];
};

export type Settings = {
  activeDomain: DomainId;
  hapticsEnabled: boolean;
  domains: Record<DomainId, DomainSettings>;
};
