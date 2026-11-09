import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { selectionTick } from "@/lib/haptics";
import { fonts } from "@/theme/tokens";

export const WORD_DURATION = 220;
export const WORD_STAGGER = 45;
export const FADE_DURATION = 120;
const REDUCED_DURATION = 120;

const EASE = Easing.out(Easing.cubic);

/** Delay (ms) before the meta/alias fade starts, keeping the total under 450ms. */
export function metaDelay(wordCount: number): number {
  const lastEnd = (wordCount - 1) * WORD_STAGGER + WORD_DURATION;
  return Math.min(lastEnd - 60, 300);
}

function Word({
  text,
  index,
  fontSize,
  lineHeight,
  color,
  animate,
}: {
  text: string;
  index: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  animate: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    progress.value = withDelay(
      reduceMotion ? 0 : index * WORD_STAGGER,
      withTiming(1, { duration: reduceMotion ? REDUCED_DURATION : WORD_DURATION, easing: EASE }),
    );
  }, [animate, reduceMotion, index, progress]);

  const style = useAnimatedStyle(() =>
    reduceMotion
      ? { opacity: progress.value }
      : { transform: [{ translateY: (1 - progress.value) * lineHeight }] },
  );

  return (
    <View style={{ height: lineHeight, overflow: "hidden" }}>
      <Animated.View style={style}>
        <Text
          numberOfLines={1}
          style={[styles.word, { fontSize, lineHeight, height: lineHeight, color }]}
        >
          {text}
        </Text>
      </Animated.View>
    </View>
  );
}

type TrickNameProps = {
  words: string[];
  fontSize: number;
  lineHeight: number;
  color: string;
  /** Play the reveal on mount. Re-key the component to replay it. */
  animate?: boolean;
  /** Fires a selection tick when the last word lands. */
  haptics?: boolean;
};

/** One word per line, each sliding up inside its own overflow mask. */
export function TrickName({ words, fontSize, lineHeight, color, animate = true, haptics = false }: TrickNameProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!animate || !haptics) return;
    const total = reduceMotion ? REDUCED_DURATION : (words.length - 1) * WORD_STAGGER + WORD_DURATION;
    const id = setTimeout(selectionTick, total);
    return () => clearTimeout(id);
  }, [animate, haptics, reduceMotion, words.length]);

  return (
    <View>
      {words.map((word, i) => (
        <Word
          key={i}
          text={word}
          index={i}
          fontSize={fontSize}
          lineHeight={lineHeight}
          color={color}
          animate={animate}
        />
      ))}
    </View>
  );
}

/** Fades children in after the name has mostly landed. */
export function RevealFade({
  wordCount,
  animate = true,
  children,
}: {
  wordCount: number;
  animate?: boolean;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    opacity.value = withDelay(
      reduceMotion ? 0 : metaDelay(wordCount),
      withTiming(1, { duration: FADE_DURATION }),
    );
  }, [animate, reduceMotion, wordCount, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  word: {
    fontFamily: fonts.display,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
});
