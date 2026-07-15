import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { withUniwind } from "uniwind";

import { ScalePressable } from "@/components/scale-pressable";
import { useAppTheme } from "@/contexts/app-theme-context";
import { impactLight } from "@/lib/haptics";

const StyledIonicons = withUniwind(Ionicons);
const ICON_TRANSITION_MS = 300;

type Props = {
  hapticsEnabled: boolean;
};

export function ThemeToggle({ hapticsEnabled }: Props) {
  const { toggleTheme, isLight } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(isLight ? 0 : 1);
  const didMount = useRef(false);

  useEffect(() => {
    const next = isLight ? 0 : 1;

    // The current theme is default state, so it should not animate on app load.
    if (!didMount.current || reduceMotion) {
      didMount.current = true;
      progress.value = next;
      return;
    }

    progress.value = withTiming(next, {
      duration: ICON_TRANSITION_MS,
      easing: Easing.bezier(0.2, 0, 0, 1),
    });
  }, [isLight, progress, reduceMotion]);

  const moonStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    filter: [{ blur: interpolate(progress.value, [0, 1], [0, 4]) }],
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 0.25]) }],
  }));

  const sunStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    filter: [{ blur: interpolate(progress.value, [0, 1], [4, 0]) }],
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.25, 1]) }],
  }));

  return (
    <ScalePressable
      onPress={() => {
        if (hapticsEnabled && !reduceMotion) impactLight();
        toggleTheme();
      }}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel={`Use ${isLight ? "dark" : "light"} theme`}
    >
      <View style={styles.iconStack} pointerEvents="none">
        <Animated.View style={[styles.icon, moonStyle]}>
          <StyledIonicons name="moon" size={20} className="text-foreground" />
        </Animated.View>
        <Animated.View style={[styles.icon, sunStyle]}>
          <StyledIonicons name="sunny" size={20} className="text-foreground" />
        </Animated.View>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  iconStack: {
    width: 20,
    height: 20,
  },
  icon: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
