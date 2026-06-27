import { useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { impactLight, notifySuccess } from "@/lib/haptics";
import type { Trick } from "@/lib/skate/types";

const FLICKER_TICKS = 7;
const FLICKER_INTERVAL_MS = 45;

type Props = {
  trick: Trick;
  /** Increments on every user-initiated roll; 0 means the initial paint. */
  token: number;
  /** Candidate names shown during the slot-machine flicker. */
  flickerNames: string[];
  hapticsEnabled: boolean;
};

export function TrickReveal({ trick, token, flickerNames, hapticsEnabled }: Props) {
  const [display, setDisplay] = useState(trick.name);
  const reduceMotion = useReducedMotion();

  const foreground = useThemeColor("foreground");

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevToken = useRef<number | null>(null);

  useEffect(() => {
    const rolled = prevToken.current === null || token !== prevToken.current;
    prevToken.current = token;

    if (intervalRef.current) clearInterval(intervalRef.current);

    // Trick changed without a roll (e.g. a filter re-pick): show it immediately.
    if (!rolled) {
      setDisplay(trick.name);
      opacity.value = 1;
      translateY.value = 0;
      scale.value = 1;
      return;
    }

    const settle = () => {
      setDisplay(trick.name);
      if (reduceMotion) {
        opacity.value = withTiming(1, { duration: 160 });
      } else {
        opacity.value = withTiming(1, { duration: 80 });
        translateY.value = withSpring(0, { damping: 14, stiffness: 180 });
        scale.value = withSequence(
          withTiming(1.14, { duration: 90, easing: Easing.out(Easing.quad) }),
          withSpring(1, { damping: 9, stiffness: 170 }),
        );
      }
      if (hapticsEnabled) notifySuccess();
    };

    if (reduceMotion || flickerNames.length < 2) {
      opacity.value = 0;
      settle();
      return;
    }

    // Slot-machine flicker, then settle on the chosen trick.
    let i = 0;
    opacity.value = 0.85;
    translateY.value = -6;
    intervalRef.current = setInterval(() => {
      i += 1;
      if (i >= FLICKER_TICKS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        settle();
        return;
      }
      const name = flickerNames[Math.floor(Math.random() * flickerNames.length)] ?? trick.name;
      setDisplay(name);
      if (hapticsEnabled) impactLight();
    }, FLICKER_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // Animate on a roll (token change); a re-pick without a roll shows instantly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, trick.id]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.Text
        style={[styles.name, animStyle, { color: foreground }]}
        numberOfLines={3}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {display}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 44,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.5,
  },
});
