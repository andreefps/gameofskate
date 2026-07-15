import { useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { ScalePressable } from "@/components/scale-pressable";
import { impactLight, impactMedium } from "@/lib/haptics";

type Props = {
  onRoll: () => void;
  hapticsEnabled: boolean;
  isRolling: boolean;
  hasRolled: boolean;
  children: ReactNode;
};

/** Slot-machine result with one explicit, accessible roll action. */
export function GenerateSurface({
  onRoll,
  hapticsEnabled,
  isRolling,
  hasRolled,
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const [foreground, background] = useThemeColor(["foreground", "background"]);
  const label = isRolling ? "Rolling…" : hasRolled ? "Roll again" : "Roll";

  return (
    <View style={[styles.surface, Platform.OS === "web" && styles.web]}>
      {children}

      <ScalePressable
        onPress={() => {
          if (hapticsEnabled) {
            if (reduceMotion) impactLight();
            else impactMedium();
          }
          onRoll();
        }}
        disabled={isRolling}
        style={[
          styles.button,
          { backgroundColor: foreground },
          isRolling && styles.buttonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: isRolling, busy: isRolling }}
      >
        <Text style={[styles.buttonLabel, { color: background }]}>{label}</Text>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    width: "100%",
    maxWidth: 416,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 28,
  },
  button: {
    minWidth: 132,
    minHeight: 48,
    marginTop: 24,
    paddingHorizontal: 22,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
  web: {
    userSelect: "none",
  },
});
