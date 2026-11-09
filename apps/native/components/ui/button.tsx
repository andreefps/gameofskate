import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";

import { PressableScale } from "@/components/ui/pressable-scale";
import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "lg" | "md";
  icon?: ComponentProps<typeof Ionicons>["name"];
  disabled?: boolean;
  /** Text color override (e.g. danger). */
  color?: string;
  haptic?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  disabled,
  color,
  haptic,
  style,
  accessibilityLabel,
}: Props) {
  const { colors } = useTheme();
  const lg = size === "lg";

  const bg =
    variant === "primary" ? colors.accent : variant === "secondary" ? colors.surface : "transparent";
  const fg = color ?? (variant === "primary" ? colors.accentInk : colors.ink);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={[
        styles.base,
        {
          height: lg ? 64 : 48,
          backgroundColor: bg,
          borderRadius: lg ? radius.md : radius.sm,
          borderWidth: variant === "secondary" ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: colors.line,
          opacity: disabled ? 0.4 : 1,
          paddingHorizontal: lg ? 24 : 18,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={lg ? 24 : 18} color={fg} /> : null}
      <Text
        style={[
          lg ? styles.lg : styles.md,
          { color: fg },
        ]}
      >
        {lg ? label.toUpperCase() : label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  lg: { fontFamily: fonts.display, fontSize: 24, letterSpacing: 0.5, textTransform: "uppercase" },
  md: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
