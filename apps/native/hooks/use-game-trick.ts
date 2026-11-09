import { useEffect, useRef } from "react";

import type { TrickCaller } from "@/hooks/use-trick-caller";
import { useGame } from "@/stores/game";

/**
 * Keeps the called trick in lockstep with the game: a new turn rolls a trick
 * (or restores the one remembered for that turn, e.g. after undo/reload) and
 * whatever trick is shown, including silent filter swaps, is stored as trickId.
 */
export function useGameTrick({ pool, current, rollQuiet, show }: TrickCaller): void {
  const { game, trickId, trickByTurn, setTrickId } = useGame();
  const lastTurn = useRef<number | null>(null);
  const turn = game?.present.turn ?? null;

  useEffect(() => {
    if (turn === null) {
      lastTurn.current = null;
      return;
    }
    if (lastTurn.current === turn || pool.length === 0) return;
    const first = lastTurn.current === null;
    lastTurn.current = turn;
    const remembered = trickByTurn[turn] ?? (first ? trickId : null);
    if (remembered && show(remembered)) return;
    rollQuiet();
  }, [turn, pool, trickByTurn, trickId, show, rollQuiet]);

  useEffect(() => {
    if (turn !== null && current && current.id !== trickId) setTrickId(current.id);
  }, [turn, current, trickId, setTrickId]);
}
