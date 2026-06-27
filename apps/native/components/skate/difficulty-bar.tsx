import { useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

import { selectionTick } from "@/lib/haptics";

const THUMB = 26;
const TRACK_H = 6;
const HIT_H = 40;
// Magnetic snap: quick, no overshoot/jiggle.
const SNAP = { duration: 150, easing: Easing.out(Easing.cubic) };

type Props = {
  labels: string[];
  /** Selected stop index (0..labels.length-1); fill runs from the left up to it. */
  value: number;
  onChange: (index: number) => void;
  hapticsEnabled: boolean;
};

/**
 * A draggable difficulty bar: a fill from the left to a thumb that snaps to N
 * evenly-spaced breakpoints. Cumulative — the thumb marks the highest enabled
 * tier; everything to its left is included.
 */
export function DifficultyBar({ labels, value, onChange, hapticsEnabled }: Props) {
  const n = labels.length;
  const [width, setWidth] = useState(0);
  const usable = Math.max(0, width - THUMB); // travel range for the thumb's left edge

  const x = useSharedValue(0);
  const startX = useSharedValue(0);
  const lastIndex = useSharedValue(value);
  const draggingRef = useRef(false);

  const [foreground, accent, surface, muted, background] = useThemeColor([
    "foreground",
    "accent",
    "surface-secondary",
    "muted",
    "background",
  ]);

  const indexToX = (i: number) => (n > 1 ? (usable * i) / (n - 1) : 0);

  // Keep the thumb in sync with the value prop while not dragging.
  useEffect(() => {
    if (draggingRef.current) return;
    x.value = withTiming(indexToX(value), SNAP);
    lastIndex.value = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, usable]);

  const setDragging = (v: boolean) => {
    draggingRef.current = v;
  };

  const commit = (index: number) => {
    if (hapticsEnabled) selectionTick();
    onChange(index);
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-8, 8])
    .onStart(() => {
      runOnJS(setDragging)(true);
      startX.value = x.value;
    })
    .onUpdate((e) => {
      const nx = Math.min(Math.max(startX.value + e.translationX, 0), usable);
      x.value = nx;
      if (usable > 0) {
        const idx = Math.round((nx / usable) * (n - 1));
        if (idx !== lastIndex.value) {
          lastIndex.value = idx;
          runOnJS(commit)(idx);
        }
      }
    })
    .onEnd(() => {
      const target = n > 1 ? (usable * lastIndex.value) / (n - 1) : 0;
      x.value = withTiming(target, SNAP);
      runOnJS(setDragging)(false);
    });

  const tap = Gesture.Tap().onEnd((e) => {
    if (usable <= 0) return;
    const nx = Math.min(Math.max(e.x - THUMB / 2, 0), usable);
    const idx = Math.round((nx / usable) * (n - 1));
    lastIndex.value = idx;
    x.value = withTiming(n > 1 ? (usable * idx) / (n - 1) : 0, SNAP);
    runOnJS(commit)(idx);
  });

  const gesture = Gesture.Race(pan, tap);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + THUMB / 2 }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <View style={styles.hit} onLayout={onLayout}>
          <View style={[styles.track, { backgroundColor: surface }]} />
          <Animated.View style={[styles.fill, fillStyle, { backgroundColor: accent }]} />
          {labels.map((label, i) => (
            <View
              key={label}
              style={[
                styles.tick,
                { left: THUMB / 2 + indexToX(i) - 3, backgroundColor: i <= value ? background : muted },
              ]}
            />
          ))}
          <Animated.View
            style={[styles.thumb, thumbStyle, { backgroundColor: foreground, borderColor: background }]}
          />
        </View>
      </GestureDetector>

      <View style={styles.labels}>
        {labels.map((label, i) => (
          <Text
            key={label}
            numberOfLines={1}
            style={[
              styles.label,
              {
                color: i <= value ? foreground : muted,
                textAlign: i === 0 ? "left" : i === n - 1 ? "right" : "center",
              },
            ]}
          >
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {
    height: HIT_H,
    justifyContent: "center",
  },
  track: {
    position: "absolute",
    left: 0,
    right: 0,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    alignSelf: "center",
    top: (HIT_H - TRACK_H) / 2,
  },
  fill: {
    position: "absolute",
    left: 0,
    height: TRACK_H,
    borderRadius: TRACK_H / 2,
    top: (HIT_H - TRACK_H) / 2,
  },
  tick: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    top: (HIT_H - 6) / 2,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    top: (HIT_H - THUMB) / 2,
    left: 0,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
  },
});
