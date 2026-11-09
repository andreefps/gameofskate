import { useEffect, useState } from "react";

import { impactMedium } from "@/lib/haptics";
import { DOMAINS } from "@/lib/skate/domains";
import { buildPool, pick, RECENT_WINDOW } from "@/lib/skate/select";
import type { Trick } from "@/lib/skate/types";
import { useSettings } from "@/stores/settings";

const RECENT_SHOWN = 5;

export type TrickCaller = {
  pool: Trick[];
  current: Trick | null;
  /** Previous tricks, most recent first (excludes current), max 5. */
  recent: Trick[];
  roll: () => void;
  /** Increments on every roll; use as a React key to replay the reveal. */
  rollToken: number;
};

export function useTrickCaller(): TrickCaller {
  const { settings } = useSettings();
  const domain = DOMAINS[settings.activeDomain];
  const pool = buildPool(domain, settings.domains[settings.activeDomain]);

  const [current, setCurrent] = useState<Trick | null>(null);
  const [history, setHistory] = useState<Trick[]>([]);
  const [rollToken, setRollToken] = useState(0);

  // Filters changed: if the shown trick is no longer valid, swap silently
  // (no re-animation) or clear when the pool is empty. Never auto-rolls on open.
  useEffect(() => {
    if (!current) return;
    if (pool.some((t) => t.id === current.id)) return;
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }
    setCurrent(pick(pool, [current.id, ...history.map((t) => t.id)]));
  }, [pool, current, history]);

  const roll = () => {
    const recentIds = [current, ...history].filter((t): t is Trick => t !== null).map((t) => t.id);
    const next = pick(pool, recentIds);
    if (!next) return;
    if (settings.hapticsEnabled) impactMedium();
    if (current) setHistory([current, ...history].slice(0, RECENT_WINDOW - 1));
    setCurrent(next);
    setRollToken((t) => t + 1);
  };

  return { pool, current, recent: history.slice(0, RECENT_SHOWN), roll, rollToken };
}
