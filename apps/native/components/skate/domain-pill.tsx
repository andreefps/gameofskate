import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useThemeColor } from "heroui-native";
import { Pressable, StyleSheet, Text } from "react-native";

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
    <Pressable
      style={[styles.pill, { backgroundColor: surface }]}
      hitSlop={8}
      onPress={() => {
        if (hapticsEnabled) {
          void Haptics.selectionAsync();
        }
        onToggle();
      }}
    >
      <Text style={[styles.label, { color: foreground }]}>{domain.label}</Text>
      <Ionicons name="swap-horizontal" size={15} color={foreground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
});
