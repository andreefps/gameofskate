import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { TIER_LABEL } from "@/components/skate/tier-label";
import { impactLight, notifySuccess } from "@/lib/haptics";
import { DOMAINS } from "@/lib/skate/domains";
import { tierOf } from "@/lib/skate/tier";
import type { Trick } from "@/lib/skate/types";

const REEL_HEIGHT = 54;
const BASE_REEL_ITEMS = 11;
const FIRST_REEL_SETTLE_MS = 780;
const REEL_SETTLE_INTERVAL_MS = 200;
const LAST_REEL_SETTLE_MS = FIRST_REEL_SETTLE_MS + REEL_SETTLE_INTERVAL_MS * 3;
const RESULT_DELAY_MS = LAST_REEL_SETTLE_MS + 20;
const RESULT_FADE_MS = 100;
const EMPTY_SLOT = "-";

export const SLOT_REVEAL_DURATION_MS = RESULT_DELAY_MS + RESULT_FADE_MS;

type SlotValues = {
  stance: string;
  rotation: string;
  trick: string;
  direction: string;
};

type SlotKey = keyof SlotValues;

const SLOT_CONFIG: Array<{
  key: SlotKey;
  label: string;
  widthStyle: object;
}> = [
  { key: "stance", label: "Stance", widthStyle: { width: 78 } },
  { key: "rotation", label: "Spin", widthStyle: { width: 58 } },
  { key: "trick", label: "Trick", widthStyle: { flex: 1, minWidth: 96 } },
  { key: "direction", label: "Side", widthStyle: { width: 52 } },
];

type Props = {
  trick: Trick | null;
  /** Increments on every user-initiated roll; 0 means the initial paint. */
  token: number;
  /** Candidate tricks used to populate believable reel values. */
  candidates: Trick[];
  hapticsEnabled: boolean;
};

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function toSlotValues(trick: Trick): SlotValues {
  const domain = DOMAINS[trick.domain];
  const baseName = domain.bases.find((base) => base.id === trick.base)?.name ?? trick.base;
  const rotationMatch = /^(180|360)(?:\s+|$)/.exec(baseName);
  const rotation = rotationMatch?.[1] ?? "";
  const baseWithoutRotation = rotationMatch ? baseName.slice(rotationMatch[0].length) : baseName;

  return {
    stance: trick.stance === "regular" ? "" : capitalize(trick.stance),
    rotation,
    trick: baseName === "Ollie" || baseWithoutRotation.length === 0 ? "" : baseWithoutRotation,
    direction: trick.dir === "fs" ? "FS" : trick.dir === "bs" ? "BS" : "",
  };
}

function randomFrom(values: string[]): string {
  return values[Math.floor(Math.random() * values.length)] ?? "";
}

function shuffledSlotOrder(): number[] {
  const order = SLOT_CONFIG.map((_, index) => index);
  for (let index = order.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapWith]] = [order[swapWith]!, order[index]!];
  }
  return order;
}

type ReelProps = {
  label: string;
  value: string;
  options: string[];
  settleRank: number;
  token: number;
  hapticsEnabled: boolean;
  foreground: string;
  muted: string;
  surface: string;
  widthStyle: object;
  animate: boolean;
};

