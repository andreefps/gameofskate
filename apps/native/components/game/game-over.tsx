import { useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { Letters } from "@/components/game/letters";
import { RevealFade, TrickName } from "@/components/trick-name";
import { Button } from "@/components/ui/button";
import { useHotkeys } from "@/hooks/use-hotkeys";
import type { GameState } from "@/lib/skate/game";
import { standings } from "@/lib/skate/standings";
import { fitHero } from "@/lib/ui/fit-hero";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

type Props = {
  state: GameState;
  canUndo: boolean;
  maxSize: number;
  hapticsEnabled: boolean;
  hotkeysEnabled: boolean;
  onRematch: () => void;
  onNewGame: () => void;
  onDone: () => void;
  onUndo: () => void;
};

export function GameOver({
  state,
  canUndo,
  maxSize,
  hapticsEnabled,
  hotkeysEnabled,
  onRematch,
  onNewGame,
  onDone,
  onUndo,
}: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const solo = state.players.length === 1;
  const rows = standings(state);

  const undo = () => {
    if (canUndo) onUndo();
  };
  useHotkeys({ u: undo, U: undo, "mod+z": undo }, hotkeysEnabled);

  const words = solo
    ? ["SKATE."]
    : state.winner === null
      ? ["NO", "WINNER"]
      : [...state.players[state.winner]!.name.toUpperCase().split(/\s+/), "WINS"];
  const landed = state.players[0]!.landed;
  const sub = solo ? `${landed} ${landed === 1 ? "trick" : "tricks"} landed` : null;
  const { fontSize, lineHeight } = fitHero(words, size.width, size.height, maxSize);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  return (
    <View style={styles.root}>
      <View style={styles.hero} onLayout={onLayout}>
        {size.width > 0 ? (
          <>
            <TrickName
              words={words}
              fontSize={fontSize}
              lineHeight={lineHeight}
              color={colors.ink}
              haptics={hapticsEnabled}
            />
            {sub ? (
              <RevealFade wordCount={words.length}>
                <Text style={[styles.sub, { color: colors.inkMuted }]}>{sub}</Text>
              </RevealFade>
            ) : null}
          </>
        ) : null}
        <View
          pointerEvents="none"
          accessibilityLiveRegion="polite"
          style={styles.srOnly}
        >
          <Text>{solo ? `Game over. ${sub}` : `Game over. ${words.join(" ")}`}</Text>
        </View>
      </View>

      {solo ? null : (
        <View style={styles.list}>
          {rows.map(({ player, rank }) => (
            <View key={player.id} style={[styles.row, { borderTopColor: colors.line }]}>
              <Text style={[styles.rank, { color: colors.inkMuted }]}>{rank}</Text>
              <Text numberOfLines={1} style={[styles.name, { color: colors.ink }]}>
                {player.name}
              </Text>
              <Text style={[styles.landed, { color: colors.inkMuted }]}>{player.landed} landed</Text>
              <Letters count={player.letters} size={18} />
            </View>
          ))}
        </View>
      )}

      <Button size="lg" variant="primary" icon="refresh" label="Rematch" onPress={onRematch} />
      <View style={styles.sub2}>
        <Button variant="secondary" size="md" label="New game" onPress={onNewGame} />
        <Button variant="ghost" size="md" icon="arrow-undo" label="Undo" disabled={!canUndo} onPress={undo} />
        <Button variant="ghost" size="md" label="Done" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { flex: 1, justifyContent: "center", minHeight: 120 },
  sub: { fontFamily: fonts.bodySemi, fontSize: 18, marginTop: 12 },
  list: { marginBottom: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
  },
  rank: { fontFamily: fonts.bodyBold, fontSize: 14, width: 16 },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, flex: 1 },
  landed: { fontFamily: fonts.bodySemi, fontSize: 13 },
  sub2: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
});
