import { describe, expect, it } from "vitest";

import { createGame, gameReducer, type Game } from "@/lib/skate/game";
import { playerLabel, standings, turnLine } from "@/lib/skate/standings";

const run = (g: Game, ...r: boolean[]) => r.reduce((x, landed) => gameReducer(x, { type: "result", landed }), g);

describe("standings", () => {
  it("puts the winner first, then fewest letters, then most landed", () => {
    const s = {
      ...createGame(["A", "B", "C"]).present,
      winner: 2,
      players: [
        { id: "p1", name: "A", letters: 5, landed: 1 },
        { id: "p2", name: "B", letters: 3, landed: 2 },
        { id: "p3", name: "C", letters: 4, landed: 9 },
      ],
    };
    expect(standings(s).map((r) => r.player.name)).toEqual(["C", "B", "A"]);
    expect(standings(s).map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("breaks ties by landed then seating order", () => {
    const s = createGame(["A", "B", "C"]).present;
    s.players[1]!.landed = 2;
    expect(standings(s).map((r) => r.index)).toEqual([1, 0, 2]);
  });
});

describe("turnLine", () => {
  it("describes set and match phases", () => {
    const g = createGame(["Ana", "Bruno"]);
    expect(turnLine(g.present)).toEqual({ lead: "Ana", rest: " sets" });
    expect(turnLine(run(g, true).present)).toEqual({ lead: "Bruno", rest: " — match it" });
  });

  it("uses trick counter for solo", () => {
    expect(turnLine(createGame(["Solo"]).present)).toEqual({ lead: "", rest: "Trick 1" });
  });
});

describe("playerLabel", () => {
  it("lists earned letters", () => {
    expect(playerLabel({ id: "p1", name: "Ana", letters: 2, landed: 0 }, "SKATE")).toBe("Ana, 2 letters, S K");
    expect(playerLabel({ id: "p1", name: "Ana", letters: 0, landed: 0 }, "SKATE", { actor: true })).toBe(
      "Ana, no letters, up now",
    );
    expect(playerLabel({ id: "p1", name: "Ana", letters: 5, landed: 0 }, "SKATE", { out: true })).toContain("out");
  });
});
