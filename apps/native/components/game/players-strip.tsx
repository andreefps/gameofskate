import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { Letters } from "@/components/game/letters";
import { actor, isOut, WORD, type GameState, type Player } from "@/lib/skate/game";
import { playerLabel, turnAnnouncement } from "@/lib/skate/standings";
import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

const GAP = 8;
const SWAP_MS = 160;

type CardProps = { player: Player; isActor: boolean; isSetter: boolean; width: number | undefined };

function PlayerCard({ player, isActor, isSetter, width }: CardProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const out = isOut(player);
  const inverted = useSharedValue(isActor ? 1 : 0);

  useEffect(() => {
    inverted.value = withTiming(isActor ? 1 : 0, { duration: reduceMotion ? 0 : SWAP_MS });
  }, [isActor, reduceMotion, inverted]);

  const { surface, ink, bg } = colors;
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(inverted.value, [0, 1], [surface, ink]),
  }));
  const nameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(inverted.value, [0, 1], [ink, bg]),
  }));
  const setStyle = useAnimatedStyle(() => ({
    color: interpolateColor(inverted.value, [0, 1], [colors.inkMuted, bg]),
  }));

  return (
    <Animated.View
      accessible
      accessibilityLabel={playerLabel(player, WORD, { actor: isActor, out })}
      style={[styles.card, width ? { width } : styles.cardFlex, { opacity: out ? 0.4 : 1 }, cardStyle]}
    >
      <View style={styles.nameRow}>
        <Animated.Text
          numberOfLines={1}
          style={[styles.name, out && styles.struck, nameStyle]}
        >
          {player.name}
        </Animated.Text>
        {isSetter ? <Animated.Text style={[styles.set, setStyle]}>SET</Animated.Text> : null}
      </View>
      <Letters count={player.letters} inverted={inverted} />
    </Animated.View>
  );
}

/** Letter message for the first player whose letter count rose, or "". */
function letterMessage(before: Player[], players: Player[]): string {
  const gained = players.findIndex((p, i) => p.letters > before[i]!.letters);
  if (gained < 0) return "";
  const p = players[gained]!;
  const letter = WORD[p.letters - 1]!;
  // Article follows the spoken letter name: "an S", "a K", "an A", "a T", "an E".
  const article = "SAE".includes(letter) ? "an" : "a";
  return `${p.name} takes ${article} ${letter}${isOut(p) ? ". Out" : ""}`;
}

/** Polite live region + iOS announcement for letters taken and turn changes. */
function useGameAnnouncement(state: GameState): string {
  const [message, setMessage] = useState("");
  const prev = useRef(state);
  const flip = useRef(false);

  useEffect(() => {
    const before = prev.current;
    prev.current = state;
    const sameRoster = before.players.length === state.players.length;
    const letters = sameRoster ? letterMessage(before.players, state.players) : "";
    const turnChanged =
      before.turn !== state.turn || before.phase !== state.phase || actor(before) !== actor(state);
    const turn = turnChanged && state.phase !== "over" ? turnAnnouncement(state) : "";
    const text = [letters, turn].filter(Boolean).join(". ");
    if (!text) return;
    // Alternate a trailing zero-width space so an identical message is announced again.
    flip.current = !flip.current;
    setMessage(flip.current ? text : `${text}\u200B`);
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibility(text);
  }, [state]);

  return message;
}

export function PlayersStrip({ state }: { state: GameState }) {
  const { players } = state;
  const [width, setWidth] = useState(0);
  const message = useGameAnnouncement(state);

  const current = actor(state);
  const showSet = players.length > 1 && state.phase !== "over";
  const perRow = players.length <= 4 ? players.length : Math.ceil(players.length / 2);
  const cardWidth = width > 0 ? Math.floor((width - GAP * (perRow - 1)) / perRow) : undefined;

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    setWidth((prev) => (prev === w ? prev : w));
  };

  return (
    <View onLayout={onLayout} style={styles.strip} accessibilityRole="list">
      {players.map((p, i) => (
        <PlayerCard
          key={p.id}
          player={p}
          isActor={current === i}
          isSetter={showSet && state.setter === i}
          width={cardWidth}
        />
      ))}
      <View pointerEvents="none" accessibilityLiveRegion="polite" style={styles.srOnly}>
        <Text>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", flexWrap: "wrap", gap: GAP, marginTop: 16 },
  card: { borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  cardFlex: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, flexShrink: 1 },
  struck: { textDecorationLine: "line-through" },
  set: { fontFamily: fonts.bodyBold, fontSize: 9, letterSpacing: 1 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
});
