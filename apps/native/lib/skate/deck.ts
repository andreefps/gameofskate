/**
 * Browsing history as a deck: `history` holds what was shown before `current`
 * (most recent first), `ahead` holds what was backed out of (next to re-show first).
 * Pure; the trick caller hook owns the React state.
 */
export type Deck<T> = {
  current: T | null;
  history: T[];
  ahead: T[];
};

export function emptyDeck<T>(): Deck<T> {
  return { current: null, history: [], ahead: [] };
}

/**
 * Move to the next item: replay the most recent `ahead` entry if there is one,
 * otherwise take `nextRandom()`. Returns the same state object when there is
 * nothing to move to. History is capped at `limit`.
 */
export function forward<T>(state: Deck<T>, nextRandom: () => T | null, limit: number): Deck<T> {
  const [replay, ...restAhead] = state.ahead;
  const next = replay !== undefined ? replay : nextRandom();
  if (next === null) return state;
  return {
    current: next,
    history: state.current === null ? state.history : [state.current, ...state.history].slice(0, limit),
    ahead: restAhead,
  };
}

/** Step back to the previous item. Returns the same state object when there is none. */
export function back<T>(state: Deck<T>): Deck<T> {
  const [prev, ...rest] = state.history;
  if (prev === undefined) return state;
  return {
    current: prev,
    history: rest,
    ahead: state.current === null ? state.ahead : [state.current, ...state.ahead],
  };
}

/** Jump to a specific item (like a fresh forward step): clears `ahead`. */
export function show<T>(state: Deck<T>, item: T, limit: number): Deck<T> {
  return {
    current: item,
    history: state.current === null ? state.history : [state.current, ...state.history].slice(0, limit),
    ahead: [],
  };
}

/** Drop history/ahead entries rejected by `keep`. Returns the same state object if nothing was dropped. */
export function prune<T>(state: Deck<T>, keep: (item: T) => boolean): Deck<T> {
  const history = state.history.filter(keep);
  const ahead = state.ahead.filter(keep);
  if (history.length === state.history.length && ahead.length === state.ahead.length) return state;
  return { ...state, history, ahead };
}
