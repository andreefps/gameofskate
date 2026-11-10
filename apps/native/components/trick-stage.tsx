import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { RevealFade, TrickName } from "@/components/trick-name";
import { Button } from "@/components/ui/button";
import { selectionTick } from "@/lib/haptics";
import { fitHero } from "@/lib/ui/fit-hero";
import { reelPlan, SPIN_DEFAULT_STRENGTH, spinStrength } from "@/lib/ui/reel";
import { DOMAINS } from "@/lib/skate/domains";
import { slotVocab, trickSlots } from "@/lib/skate/slots";
import { tierOf, tierRank } from "@/lib/skate/tier";
import type { Tier, Trick } from "@/lib/skate/types";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const TIER_LABEL: Record<Tier, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 500;
const DRAG_RESISTANCE = 0.6;
const RUBBER_BAND = 0.25;
const FLY_DISTANCE = 120;
const FLY_MS = 150;
const SPRING = { damping: 20, stiffness: 220, mass: 0.8 };

const EMPTY_WORDS = ["SWIPE", "UP", "TO SPIN"];

type Props = {
  trick: Trick | null;
  poolSize: number;
  rollToken: number;
  /** False to render the trick without the reveal (resume). */
  animate?: boolean;
  maxSize: number;
  hapticsEnabled: boolean;
  onRoll: () => void;
  /** Previous trick (swipe down / a11y action). */
  onBack?: () => void;
  canBack?: boolean;
  /** Direction of the last change: 1 = roll (spins), -1 = back (plain reveal). */
  direction?: 1 | -1;
  /** Fired when a drag commits a trick change. */
  onSwipe?: () => void;
  onOpenSettings: () => void;
  /** Game mode: tapping does nothing and the difficulty label is replaced by this turn line. */
  interactive?: boolean;
  turnLine?: ReactNode;
};

function DifficultyMeta({ rank, label, lead }: { rank: number; label: string; lead?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.meta}>
      {lead}
      {rank > 0 ? (
        <View style={styles.dots}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[styles.dot, { backgroundColor: n <= rank ? colors.accent : colors.line }]}
            />
          ))}
        </View>
      ) : null}
      {lead ? null : <Text style={[styles.metaLabel, { color: colors.inkMuted }]}>{label}</Text>}
    </View>
  );
}

