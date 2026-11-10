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
import type { Slot, SlotKind } from "@/lib/skate/slots";
import { fillerCandidates, pickFillers, reelPlan } from "@/lib/ui/reel";
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
  lineCount,
  duration,
  fontSize,
  lineHeight,
  color,
  isLast,
  haptics,
}: {
  final: string[];
  /** Each filler is the words of one candidate value, one per line. */
  fillers: string[][];
  /** Lines this slot occupies (its word count). */
  lineCount: number;
  duration: number;
  fontSize: number;
  lineHeight: number;
  color: string;
  /** The last slot drives the running ticks and the landing thump; earlier ones tick lightly. */
  isLast: boolean;
  haptics: boolean;
}) {
  const progress = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const rows = fillers.length + 1;
  const itemHeight = lineCount * lineHeight;

  useEffect(() => {
    progress.value = withTiming(1, { duration, easing: EASE }, (finished) => {
      if (!finished || !haptics) return;
      scheduleOnRN(isLast ? impactMedium : selectionTick);
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

  // Column starts one item below the mask and scrolls up until the final value sits in it.
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: itemHeight - progress.value * rows * itemHeight }],
  }));

  return (
    <View style={{ height: itemHeight, overflow: "hidden" }}>
      <Animated.View style={style}>
        {[...fillers, final].map((words, i) => (
          <View key={i} style={{ height: itemHeight }}>
            {words.map((text, j) => (
              <Text
                key={j}
                numberOfLines={1}
                style={[styles.word, { fontSize, lineHeight, height: lineHeight, color }]}
              >
                {text}
              </Text>
            ))}
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

export type SpinConfig = {
  /** 0..1 flick strength; longer spin for harder flicks. */
  strength: number;
  /** The trick's semantic slots, in stop order (stance, direction, rotation, trick). */
  slots: Slot[];
  /** Filler values per slot kind. */
  vocab: Record<SlotKind, string[]>;
  /** Stage width: fillers wider than this at the current font size are skipped. */
  maxWidth: number;
};

/** Slot-machine variant: one reel per slot, each decelerating onto its value in reading order. */
function SpinName({
  fontSize,
  lineHeight,
  color,
  haptics,
  spin,
}: {
  fontSize: number;
  lineHeight: number;
  color: string;
  haptics: boolean;
  spin: SpinConfig;
}) {
  // Once per spin: the parent re-keys per rollToken, so the initializer runs per roll.
  const [reels] = useState(() => {
    const plan = reelPlan(spin.slots.length, spin.strength);
    const maxChars = Math.floor(spin.maxWidth / (fontSize * CHAR_WIDTH_EM));
    return spin.slots.map((slot, i) => {
      const final = slot.words.join(" ");
      const candidates = fillerCandidates(spin.vocab[slot.kind], slot.words.length, maxChars);
      return {
        fillers: pickFillers(candidates, final, plan.fillerCounts[i]).map((f) => f.split(" ")),
        duration: plan.durations[i],
      };
    });
  });

  return (
    <View>
      {spin.slots.map((slot, i) => (
        <Reel
          key={i}
          final={slot.words}
          fillers={reels[i].fillers}
          lineCount={slot.words.length}
          duration={reels[i].duration}
          fontSize={fontSize}
          lineHeight={lineHeight}
          color={color}
          isLast={i === spin.slots.length - 1}
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
      <SpinName fontSize={fontSize} lineHeight={lineHeight} color={color} haptics={haptics} spin={spin} />
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
