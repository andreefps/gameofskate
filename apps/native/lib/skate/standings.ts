import { actor, type GameState, type Player } from "@/lib/skate/game";

export type Standing = { index: number; player: Player; rank: number };

/** Winner first, then fewest letters, then most landed, then seating order. */
export function standings(state: GameState): Standing[] {
  const rows = state.players.map((player, index) => ({ index, player }));
  rows.sort((a, b) => {
    if (a.index === state.winner) return -1;
    if (b.index === state.winner) return 1;
    return (
      a.player.letters - b.player.letters || b.player.landed - a.player.landed || a.index - b.index
    );
  });
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Header line above the trick: `lead` is the actor (or full solo label), `rest` the muted tail. */
export function turnLine(state: GameState): { lead: string; rest: string } {
  if (state.players.length === 1) return { lead: "", rest: `Trick ${state.turn}` };
  const who = actor(state);
  if (who === null) return { lead: "", rest: "" };
  const name = state.players[who]!.name;
  return state.phase === "set" ? { lead: name, rest: " sets" } : { lead: name, rest: " — match it" };
}

/** "Ana, 2 letters, S K" style label. */
export function playerLabel(p: Player, word: string, opts: { actor?: boolean; out?: boolean } = {}): string {
  const earned = word.slice(0, p.letters).split("").join(" ");
  const base = p.letters === 0 ? `${p.name}, no letters` : `${p.name}, ${p.letters} ${p.letters === 1 ? "letter" : "letters"}, ${earned}`;
  return base + (opts.out ? ", out" : opts.actor ? ", up now" : "");
}
