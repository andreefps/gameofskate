import { useEffect, useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { impactMedium, selectionTick } from "@/lib/haptics";
import { CHAR_WIDTH_EM } from "@/lib/ui/fit-hero";
import { pickFillers, reelPlan } from "@/lib/ui/reel";
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

const TICK_THROTTLE_MS = 40;

function Reel({
  final,
  fillers,
  duration,
  fontSize,
  lineHeight,
  color,
  isLast,
  haptics,
}: {
  final: string;
  fillers: string[];
  duration: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  /** The longest reel drives the haptic ticks and the landing thump. */
  isLast: boolean;
  haptics: boolean;
}) {
  const progress = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const rows = fillers.length + 1;

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: EASE }, (finished) => {
      if (finished && isLast && haptics) scheduleOnRN(impactMedium);
    });
  }, [duration, isLast, haptics, progress]);

  useAnimatedReaction(
    () => Math.floor(progress.value * rows),
    (step, prev) => {
      if (!isLast || !haptics || prev === null || step === prev || step >= rows) return;
      const now = Date.now();
      if (now - lastTick.value < TICK_THROTTLE_MS) return;
      lastTick.value = now;
      scheduleOnRN(selectionTick);
    },
  );

  // Column starts one line below the mask and scrolls up until the final word sits in it.
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: lineHeight - progress.value * rows * lineHeight }],
  }));

  return (
    <View style={{ height: lineHeight, overflow: "hidden" }}>
      <Animated.View style={style}>
        {[...fillers, final].map((text, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={[styles.word, { fontSize, lineHeight, height: lineHeight, color }]}
          >
            {text}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export type SpinConfig = {
  /** 0..1 flick strength; longer spin for harder flicks. */
  strength: number;
  /** Tricks whose name words become reel fillers. */
  pool: readonly { name: string }[];
  /** Stage width: fillers wider than this at the current font size are skipped. */
  maxWidth: number;
};

/** Slot-machine variant: each line is a reel that decelerates onto its word, cascading top to bottom. */
function SpinName({
  words,
  fontSize,
  lineHeight,
  color,
  haptics,
  spin,
}: {
  words: string[];
  fontSize: number;
  lineHeight: number;
  color: string;
  haptics: boolean;
  spin: SpinConfig;
}) {
  // Once per spin: the parent re-keys per rollToken, so the initializer runs per roll.
  const [reels] = useState(() => {
    const plan = reelPlan(words.length, spin.strength);
    const candidates = spin.pool.flatMap((t) => t.name.toUpperCase().split(" "));
    const maxChars = Math.floor(spin.maxWidth / (fontSize * CHAR_WIDTH_EM));
    return words.map((word, i) => ({
      fillers: pickFillers(candidates, word, plan.fillerCounts[i], maxChars),
      duration: plan.durations[i],
    }));
  });

  return (
    <View>
      {words.map((word, i) => (
        <Reel
          key={i}
          final={word}
          fillers={reels[i].fillers}
          duration={reels[i].duration}
          fontSize={fontSize}
          lineHeight={lineHeight}
          color={color}
          isLast={i === words.length - 1}
          haptics={haptics}
        />
      ))}
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
  /** Spin like a slot machine instead of the plain reveal (free-mode roll). */
  spin?: SpinConfig;
};

/** One word per line, each sliding up inside its own overflow mask. */
export function TrickName({ words, fontSize, lineHeight, color, animate = true, haptics = false, spin }: TrickNameProps) {
  const reduceMotion = useReducedMotion();
  const spinning = !!spin && animate && !reduceMotion;

  useEffect(() => {
    if (!animate || !haptics || spinning) return;
    const total = reduceMotion ? REDUCED_DURATION : (words.length - 1) * WORD_STAGGER + WORD_DURATION;
    const id = setTimeout(selectionTick, total);
    return () => clearTimeout(id);
  }, [animate, haptics, spinning, reduceMotion, words.length]);

  if (spinning) {
    return (
      <SpinName words={words} fontSize={fontSize} lineHeight={lineHeight} color={color} haptics={haptics} spin={spin} />
    );
  }

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
  delay,
  children,
}: {
  wordCount: number;
  animate?: boolean;
  /** Explicit delay (ms), e.g. the spin total; defaults to the plain-reveal timing. */
  delay?: number;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    opacity.value = withDelay(
      reduceMotion ? 0 : (delay ?? metaDelay(wordCount)),
      withTiming(1, { duration: FADE_DURATION }),
    );
  }, [animate, reduceMotion, wordCount, delay, opacity]);

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
