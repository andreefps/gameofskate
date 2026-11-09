import { describe, expect, it } from "vitest";

import {
  actor,
  alive,
  createGame,
  gameReducer,
  hydrateGame,
  isOut,
  MAX_PLAYERS,
  WORD,
  type Game,
} from "@/lib/skate/game";

function run(game: Game, ...results: boolean[]): Game {
  return results.reduce((g, landed) => gameReducer(g, { type: "result", landed }), game);
}

describe("createGame", () => {
  it("builds players with stable ids and default names", () => {
    const g = createGame(["Ann", "  ", "Bo"]);
    expect(g.present.players.map((p) => p.id)).toEqual(["p1", "p2", "p3"]);
    expect(g.present.players.map((p) => p.name)).toEqual(["Ann", "Player 2", "Bo"]);
    expect(g.present).toMatchObject({ setter: 0, phase: "set", turn: 1, winner: null });
    expect(g.past).toEqual([]);
    expect(WORD).toBe("SKATE");
  });

  it("caps at MAX_PLAYERS", () => {
    expect(createGame(Array(12).fill("x")).present.players).toHaveLength(MAX_PLAYERS);
  });
});

describe("2-player flow", () => {
  it("set landed -> match; matcher misses -> letter, setter keeps control", () => {
    let g = createGame(["A", "B"]);
    g = run(g, true);
    expect(g.present.phase).toBe("match");
    expect(g.present.matchQueue).toEqual([1]);
    expect(actor(g.present)).toBe(1);
    expect(g.present.players[0]!.landed).toBe(1);
    g = run(g, false);
    expect(g.present.players[1]!.letters).toBe(1);
    expect(g.present).toMatchObject({ phase: "set", setter: 0, turn: 2 });
  });

  it("matcher landing gives landed count and no letter", () => {
    const g = run(createGame(["A", "B"]), true, true);
    expect(g.present.players[1]).toMatchObject({ landed: 1, letters: 0 });
    expect(g.present.turn).toBe(2);
  });

  it("set missed passes setter without letters", () => {
    const g = run(createGame(["A", "B"]), false);
    expect(g.present).toMatchObject({ setter: 1, phase: "set", turn: 2 });
    expect(g.present.players.every((p) => p.letters === 0)).toBe(true);
  });

  it("game over when opponent reaches 5 letters", () => {
    let g = createGame(["A", "B"]);
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    expect(g.present).toMatchObject({ phase: "over", winner: 0 });
    expect(actor(g.present)).toBeNull();
    expect(isOut(g.present.players[1]!)).toBe(true);
    expect(alive(g.present)).toEqual([0]);
  });

  it("result after over is a no-op (same object)", () => {
    let g = createGame(["A", "B"]);
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    expect(gameReducer(g, { type: "result", landed: true })).toBe(g);
  });
});

describe("3-player flow", () => {
  it("queues matchers in seating order after the setter, wrapping", () => {
    let g = createGame(["A", "B", "C"]);
    g = run(g, false); // setter -> B
    g = run(g, true);
    expect(g.present.matchQueue).toEqual([2, 0]);
    g = run(g, false); // C letter
    expect(actor(g.present)).toBe(0);
    g = run(g, true); // A lands
    expect(g.present).toMatchObject({ phase: "set", setter: 1, turn: 3 });
    expect(g.present.players.map((p) => p.letters)).toEqual([0, 0, 1]);
  });

  it("skips eliminated players in setter rotation and queue", () => {
    let g = createGame(["A", "B", "C"]);
    // B eliminated: A sets, B misses 5 times (C lands each time)
    for (let i = 0; i < 5; i++) g = run(g, true, false, true);
    expect(g.present.players[1]!.letters).toBe(5);
    expect(g.present.phase).toBe("set");
    // A misses: setter should skip B -> C
    g = run(g, false);
    expect(g.present.setter).toBe(2);
    // C lands: queue [0] only (B skipped)
    g = run(g, true);
    expect(g.present.matchQueue).toEqual([0]);
    // C misses a set again -> wraps to A, skipping B
    g = run(g, true);
    g = run(g, false);
    expect(g.present.setter).toBe(0);
  });

  it("ends when last opponent is eliminated mid-queue", () => {
    let g = createGame(["A", "B", "C"]);
    // eliminate B first
    for (let i = 0; i < 5; i++) g = run(g, true, false, true);
    // now A vs C: C misses 5 times
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    expect(g.present).toMatchObject({ phase: "over", winner: 0 });
  });

  it("winner can be the setter-independent survivor", () => {
    let g = createGame(["A", "B"]);
    g = run(g, false); // B sets
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    expect(g.present.winner).toBe(1);
  });
});