export function TrickStage({
  trick,
  poolSize,
  rollToken,
  animate = true,
  maxSize,
  hapticsEnabled,
  onRoll,
  onBack,
  canBack = false,
  direction = 1,
  onSwipe,
  onOpenSettings,
  interactive = true,
  turnLine,
}: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const reduceMotion = useReducedMotion();
  const ty = useSharedValue(0);
  const fade = useSharedValue(1);
  const crossed = useSharedValue(false);
  // Flick strength for the roll about to land, tagged with the token it is for so
  // rolls that bypass the stage (hotkeys, a11y action) fall back to the default.
  const [pending, setPending] = useState({ token: -1, strength: SPIN_DEFAULT_STRENGTH });
  // Gesture callbacks are worklets that may outlive this render, so everything they
  // read goes through shared values / a ref instead of closure captures.
  const canDownSV = useSharedValue(false);
  const latest = useRef({ onRoll, onBack, onSwipe, canBack, hapticsEnabled, rollToken });
  useLayoutEffect(() => {
    latest.current = { onRoll, onBack, onSwipe, canBack, hapticsEnabled, rollToken };
    // Down goes back; with no previous trick it rubber-bands, except from the
    // empty state where either direction calls the first trick.
    canDownSV.value = canBack || !trick;
  });

  // Reset the drag offset whenever a new trick lands. Layout effect so it never paints at rest first.
  const lastToken = useRef(rollToken);
  useLayoutEffect(() => {
    if (lastToken.current === rollToken) return;
    lastToken.current = rollToken;
    ty.value = 0;
    fade.value = 1;
  }, [rollToken, ty, fade]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: ty.value }],
  }));

  // Runs on the JS thread (via scheduleOnRN); plain JS helpers like spinStrength
  // must not be called from the gesture worklets themselves.
  const commitSwipe = (dir: 1 | -1, velocityY: number) => {
    const h = latest.current;
    h.onSwipe?.();
    if (dir === -1 && h.canBack && h.onBack) {
      h.onBack();
    } else {
      setPending({ token: h.rollToken + 1, strength: spinStrength(velocityY) });
      h.onRoll();
    }
  };
  const tapRoll = () => commitSwipe(1, 0);
  const tick = () => {
    if (latest.current.hapticsEnabled) selectionTick();
  };

  // Reduced motion: no drag at all, tap only.
  const pan = Gesture.Pan()
    .enabled(interactive && !reduceMotion)
    .activeOffsetY([-10, 10])
    .failOffsetX([-24, 24])
    .onBegin(() => {
      crossed.value = false;
    })
    .onUpdate((e) => {
      const canDown = canDownSV.value;
      const dy = e.translationY;
      const y = dy > 0 && !canDown ? dy * RUBBER_BAND : dy * DRAG_RESISTANCE;
      ty.value = y;
      fade.value = 1 - Math.min(Math.abs(y) / 200, 1) * 0.4;
      const past = dy < -SWIPE_DISTANCE || (dy > SWIPE_DISTANCE && canDown);
      if (past !== crossed.value) {
        crossed.value = past;
        scheduleOnRN(tick);
      }
    })
    .onEnd((e) => {
      const canDown = canDownSV.value;
      const dy = e.translationY;
      const vy = e.velocityY;
      const up = dy < -SWIPE_DISTANCE || vy < -SWIPE_VELOCITY;
      const down = dy > SWIPE_DISTANCE || vy > SWIPE_VELOCITY;
      if (up || (down && canDown)) {
        const dir = up ? 1 : -1;
        ty.value = withTiming(-dir * FLY_DISTANCE, { duration: FLY_MS }, (finished) => {
          if (finished) scheduleOnRN(commitSwipe, dir, up ? vy : 0);
        });
        fade.value = withTiming(0, { duration: FLY_MS });
      } else {
        ty.value = withSpring(0, SPRING);
        fade.value = withTiming(1, { duration: 150 });
      }
    });

  const tap = Gesture.Tap()
    .enabled(interactive)
    .maxDistance(10)
    .onEnd((_e, success) => {
      if (success) scheduleOnRN(tapRoll);
    });

  // Exclusive: the tap only fires once the pan has failed, so a drag never also taps.
  const gesture = Gesture.Exclusive(pan, tap);

  const name = trick?.name ?? "";
  useEffect(() => {
    // iOS has no polite live region; announce explicitly. Web/Android use the live region below.
    if (Platform.OS === "ios" && name) AccessibilityInfo.announceForAccessibility(name);
  }, [name, rollToken]);

  if (poolSize === 0) {
    return (
      <View style={styles.stage} onLayout={onLayout}>
        <Text style={[styles.emptyTitle, { color: colors.ink }]}>NO TRICKS</Text>
        <Text style={[styles.emptyBody, { color: colors.inkMuted }]}>Your filters rule out every trick.</Text>
        <Button label="Open settings" variant="secondary" onPress={onOpenSettings} style={styles.emptyButton} />
      </View>
    );
  }

  const words = trick ? trick.name.toUpperCase().split(" ") : EMPTY_WORDS;
  const { fontSize, lineHeight } = fitHero(words, size.width, size.height, maxSize);
  const ready = size.width > 0;
  const spinning = interactive && !reduceMotion && animate && !!trick && direction === 1;
  const strength = pending.token === rollToken ? pending.strength : SPIN_DEFAULT_STRENGTH;
  const slots = spinning && trick ? trickSlots(trick, DOMAINS[trick.domain]) : [];
  const spinTotal = spinning ? reelPlan(slots.length, strength).total : undefined;
  const rank = trick ? tierRank(tierOf(trick.difficulty)) : 0;
  const metaLabel = trick ? TIER_LABEL[tierOf(trick.difficulty)] : `${poolSize} TRICKS IN THE BAG`;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.stage}
        accessible={interactive}
        accessibilityRole={interactive ? "button" : undefined}
        accessibilityLabel={
          interactive
            ? trick
              ? `${trick.name}. Swipe up or double tap for a new trick`
              : "Swipe up to call a trick"
            : trick?.name
        }
        accessibilityActions={
          interactive
            ? [{ name: "activate" }, ...(canBack ? [{ name: "previous", label: "Previous trick" }] : [])]
            : undefined
        }
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "activate") onRoll();
          else if (e.nativeEvent.actionName === "previous") onBack?.();
        }}
      >
      <Animated.View style={[styles.inner, contentStyle]} onLayout={onLayout}>
        {ready ? (
          <View key={trick ? `t${rollToken}` : "empty"}>
            <RevealFade wordCount={words.length} animate={!!trick && animate} delay={spinTotal}>
              <DifficultyMeta rank={rank} label={metaLabel} lead={turnLine} />
            </RevealFade>
            <TrickName
              words={words}
              fontSize={fontSize}
              lineHeight={lineHeight}
              color={trick ? colors.ink : colors.ghost}
              animate={!!trick && animate}
              haptics={hapticsEnabled && interactive}
              spin={
                spinning && trick
                  ? { strength, slots, vocab: slotVocab(DOMAINS[trick.domain]), maxWidth: size.width }
                  : undefined
              }
            />
            <View style={styles.aliasSlot}>
              {trick?.alias ? (
                <RevealFade wordCount={words.length} animate={animate} delay={spinTotal}>
                  <Text style={[styles.alias, { color: colors.inkMuted }]}>aka {trick.alias}</Text>
                </RevealFade>
              ) : null}
            </View>
          </View>
        ) : null}
      </Animated.View>
      <View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={styles.srOnly}
        importantForAccessibility="yes"
      >
        <Text>{trick ? trick.name : ""}</Text>
      </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, justifyContent: "center", userSelect: "none" },
  inner: { flex: 1, justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, height: 16 },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaLabel: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5 },
  aliasSlot: { minHeight: 24, marginTop: 12 },
  alias: { fontFamily: fonts.bodySemi, fontSize: 16 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
  emptyTitle: { fontFamily: fonts.display, fontSize: 72, lineHeight: 68, letterSpacing: 0.5 },
  emptyBody: { fontFamily: fonts.bodySemi, fontSize: 16, marginTop: 12 },
  emptyButton: { alignSelf: "flex-start", marginTop: 24 },
});
