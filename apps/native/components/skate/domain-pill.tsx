import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";
import { selectionTick } from "@/lib/haptics";
import type { Domain } from "@/lib/skate/types";
import { useTheme } from "@/theme/theme-provider";

type Props = {
  domain: Domain;
  onToggle: () => void;
  hapticsEnabled: boolean;
};

/** Tappable pill showing the active domain; tap switches between domains. */
export function DomainPill({ domain, onToggle, hapticsEnabled }: Props) {
  const { colors } = useTheme();

  return (
    <ScalePressable
      style={[
        styles.pill,
        {
          backgroundColor: colors.accent,
          boxShadow: `3px 4px 0 ${colors.ink}`,
        },
      ]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Switch trick mode"
      accessibilityValue={{ text: domain.label }}
      onPress={() => {
        if (hapticsEnabled) selectionTick();
        onToggle();
      }}
    >
      <Text style={[styles.prefix, { color: colors.accentInk }]}>SPOT:</Text>
      <Text style={[styles.label, { color: colors.accentInk }]}>{domain.label}</Text>
      <Ionicons name="swap-horizontal" size={17} color={colors.accentInk} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    minHeight: 42,
    paddingLeft: 13,
    paddingRight: 12,
    paddingVertical: 9,
    borderRadius: 10,
    transform: [{ rotate: "-1.5deg" }],
  },
  prefix: {
    fontFamily: "DMSans_700Bold",
    fontSize: 8,
    letterSpacing: 1.2,
  },
  label: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 17,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
