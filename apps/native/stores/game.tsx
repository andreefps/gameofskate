import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { createGame, gameReducer, hydrateGame, MAX_PLAYERS, trimForPersist, type Game } from "@/lib/skate/game";
import {
  forgetAfter,
  hydrateNames,
  hydrateTrickMap,
  rememberTrick,
  type TrickByTurn,
} from "@/lib/skate/trick-turns";
import { loadSync, save } from "@/stores/persist";

const GAME_KEY = "skate.game.v1";
const PLAYERS_KEY = "skate.players.v1";

type Persisted = { game: Game | null; trickId: string | null; trickByTurn: TrickByTurn };

type GameContextValue = {
  game: Game | null;
  trickId: string | null;
  /** Remembered trick per turn, so undo across a turn boundary restores the trick. */
  trickByTurn: TrickByTurn;
  /** Last-used player names, to prefill setup. */
  lastNames: string[];
  start: (names: string[]) => void;
  result: (landed: boolean) => void;
  undo: () => void;
  rematch: () => void;
  end: () => void;
  setTrickId: (id: string) => void;
};

const EMPTY: Persisted = { game: null, trickId: null, trickByTurn: {} };

function initGame(): Persisted {
  const raw = loadSync(GAME_KEY);
  if (typeof raw !== "object" || raw === null) return EMPTY;
  const r = raw as Record<string, unknown>;
  const game = hydrateGame(r.game);
  if (!game) return EMPTY;
  return {
    game,
    trickId: typeof r.trickId === "string" ? r.trickId : null,
    trickByTurn: hydrateTrickMap(r.trickByTurn),
  };
}

function initNames(): string[] {
  return hydrateNames(loadSync(PLAYERS_KEY), MAX_PLAYERS) ?? ["", ""];
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Persisted>(initGame);
  const [lastNames, setLastNames] = useState<string[]>(initNames);

  useEffect(() => {
    save(GAME_KEY, state.game ? { ...state, game: trimForPersist(state.game) } : state);
  }, [state]);

  const withGame = (fn: (g: Game, s: Persisted) => Persisted) =>
    setState((s) => (s.game ? fn(s.game, s) : s));

  const value: GameContextValue = {
    game: state.game,
    trickId: state.trickId,
    trickByTurn: state.trickByTurn,
    lastNames,
    start: (names) => {
      setLastNames(names);
      save(PLAYERS_KEY, names);
      setState({ game: createGame(names), trickId: null, trickByTurn: {} });
    },
    result: (landed) => withGame((g, s) => ({ ...s, game: gameReducer(g, { type: "result", landed }) })),
    undo: () =>
      withGame((g, s) => {
        const next = gameReducer(g, { type: "undo" });
        return { ...s, game: next, trickByTurn: forgetAfter(s.trickByTurn, next.present.turn) };
      }),
    rematch: () => withGame((g, s) => ({ ...s, game: gameReducer(g, { type: "rematch" }) })),
    end: () => setState(EMPTY),
    setTrickId: (id) =>
      withGame((g, s) =>
        s.trickId === id && s.trickByTurn[g.present.turn] === id
          ? s
          : { ...s, trickId: id, trickByTurn: rememberTrick(s.trickByTurn, g.present.turn, id) },
      ),
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
