import { describe, expect, it } from "vitest";

import { back, emptyDeck, forward, prune, show, type Deck } from "@/lib/skate/deck";

const deck = (current: string | null, history: string[] = [], ahead: string[] = []): Deck<string> => ({
  current,
  history,
  ahead,
});

describe("forward", () => {
  it("takes the random item from empty", () => {
    expect(forward(emptyDeck<string>(), () => "a", 5)).toEqual(deck("a"));
  });

  it("pushes current onto history", () => {
    expect(forward(deck("a"), () => "b", 5)).toEqual(deck("b", ["a"]));
  });

  it("caps history at the limit", () => {
    const next = forward(deck("c", ["b", "a"]), () => "d", 2);
    expect(next.history).toEqual(["c", "b"]);
  });

  it("replays ahead before rolling and never calls nextRandom", () => {
    const next = forward(deck("a", [], ["b", "c"]), () => {
      throw new Error("should not roll");
    }, 5);
    expect(next).toEqual(deck("b", ["a"], ["c"]));
  });

  it("returns the same state when nothing to pick", () => {
    const s = deck("a");
    expect(forward(s, () => null, 5)).toBe(s);
  });
});

describe("back", () => {
  it("does nothing without history", () => {
    const s = deck("a");
    expect(back(s)).toBe(s);
  });

  it("moves current to ahead and restores history head", () => {
    expect(back(deck("c", ["b", "a"]))).toEqual(deck("b", ["a"], ["c"]));
  });

  it("back then forward round-trips", () => {
    const s = deck("c", ["b", "a"]);
    expect(forward(back(s), () => "x", 5)).toEqual(s);
  });

  it("stacks ahead across repeated backs", () => {
    const s = back(back(deck("c", ["b", "a"])));
    expect(s).toEqual(deck("a", [], ["b", "c"]));
  });
});

describe("show", () => {
  it("clears ahead and pushes current", () => {
    expect(show(deck("a", ["z"], ["q"]), "b", 5)).toEqual(deck("b", ["a", "z"]));
  });
});

describe("prune", () => {
  it("drops rejected entries", () => {
    expect(prune(deck("a", ["x", "b"], ["y", "c"]), (t) => t !== "x" && t !== "y")).toEqual(
      deck("a", ["b"], ["c"]),
    );
  });

  it("returns same state when all kept", () => {
    const s = deck("a", ["b"], ["c"]);
    expect(prune(s, () => true)).toBe(s);
  });
});
