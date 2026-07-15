import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";
import { useAppTheme } from "@/contexts/app-theme-context";
import { selectionTick } from "@/lib/haptics";
import type { Domain } from "@/lib/skate/types";

type Props = {
  domain: Domain;
  onToggle: () => void;
  hapticsEnabled: boolean;
};

/** Tappable pill showing the active domain; tap switches between domains. */
export function DomainPill({ domain, onToggle, hapticsEnabled }: Props) {
  const { isLight } = useAppTheme();

  return (
    <ScalePressable
      style={[
        styles.pill,
        {
          backgroundColor: "#F6C84C",
          boxShadow: isLight ? "3px 4px 0 #17212B" : "3px 4px 0 rgba(255, 247, 223, 0.22)",
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
      <Text style={styles.prefix}>SPOT:</Text>
      <Text style={styles.label}>{domain.label}</Text>
      <Ionicons name="swap-horizontal" size={17} color="#17212B" />
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
    color: "#17212B",
    fontFamily: "DMSans_700Bold",
    fontSize: 8,
    letterSpacing: 1.2,
  },
  label: {
    color: "#17212B",
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 17,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