describe("solo", () => {
  it("every result is for the player and bumps turn", () => {
    let g = createGame(["Solo"]);
    g = run(g, true);
    expect(g.present).toMatchObject({ phase: "set", turn: 2 });
    expect(g.present.players[0]!.landed).toBe(1);
    g = run(g, false);
    expect(g.present.players[0]!.letters).toBe(1);
    expect(actor(g.present)).toBe(0);
    expect(g.present.turn).toBe(3);
  });

  it("ends at 5 letters with null winner, score = landed", () => {
    let g = createGame(["Solo"]);
    g = run(g, true, true, false, false, false, false, false);
    expect(g.present).toMatchObject({ phase: "over", winner: null });
    expect(g.present.players[0]!.landed).toBe(2);
  });
});

describe("undo / rematch", () => {
  it("undo restores exact previous state", () => {
    const g0 = createGame(["A", "B", "C"]);
    const g1 = run(g0, true);
    const g2 = run(g1, false);
    expect(gameReducer(g2, { type: "undo" }).present).toEqual(g1.present);
    expect(gameReducer(gameReducer(g2, { type: "undo" }), { type: "undo" }).present).toEqual(g0.present);
  });

  it("undo on empty past is a no-op", () => {
    const g = createGame(["A", "B"]);
    expect(gameReducer(g, { type: "undo" })).toBe(g);
  });

  it("caps history at 30", () => {
    let g = createGame(["Solo"]);
    for (let i = 0; i < 50; i++) g = run(g, true);
    expect(g.past).toHaveLength(30);
  });

  it("can undo out of game over", () => {
    let g = createGame(["A", "B"]);
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    g = gameReducer(g, { type: "undo" });
    expect(g.present.phase).toBe("match");
  });

  it("rematch resets, setter = winner, bumps turn, is undoable", () => {
    let g = createGame(["A", "B"]);
    g = run(g, false); // B sets
    for (let i = 0; i < 5; i++) g = run(g, true, false);
    const over = g.present;
    const r = gameReducer(g, { type: "rematch" });
    expect(r.present).toMatchObject({ phase: "set", setter: 1, winner: null, turn: over.turn + 1 });
    expect(r.present.players.every((p) => p.letters === 0 && p.landed === 0)).toBe(true);
    expect(r.present.players.map((p) => p.name)).toEqual(["A", "B"]);
    expect(gameReducer(r, { type: "undo" }).present).toEqual(over);
  });

  it("rematch with no winner uses setter 0", () => {
    let g = createGame(["Solo"]);
    g = run(g, false, false, false, false, false);
    expect(gameReducer(g, { type: "rematch" }).present.setter).toBe(0);
  });
});

describe("hydrateGame", () => {
  it("round-trips JSON", () => {
    let g = createGame(["A", "B", "C"]);
    g = run(g, true, false, true);
    expect(hydrateGame(JSON.parse(JSON.stringify(g)))).toEqual(g);
  });

  it("rejects garbage", () => {
    for (const bad of [
      null, undefined, 5, "x", [], {}, { present: {}, past: [] },
      { present: createGame(["A"]).present },
      { present: { ...createGame(["A", "B"]).present, phase: "nope" }, past: [] },
      { present: { ...createGame(["A", "B"]).present, setter: 9 }, past: [] },
      { present: { ...createGame(["A", "B"]).present, phase: "match", matchQueue: [] }, past: [] },
      { present: { ...createGame(["A", "B"]).present, players: [] }, past: [] },
      { present: createGame(["A", "B"]).present, past: [{ junk: 1 }] },
    ]) {
      expect(hydrateGame(bad)).toBeNull();
    }
    const g = createGame(["A", "B"]);
    const bad = JSON.parse(JSON.stringify(g));
    bad.present.players[0].letters = 9;
    expect(hydrateGame(bad)).toBeNull();
  });
});
