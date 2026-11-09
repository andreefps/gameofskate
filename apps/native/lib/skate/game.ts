// Pure pass-and-play S.K.A.T.E. state machine. No React imports.

export const WORD = "SKATE";
export const MAX_PLAYERS = 8;
const MAX_LETTERS = WORD.length;
const HISTORY_CAP = 30;

export type Player = { id: string; name: string; letters: number; landed: number };
export type GamePhase = "set" | "match" | "over";
export type GameState = {
  players: Player[];
  setter: number;
  phase: GamePhase;
  matchQueue: number[];
  turn: number;
  winner: number | null;
};
/** Undo states kept when persisting (memory keeps up to HISTORY_CAP). */
export const PERSIST_HISTORY = 8;

export type Game = { present: GameState; past: GameState[] };
export type GameAction =
  | { type: "result"; landed: boolean }
  | { type: "undo" }
  | { type: "rematch" };

export function isOut(p: Player): boolean {
  return p.letters >= MAX_LETTERS;
}

export function alive(state: GameState): number[] {
  const out: number[] = [];
  state.players.forEach((p, i) => {
    if (!isOut(p)) out.push(i);
  });
  return out;
}

export function actor(state: GameState): number | null {
  if (state.phase === "over") return null;
  if (state.phase === "set") return state.setter;
  return state.matchQueue[0] ?? null;
}

export function createGame(names: string[]): Game {
  const list = names.slice(0, MAX_PLAYERS);
  const players: Player[] = (list.length > 0 ? list : [""]).map((n, i) => ({
    id: `p${i + 1}`,
    name: n.trim() || `Player ${i + 1}`,
    letters: 0,
    landed: 0,
  }));
  return {
    present: {
      players,
      setter: 0,
      phase: "set",
      matchQueue: [],
      turn: 1,
      winner: null,
    },
    past: [],
  };
}

/** Next alive player index after `from` in seating order (wraps; may return `from`). */
function nextAlive(players: Player[], from: number): number {
  const n = players.length;
  for (let step = 1; step <= n; step++) {
    const i = (from + step) % n;
    if (!isOut(players[i]!)) return i;
  }
  return from;
}

function bump(players: Player[], i: number, patch: "landed" | "letters"): Player[] {
  return players.map((p, idx) => (idx === i ? { ...p, [patch]: p[patch] + 1 } : p));
}

function soloStep(s: GameState, landed: boolean): GameState {
  const players = bump(s.players, 0, landed ? "landed" : "letters");
  const over = isOut(players[0]!);
  return {
    ...s,
    players,
    phase: over ? "over" : "set",
    winner: null,
    turn: over ? s.turn : s.turn + 1,
  };
}

function step(s: GameState, landed: boolean): GameState {
  if (s.players.length === 1) return soloStep(s, landed);

  if (s.phase === "set") {
    if (landed) {
      const players = bump(s.players, s.setter, "landed");
      const queue: number[] = [];
      const n = players.length;
      for (let k = 1; k < n; k++) {
        const i = (s.setter + k) % n;
        if (!isOut(players[i]!)) queue.push(i);
      }
      if (queue.length === 0) return { ...s, players, phase: "over", matchQueue: [], winner: s.setter };
      return { ...s, players, phase: "match", matchQueue: queue };
    }
    return { ...s, setter: nextAlive(s.players, s.setter), turn: s.turn + 1 };
  }

  // match
  const who = s.matchQueue[0];
  if (who === undefined) return s;
  const players = bump(s.players, who, landed ? "landed" : "letters");
  const matchQueue = s.matchQueue.slice(1);
  const next: GameState = { ...s, players, matchQueue };
  if (matchQueue.length > 0) return next;

  const living = alive(next);
  if (living.length <= 1) {
    return { ...next, phase: "over", winner: living[0] ?? null };
  }
  // Setter keeps control; if setter was somehow eliminated, pass on.
  const setter = isOut(players[s.setter]!) ? nextAlive(players, s.setter) : s.setter;
  return { ...next, setter, phase: "set", turn: s.turn + 1 };
}

function push(past: GameState[], prev: GameState): GameState[] {
  return [...past, prev].slice(-HISTORY_CAP);
}

export function gameReducer(game: Game, action: GameAction): Game {
  switch (action.type) {
    case "result": {
      if (game.present.phase === "over") return game;
      return { present: step(game.present, action.landed), past: push(game.past, game.present) };
    }
    case "undo": {
      const prev = game.past[game.past.length - 1];
      if (!prev) return game;
      return { present: prev, past: game.past.slice(0, -1) };
    }
    case "rematch": {
      const s = game.present;
      const setter = s.winner ?? 0;
      return {
        present: {
          players: s.players.map((p) => ({ ...p, letters: 0, landed: 0 })),
          setter,
          phase: "set",
          matchQueue: [],
          turn: s.turn + 1,
          winner: null,
        },
        past: push(game.past, s),
      };
    }
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

function hydrateState(raw: unknown): GameState | null {
  if (!isRecord(raw) || !Array.isArray(raw.players)) return null;
  const n = raw.players.length;
  if (n < 1 || n > MAX_PLAYERS) return null;
  const players: Player[] = [];
  for (const p of raw.players) {
    if (!isRecord(p)) return null;
    if (typeof p.id !== "string" || typeof p.name !== "string") return null;
    if (!isInt(p.letters, 0, MAX_LETTERS) || !isInt(p.landed, 0, Number.MAX_SAFE_INTEGER)) return null;
    players.push({ id: p.id, name: p.name, letters: p.letters, landed: p.landed });
  }
  if (new Set(players.map((p) => p.id)).size !== n) return null;
  if (raw.phase !== "set" && raw.phase !== "match" && raw.phase !== "over") return null;
  if (!isInt(raw.setter, 0, n - 1)) return null;
  if (!isInt(raw.turn, 0, Number.MAX_SAFE_INTEGER)) return null;
  if (!Array.isArray(raw.matchQueue) || !raw.matchQueue.every((i) => isInt(i, 0, n - 1))) return null;
  if (raw.winner !== null && !isInt(raw.winner, 0, n - 1)) return null;
  if (raw.phase === "match" && raw.matchQueue.length === 0) return null;
  if (raw.phase !== "match" && raw.matchQueue.length > 0) return null;
  return {
    players,
    setter: raw.setter,
    phase: raw.phase,
    matchQueue: raw.matchQueue as number[],
    turn: raw.turn,
    winner: raw.winner as number | null,
  };
}

export function hydrateGame(raw: unknown): Game | null {
  if (!isRecord(raw) || !Array.isArray(raw.past)) return null;
  const present = hydrateState(raw.present);
  if (!present) return null;
  const past: GameState[] = [];
  for (const p of raw.past.slice(-HISTORY_CAP)) {
    const s = hydrateState(p);
    if (!s) return null;
    past.push(s);
  }
  return { present, past };
}

/** Persisted form of a game: keeps only the last `keep` undo states to bound storage size. */
export function trimForPersist(game: Game, keep = PERSIST_HISTORY): Game {
  return game.past.length <= keep ? game : { ...game, past: game.past.slice(-keep) };
}
