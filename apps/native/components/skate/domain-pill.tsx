import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "heroui-native";
import { StyleSheet, Text } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";
import { selectionTick } from "@/lib/haptics";
import type { Domain } from "@/lib/skate/types";

type Props = {
  domain: Domain;
  onToggle: () => void;
  hapticsEnabled: boolean;
};

/** Tappable pill showing the active domain; tap switches between domains. */
export function DomainPill({ domain, onToggle, hapticsEnabled }: Props) {
  const [foreground, surface] = useThemeColor(["foreground", "surface-secondary"]);

  return (
    <ScalePressable
      style={[styles.pill, { backgroundColor: surface }]}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Switch trick mode"
      accessibilityValue={{ text: domain.label }}
      onPress={() => {
        if (hapticsEnabled) selectionTick();
        onToggle();
      }}
    >
      <Text style={[styles.label, { color: foreground }]}>{domain.label}</Text>
      <Ionicons name="swap-horizontal" size={15} color={foreground} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
