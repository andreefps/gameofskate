import { StyleSheet, Text } from "react-native";

import type { GameState } from "@/lib/skate/game";
import { turnLine } from "@/lib/skate/standings";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

/** "ANA SETS" / "BRUNO — MATCH IT" / "TRICK 7". Visual only; PlayersStrip announces turn changes. */
export function TurnLine({ state }: { state: GameState }) {
  const { colors } = useTheme();
  const { lead, rest } = turnLine(state);
  return (
    <Text numberOfLines={1} style={[styles.text, { color: colors.inkMuted }]}>
      <Text style={{ color: colors.ink }}>{lead}</Text>
      {rest}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: fonts.bodyBold, fontSize: 13, letterSpacing: 1.5, textTransform: "uppercase", flexShrink: 1 },
});
