import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { IconButton } from "@/components/ui/icon-button";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

type Props = {
  onOpenSettings: () => void;
  /** Slot rendered before the settings button (game mode entry goes here). */
  headerRight?: ReactNode;
};

export function Header({ onOpenSettings, headerRight }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={[styles.wordmark, { color: colors.ink }]}>
        SKATE CALL
      </Text>
      <View style={styles.right}>
        {headerRight}
        <IconButton icon="options-outline" onPress={onOpenSettings} accessibilityLabel="Open settings" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  wordmark: { fontFamily: fonts.display, fontSize: 22, letterSpacing: 0.5 },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
});