function SlotReel({
  label,
  value,
  options,
  settleRank,
  token,
  hapticsEnabled,
  foreground,
  muted,
  surface,
  widthStyle,
  animate,
}: ReelProps) {
  const reduceMotion = useReducedMotion();
  const [sequence, setSequence] = useState([
    animate && !reduceMotion ? randomFrom(options) : value,
  ]);
  const offset = useSharedValue(0);
  const previousToken = useRef<number | null>(null);

  useEffect(() => {
    const rolled = previousToken.current === null || previousToken.current !== token;
    previousToken.current = token;
    cancelAnimation(offset);

    if (!animate || !rolled || reduceMotion) {
      setSequence([value]);
      offset.value = 0;
      return;
    }

    const itemCount = BASE_REEL_ITEMS + settleRank * 3;
    const nextSequence = Array.from({ length: itemCount - 1 }, () => randomFrom(options));
    nextSequence.push(value);
    setSequence(nextSequence);
    offset.value = 0;

    const duration = FIRST_REEL_SETTLE_MS + settleRank * REEL_SETTLE_INTERVAL_MS;
    const animationTimer = setTimeout(() => {
      offset.value = withTiming(-REEL_HEIGHT * (nextSequence.length - 1), {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, 16);

    const hapticTimer = setTimeout(() => {
      if (!hapticsEnabled) return;
      if (settleRank === SLOT_CONFIG.length - 1) notifySuccess();
      else impactLight();
    }, duration + 16);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(hapticTimer);
      cancelAnimation(offset);
    };
    // Candidate values are sampled only when a new roll changes the token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, value, reduceMotion, settleRank, animate]);

  const reelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return (
    <View style={[styles.reelColumn, widthStyle]} accessible={false}>
      <Text style={[styles.reelLabel, { color: muted }]}>{label}</Text>
      <View style={[styles.reelWindow, { backgroundColor: surface }]}>
        <Animated.View style={reelStyle}>
          {sequence.map((item, itemIndex) => (
            <View key={`${itemIndex}-${item}`} style={styles.reelItem}>
              <Text
                style={[styles.reelValue, { color: foreground }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.65}
              >
                {item || EMPTY_SLOT}
              </Text>
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

export function TrickReveal({ trick, token, candidates, hapticsEnabled }: Props) {
  const reduceMotion = useReducedMotion();
  const resultOpacity = useSharedValue(0);
  const previousToken = useRef<number | null>(null);

  const targetSlots = trick
    ? toSlotValues(trick)
    : { stance: "", rotation: "", trick: "", direction: "" };
  const candidateSlots = candidates.map(toSlotValues);
  const stopOrder = useMemo(shuffledSlotOrder, [token]);

  useEffect(() => {
    const rolled = previousToken.current === null || previousToken.current !== token;
    previousToken.current = token;

    if (!trick) {
      resultOpacity.value = 0;
      return;
    }

    if (!rolled || reduceMotion) {
      resultOpacity.value = 1;
      return;
    }

    resultOpacity.value = 0;
    const timer = setTimeout(() => {
      resultOpacity.value = withTiming(1, {
        duration: RESULT_FADE_MS,
        easing: Easing.out(Easing.cubic),
      });
    }, RESULT_DELAY_MS);

    return () => clearTimeout(timer);
    // Rolls drive the reveal; filter re-picks update immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, trick?.id, reduceMotion]);

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  return (
    <View style={styles.wrap}>
      {trick ? (
        <Animated.View style={[styles.result, resultStyle]}>
          <>
            <Text style={styles.resultEyebrow}>YOU'RE UP</Text>
            <Text
              style={styles.resultName}
              accessibilityLiveRegion="polite"
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {trick.name}
            </Text>
            <View style={styles.tierSticker}>
              <Text style={styles.tier}>{TIER_LABEL[tierOf(trick.difficulty)]}</Text>
            </View>
          </>
        </Animated.View>
      ) : (
        <View style={styles.result}>
          <Text style={styles.promptKicker}>READY WHEN YOU ARE</Text>
          <Text style={styles.prompt}>Tap the button.{"\n"}Take the set.</Text>
        </View>
      )}

      <View style={styles.reels} accessibilityLabel={trick?.name}>
        {SLOT_CONFIG.map((slot, index) => {
          const options = [...new Set(candidateSlots.map((candidate) => candidate[slot.key]))];
          return (
            <SlotReel
              key={slot.key}
              label={slot.label}
              value={targetSlots[slot.key]}
              options={options}
              settleRank={stopOrder.indexOf(index)}
              token={token}
              hapticsEnabled={hapticsEnabled && !reduceMotion}
              foreground="#17212B"
              muted="#F6C84C"
              surface="#FFF7DF"
              widthStyle={slot.widthStyle}
              animate={trick !== null}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    maxWidth: 360,
    alignItems: "center",
    pointerEvents: "none",
  },
  reels: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingHorizontal: 2,
  },
  reelColumn: {
    gap: 6,
  },
  reelLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  reelWindow: {
    height: REEL_HEIGHT,
    overflow: "hidden",
    borderRadius: 10,
    boxShadow: "inset 0 0 0 1px rgba(23, 33, 43, 0.12), 0 3px 0 rgba(0, 0, 0, 0.28)",
  },
  reelItem: {
    height: REEL_HEIGHT,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  reelValue: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 18,
    letterSpacing: 0.1,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  result: {
    minHeight: 148,
    width: "100%",
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  resultEyebrow: {
    marginBottom: 4,
    color: "#F6C84C",
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 2.1,
  },
  resultName: {
    maxWidth: 320,
    color: "#FFF7DF",
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 39,
    lineHeight: 40,
    letterSpacing: -0.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
  tierSticker: {
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 4,
    backgroundColor: "#F15B45",
    transform: [{ rotate: "-2deg" }],
  },
  tier: {
    color: "#FFF7DF",
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  promptKicker: {
    marginBottom: 8,
    color: "#F6C84C",
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 2,
  },
  prompt: {
    color: "#FFF7DF",
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 36,
    lineHeight: 36,
    letterSpacing: 0.2,
    textAlign: "center",
    textTransform: "uppercase",
  },
});
