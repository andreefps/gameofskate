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
  /** Roll without the haptic tick (game turns fire their own feedback). */
  rollQuiet: () => void;
  /** Show a specific pool trick with the reveal. Returns false if it is not in the pool. */
  show: (id: string, opts?: { animate?: boolean }) => boolean;
  /** Increments on every roll; use as a React key to replay the reveal. */
  rollToken: number;
  /** False after a quiet `show` (resume): render the trick without the reveal. */
  animate: boolean;
};

export function useTrickCaller({ lock = false }: { lock?: boolean } = {}): TrickCaller {
  const { settings } = useSettings();
  const domain = DOMAINS[settings.activeDomain];
  const pool = buildPool(domain, settings.domains[settings.activeDomain]);

  const [current, setCurrent] = useState<Trick | null>(null);
  const [history, setHistory] = useState<Trick[]>([]);
  const [rollToken, setRollToken] = useState(0);
  const [animate, setAnimate] = useState(true);

  // Filters changed: if the shown trick is no longer valid, swap silently
  // (no re-animation) or clear when the pool is empty. Never auto-rolls on open.
  // While `lock` is set (mid-match) the called trick must stay fixed.
  useEffect(() => {
    if (lock || !current) return;
    if (pool.some((t) => t.id === current.id)) return;
    if (pool.length === 0) {
      setCurrent(null);
      return;
    }
    setCurrent(pick(pool, [current.id, ...history.map((t) => t.id)]));
  }, [pool, current, history, lock]);

  const rollWith = (haptic: boolean) => {
    const recentIds = [current, ...history].filter((t): t is Trick => t !== null).map((t) => t.id);
    const next = pick(pool, recentIds);
    if (!next) return;
    if (haptic && settings.hapticsEnabled) impactMedium();
    if (current) setHistory([current, ...history].slice(0, RECENT_WINDOW - 1));
    setCurrent(next);
    setAnimate(true);
    setRollToken((t) => t + 1);
  };

  const show = (id: string, opts?: { animate?: boolean }) => {
    const trick = pool.find((t) => t.id === id);
    if (!trick) return false;
    if (current?.id === trick.id) return true;
    if (current) setHistory([current, ...history].slice(0, RECENT_WINDOW - 1));
    setCurrent(trick);
    if (opts?.animate === false) {
      setAnimate(false);
    } else {
      setAnimate(true);
      setRollToken((t) => t + 1);
    }
    return true;
  };

  return {
    pool,
    current,
    recent: history.slice(0, RECENT_SHOWN),
    roll: () => rollWith(true),
    rollQuiet: () => rollWith(false),
    show,
    rollToken,
    animate,
  };
}
