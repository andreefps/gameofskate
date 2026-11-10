import { useEffect, useState } from "react";

import { impactMedium } from "@/lib/haptics";
import { back, emptyDeck, forward, prune, show as showTrick, type Deck } from "@/lib/skate/deck";
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
  /** Step back to the previous trick (replayed by the next `roll`). */
  back: () => void;
  canBack: boolean;
  /** Roll without the haptic tick (game turns fire their own feedback). Always picks fresh. */
  rollQuiet: () => void;
  /** Show a specific pool trick with the reveal. Returns false if it is not in the pool. */
  show: (id: string, opts?: { animate?: boolean }) => boolean;
  /** Increments on every roll/back; use as a React key to replay the reveal. */
  rollToken: number;
  /** False after a quiet `show` (resume): render the trick without the reveal. */
  animate: boolean;
  /** Direction of the last change: 1 = next, -1 = back. */
  direction: 1 | -1;
};

export function useTrickCaller({ lock = false }: { lock?: boolean } = {}): TrickCaller {
  const { settings } = useSettings();
  const domain = DOMAINS[settings.activeDomain];
  const pool = buildPool(domain, settings.domains[settings.activeDomain]);

  const [deck, setDeck] = useState<Deck<Trick>>(emptyDeck);
  const [rollToken, setRollToken] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [direction, setDirection] = useState<1 | -1>(1);
  const { current, history } = deck;
  const limit = RECENT_WINDOW - 1;

  // Filters changed: if the shown trick is no longer valid, swap silently
  // (no re-animation) or clear when the pool is empty. Never auto-rolls on open.
  // History/ahead entries outside the pool are dropped so back/forward stay valid.
  // While `lock` is set (mid-match) the called trick must stay fixed.
  useEffect(() => {
    if (lock || !current) return;
    if (pool.length === 0) {
      setDeck(emptyDeck());
      return;
    }
    if (!pool.some((t) => t.id === current.id)) {
      const swap = pick(pool, [current.id, ...history.map((t) => t.id)]);
      if (swap) setDeck((d) => ({ ...d, current: swap, ahead: [] }));
      return;
    }
    const ids = new Set(pool.map((t) => t.id));
    setDeck((d) => prune(d, (t) => ids.has(t.id)));
  }, [pool, current, history, lock]);

  const commit = (next: Deck<Trick>, dir: 1 | -1) => {
    if (next === deck) return;
    setDeck(next);
    setDirection(dir);
    setAnimate(true);
    setRollToken((t) => t + 1);
  };

  const rollWith = (haptic: boolean) => {
    const base = haptic ? deck : { ...deck, ahead: [] };
    const next = forward(
      base,
      () => pick(pool, [current, ...history].filter((t): t is Trick => t !== null).map((t) => t.id)),
      limit,
    );
    if (next === deck) return;
    if (haptic && settings.hapticsEnabled) impactMedium();
    commit(next, 1);
  };

  const goBack = () => {
    const next = back(deck);
    if (next === deck) return;
    if (settings.hapticsEnabled) impactMedium();
    commit(next, -1);
  };

  const show = (id: string, opts?: { animate?: boolean }) => {
    const trick = pool.find((t) => t.id === id);
    if (!trick) return false;
    if (current?.id === trick.id) return true;
    setDeck(showTrick(deck, trick, limit));
    if (opts?.animate === false) {
      setAnimate(false);
    } else {
      setDirection(1);
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
    back: goBack,
    canBack: history.length > 0,
    rollQuiet: () => rollWith(false),
    show,
    rollToken,
    animate,
    direction,
  };
}
