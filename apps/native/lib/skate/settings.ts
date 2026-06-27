import { DOMAINS } from "@/lib/skate/domains";
import { presetFor } from "@/lib/skate/preset";
import type { DomainId, DomainSettings, Settings, Stance, Tier } from "@/lib/skate/types";

export type { Settings } from "@/lib/skate/types";

export type SettingsAction =
  | { type: "setActiveDomain"; domain: DomainId }
  | { type: "toggleStance"; domain: DomainId; stance: Stance }
  | { type: "toggleBase"; domain: DomainId; base: string }
  | { type: "setDifficulty"; domain: DomainId; tier: Tier }
  | { type: "toggleHaptics" }
  | { type: "reset" };

const DEFAULT_DIFFICULTY: Tier = "advanced";

function defaultDomainSettings(domain: DomainId): DomainSettings {
  const preset = presetFor(DOMAINS[domain], DEFAULT_DIFFICULTY);
  return {
    difficulty: DEFAULT_DIFFICULTY,
    enabledStances: preset.stances,
    enabledBases: preset.bases,
  };
}

/** A fresh default Settings object (no shared references). */
export function makeDefaultSettings(): Settings {
  return {
    activeDomain: "flatground",
    hapticsEnabled: true,
    domains: {
      flatground: defaultDomainSettings("flatground"),
      grinds: defaultDomainSettings("grinds"),
    },
  };
}

function updateDomain(
  state: Settings,
  domain: DomainId,
  patch: Partial<DomainSettings>,
): Settings {
  return {
    ...state,
    domains: {
      ...state.domains,
      [domain]: { ...state.domains[domain], ...patch },
    },
  };
}

/** Membership toggle that keeps the result in `canonical` order. */
function toggleMember<T>(current: T[], item: T, canonical: T[]): T[] {
  if (current.includes(item)) {
    return current.filter((x) => x !== item);
  }
  return canonical.filter((x) => current.includes(x) || x === item);
}

export function settingsReducer(state: Settings, action: SettingsAction): Settings {
  switch (action.type) {
    case "setActiveDomain":
      return { ...state, activeDomain: action.domain };

    case "toggleHaptics":
      return { ...state, hapticsEnabled: !state.hapticsEnabled };

    case "toggleStance": {
      const ds = state.domains[action.domain];
      if (ds.enabledStances.length === 1 && ds.enabledStances.includes(action.stance)) {
        return state; // never disable the last stance
      }
      const enabledStances = toggleMember(
        ds.enabledStances,
        action.stance,
        DOMAINS[action.domain].stances,
      );
      return updateDomain(state, action.domain, { enabledStances });
    }

    case "toggleBase": {
      const ds = state.domains[action.domain];
      if (ds.enabledBases.length === 1 && ds.enabledBases.includes(action.base)) {
        return state; // never disable the last base
      }
      const enabledBases = toggleMember(
        ds.enabledBases,
        action.base,
        DOMAINS[action.domain].bases.map((b) => b.id),
      );
      return updateDomain(state, action.domain, { enabledBases });
    }

    case "setDifficulty": {
      // Applies the level's preset, overwriting any prior customization.
      const preset = presetFor(DOMAINS[action.domain], action.tier);
      return updateDomain(state, action.domain, {
        difficulty: action.tier,
        enabledStances: preset.stances,
        enabledBases: preset.bases,
      });
    }

    case "reset":
      return makeDefaultSettings();
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Keep only `allowed` members of `raw` (in canonical order); fall back if empty/invalid. */
function sanitizeList<T extends string>(raw: unknown, allowed: T[], fallback: T[]): T[] {
  if (!Array.isArray(raw)) return fallback;
  const kept = allowed.filter((item) => raw.includes(item));
  return kept.length > 0 ? kept : fallback;
}

function isTier(value: unknown): value is Tier {
  return value === "beginner" || value === "intermediate" || value === "advanced";
}

function hydrateDomain(raw: unknown, domain: DomainId): DomainSettings {
  const def = defaultDomainSettings(domain);
  if (!isRecord(raw)) return def;
  return {
    difficulty: isTier(raw.difficulty) ? raw.difficulty : def.difficulty,
    enabledStances: sanitizeList(raw.enabledStances, DOMAINS[domain].stances, def.enabledStances),
    enabledBases: sanitizeList(
      raw.enabledBases,
      DOMAINS[domain].bases.map((b) => b.id),
      def.enabledBases,
    ),
  };
}

/**
 * Coerce arbitrary (possibly corrupt or schema-drifted) persisted JSON into a
 * valid Settings object, falling back to defaults field-by-field. Stale trick
 * ids from older app versions are dropped; if a list empties, defaults restore.
 */
export function hydrate(raw: unknown): Settings {
  const def = makeDefaultSettings();
  if (!isRecord(raw)) return def;

  const activeDomain =
    raw.activeDomain === "grinds" || raw.activeDomain === "flatground"
      ? raw.activeDomain
      : def.activeDomain;

  const rawDomains = isRecord(raw.domains) ? raw.domains : {};

  return {
    activeDomain,
    hapticsEnabled:
      typeof raw.hapticsEnabled === "boolean" ? raw.hapticsEnabled : def.hapticsEnabled,
    domains: {
      flatground: hydrateDomain(rawDomains.flatground, "flatground"),
      grinds: hydrateDomain(rawDomains.grinds, "grinds"),
    },
  };
}
