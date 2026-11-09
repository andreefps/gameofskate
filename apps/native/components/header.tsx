import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

type Props = {
  /** Current trick-bag level ("Advanced", "Custom"…), shown on the settings button. */
  levelLabel: string;
  onOpenSettings: () => void;
  /** Slot rendered before the settings button (e.g. "End" during a game). */
  headerRight?: ReactNode;
};

export function Header({ levelLabel, onOpenSettings, headerRight }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[styles.wordmark, { color: colors.ink }]}>
        SKATE CALL
      </Text>
      <View style={styles.right}>
        {headerRight}
        <PressableScale
          haptic
          onPress={onOpenSettings}
          accessibilityRole="button"
          accessibilityLabel={`Trick bag: ${levelLabel}. Open settings`}
          style={[styles.level, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="options-outline" size={18} color={colors.ink} />
          <Text style={[styles.levelLabel, { color: colors.ink }]}>{levelLabel}</Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  wordmark: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  level: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  levelLabel: { fontFamily: fonts.bodySemi, fontSize: 15 },
});
