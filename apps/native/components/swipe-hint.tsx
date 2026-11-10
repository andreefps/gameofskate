import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Platform, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

// Desktop browsers get the keyboard hint; phones (native or mobile web) get the swipe cue.
const keyboardFirst =
  Platform.OS === "web" &&
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  !window.matchMedia("(pointer: coarse)").matches;

/** Subtle "swipe up to spin" cue. Keeps its height when hidden so layout never jumps. */
export function SwipeHint({ hidden }: { hidden: boolean }) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const nudge = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(hidden ? 0 : 1, { duration: 250 });
  }, [hidden, opacity]);

  useEffect(() => {
    if (reduceMotion || hidden) {
      nudge.value = 0;
      return;
    }
    nudge.value = withRepeat(
      withSequence(withTiming(4, { duration: 900 }), withTiming(0, { duration: 900 })),
      -1,
    );
  }, [reduceMotion, hidden, nudge]);

  const rowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -nudge.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.row, rowStyle]}
    >
      <Text style={[styles.text, { color: colors.inkMuted }]}>
        {keyboardFirst ? "Swipe up or press Space" : "Swipe up to spin"}
      </Text>
      {keyboardFirst ? null : (
        <Animated.View style={iconStyle}>
          <Ionicons name="chevron-up" size={14} color={colors.inkMuted} />
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { height: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  text: { fontFamily: fonts.bodySemi, fontSize: 13 },
});
