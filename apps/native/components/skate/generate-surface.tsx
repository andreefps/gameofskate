import { useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

import { ScalePressable } from "@/components/scale-pressable";
import { useAppTheme } from "@/contexts/app-theme-context";
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
  const [foreground, surface] = useThemeColor(["foreground", "surface"]);
  const { isLight } = useAppTheme();
  const label = isRolling ? "ROLLING…" : hasRolled ? "ROLL AGAIN" : "CALL A TRICK";

  return (
    <View
      style={[
        styles.deckShadow,
        Platform.OS === "web" && styles.web,
        {
          backgroundColor: isLight ? "#17212B" : "#081117",
          boxShadow: isLight
            ? "0 22px 40px rgba(23, 33, 43, 0.25), 7px 9px 0 rgba(23, 33, 43, 0.9)"
            : "0 22px 48px rgba(0, 0, 0, 0.42), 7px 9px 0 rgba(255, 247, 223, 0.12)",
        },
      ]}
    >
      <View style={[styles.boltRow, styles.boltRowTop]}>
        <View style={styles.bolt} />
        <View style={styles.bolt} />
      </View>

      <View style={styles.surface}>
        <View style={[styles.tape, { backgroundColor: isLight ? "#F6C84C" : "#D9A72D" }]}>
          <Text style={styles.tapeText}>TODAY'S SET</Text>
        </View>
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
            {
              backgroundColor: "#F15B45",
              boxShadow: isLight ? "4px 5px 0 #FFF7DF" : "4px 5px 0 #22343D",
            },
            isRolling && styles.buttonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityState={{ disabled: isRolling, busy: isRolling }}
        >
          <Text style={[styles.buttonLabel, { color: "#FFF7DF" }]}>{label}</Text>
          <View style={[styles.buttonArrow, { backgroundColor: surface }]}>
            <Text style={[styles.buttonArrowText, { color: foreground }]}>↗</Text>
          </View>
        </ScalePressable>
      </View>

      <View style={[styles.boltRow, styles.boltRowBottom]}>
        <View style={styles.bolt} />
        <View style={styles.bolt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deckShadow: {
    width: "100%",
    maxWidth: 404,
    minHeight: 470,
    borderRadius: 54,
    paddingVertical: 28,
    overflow: "hidden",
  },
  surface: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  boltRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    zIndex: 2,
    pointerEvents: "none",
  },
  boltRowTop: {
    top: 14,
  },
  boltRowBottom: {
    bottom: 14,
  },
  bolt: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#98A5A8",
    boxShadow: "inset 1px 1px 1px rgba(255,255,255,0.45), 0 1px 1px rgba(0,0,0,0.7)",
  },
  tape: {
    position: "absolute",
    top: 4,
    left: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    transform: [{ rotate: "-5deg" }],
  },
  tapeText: {
    color: "#17212B",
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.4,
  },
  button: {
    minWidth: 210,
    minHeight: 58,
    marginTop: 26,
    paddingLeft: 24,
    paddingRight: 8,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonLabel: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 19,
    letterSpacing: 1.1,
  },
  buttonArrow: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonArrowText: {
    marginTop: -2,
    fontFamily: "DMSans_700Bold",
    fontSize: 23,
  },
  web: {
    userSelect: "none",
  },
});
