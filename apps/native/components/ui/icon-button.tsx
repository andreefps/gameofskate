import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { useTheme } from "@/theme/theme-provider";
import { radius } from "@/theme/tokens";

type Props = {
  icon: ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  accessibilityLabel: string;
};

export function IconButton({ icon, onPress, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      haptic
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, { backgroundColor: colors.surface }]}
    >
      <Ionicons name={icon} size={22} color={colors.ink} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { width: 44, height: 44, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
});
