import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { WORD } from "@/lib/skate/game";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const GAIN_MS = 220;

type CellProps = {
  char: string;
  earned: boolean;
  size: number;
  /** 0 = normal card, 1 = inverted (actor) card; drives the unearned color. */
  inverted?: SharedValue<number>;
};

function Cell({ char, earned, size, inverted }: CellProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const gain = useSharedValue(earned ? 1 : 0);
  const scale = useSharedValue(1);
  const prev = useRef(earned);

  useEffect(() => {
    if (prev.current === earned) return;
    prev.current = earned;
    if (earned) {
      if (!reduceMotion) {
        scale.value = 1.4;
        scale.value = withTiming(1, { duration: GAIN_MS, easing: Easing.out(Easing.cubic) });
      }
      gain.value = withTiming(1, { duration: reduceMotion ? 120 : GAIN_MS });
    } else {
      gain.value = withTiming(0, { duration: 120 });
    }
  }, [earned, reduceMotion, gain, scale]);

  const { ghost, ghostOnInk, accent } = colors;
  const style = useAnimatedStyle(() => {
    const base = inverted ? interpolateColor(inverted.value, [0, 1], [ghost, ghostOnInk]) : ghost;
    return {
      color: interpolateColor(gain.value, [0, 1], [base, accent]),
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.Text
      style={[styles.letter, { fontSize: size, lineHeight: Math.round(size * 1.05), width: size * 0.62 }, style]}
    >
      {char}
    </Animated.Text>
  );
}

type Props = {
  count: number;
  size?: number;
  inverted?: SharedValue<number>;
};

/** S K A T E with earned letters in the accent color. */
export function Letters({ count, size = 18, inverted }: Props) {
  return (
    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {WORD.split("").map((char, i) => (
        <Cell key={i} char={char} earned={i < count} size={size} inverted={inverted} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 2 },
  letter: { fontFamily: fonts.display, textAlign: "center", includeFontPadding: false },
});
