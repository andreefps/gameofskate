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
import { tierOf, tierRank } from "@/lib/skate/tier";
import type { Tier, Trick } from "@/lib/skate/types";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const TIER_LABEL: Record<Tier, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY = 700;
const MAX_TILT_DEG = 6;
const ENTER_OFFSET = 60;
const FLY_MS = 180;
const SPRING = { damping: 20, stiffness: 220, mass: 0.8 };

const EMPTY_WORDS = ["SWIPE", "TO", "CALL"];

type Props = {
  trick: Trick | null;
  poolSize: number;
  rollToken: number;
  /** False to render the trick without the reveal (resume). */
  animate?: boolean;
  maxSize: number;
  hapticsEnabled: boolean;
  onRoll: () => void;
  /** Previous trick (swipe right / a11y action). */
  onBack?: () => void;
  canBack?: boolean;
  /** Direction of the last change: 1 enters from the right, -1 from the left. */
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
  const tx = useSharedValue(0);
  const fade = useSharedValue(1);
  const crossed = useSharedValue(false);
  // Gesture callbacks are worklets that may outlive this render, so everything they
  // read goes through shared values / a ref instead of closure captures.
  const widthSV = useSharedValue(1);
  const canRightSV = useSharedValue(false);
  const latest = useRef({ onRoll, onBack, onSwipe, canBack, hapticsEnabled });
  useLayoutEffect(() => {
    latest.current = { onRoll, onBack, onSwipe, canBack, hapticsEnabled };
    widthSV.value = size.width || 1;
    // Right swipe goes back; with no previous trick it rubber-bands, except from the
    // empty state where either direction calls the first trick.
    canRightSV.value = canBack || !trick;
  });

  // Every roll/back plays the enter animation from the side it came from.
  // Layout effect so the new trick never paints at rest first.
  const lastToken = useRef(rollToken);
  useLayoutEffect(() => {
    if (lastToken.current === rollToken) return;
    lastToken.current = rollToken;
    if (!interactive || reduceMotion || !animate) {
      tx.value = 0;
      fade.value = 1;
      return;
    }
    tx.value = direction * ENTER_OFFSET;
    fade.value = 0;
    tx.value = withSpring(0, SPRING);
    fade.value = withTiming(1, { duration: 220 });
  }, [rollToken, direction, interactive, reduceMotion, animate, tx, fade]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateX: tx.value }, { rotate: `${(tx.value / widthSV.value) * MAX_TILT_DEG}deg` }],
  }));

  const commitSwipe = (dir: 1 | -1) => {
    const h = latest.current;
    h.onSwipe?.();
    if (dir === -1 && h.canBack && h.onBack) h.onBack();
    else h.onRoll();
  };
  const tapRoll = () => latest.current.onRoll();
  const tick = () => {
    if (latest.current.hapticsEnabled) selectionTick();
  };

  // Reduced motion: no drag at all, tap only.
  const pan = Gesture.Pan()
    .enabled(interactive && !reduceMotion)
    .activeOffsetX([-10, 10])
    .failOffsetY([-24, 24])
    .onBegin(() => {
      crossed.value = false;
    })
    .onUpdate((e) => {
      const stageWidth = widthSV.value;
      const canGoRight = canRightSV.value;
      const threshold = stageWidth * SWIPE_DISTANCE_RATIO;
      const dx = e.translationX;
      const x = dx > 0 && !canGoRight ? dx * 0.25 : dx;
      tx.value = x;
      fade.value = 1 - Math.min(Math.abs(x) / stageWidth, 1) * 0.4;
      const past = Math.abs(dx) > threshold && (dx < 0 || canGoRight);
      if (past !== crossed.value) {
        crossed.value = past;
        scheduleOnRN(tick);
      }
    })
    .onEnd((e) => {
      const stageWidth = widthSV.value;
      const canGoRight = canRightSV.value;
      const threshold = stageWidth * SWIPE_DISTANCE_RATIO;
      const dx = e.translationX;
      const vx = e.velocityX;
      const left = dx < -threshold || vx < -SWIPE_VELOCITY;
      const right = dx > threshold || vx > SWIPE_VELOCITY;
      if (left || (right && canGoRight)) {
        const dir = left ? 1 : -1;
        tx.value = withTiming(-dir * stageWidth, { duration: FLY_MS }, (finished) => {
          if (finished) scheduleOnRN(commitSwipe, dir);
        });
        fade.value = withTiming(0, { duration: FLY_MS });
      } else {
        tx.value = withSpring(0, SPRING);
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
              ? `${trick.name}. Swipe or double tap for next trick`
              : "Swipe to call a trick"
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
            <RevealFade wordCount={words.length} animate={!!trick && animate}>
              <DifficultyMeta rank={rank} label={metaLabel} lead={turnLine} />
            </RevealFade>
            <TrickName
              words={words}
              fontSize={fontSize}
              lineHeight={lineHeight}
              color={trick ? colors.ink : colors.ghost}
              animate={!!trick && animate}
              haptics={hapticsEnabled && interactive}
            />
            <View style={styles.aliasSlot}>
              {trick?.alias ? (
                <RevealFade wordCount={words.length} animate={animate}>
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
