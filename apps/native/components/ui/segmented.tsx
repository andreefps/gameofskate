import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View, type LayoutChangeEvent, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from "react-native-reanimated";

import { PressableScale } from "@/components/ui/pressable-scale";
import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "md" | "sm";
  style?: ViewStyle;
};

const PAD = 3;

export function Segmented<T extends string>({ options, value, onChange, size = "md", style }: Props<T>) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width > 0 ? (width - PAD * 2) / options.length : 0;
  const x = useSharedValue(0);
  const placed = useRef(false);

  // First measurement snaps; later changes (including external ones) spring.
  useEffect(() => {
    if (segment <= 0) return;
    const target = index * segment;
    if (!placed.current || reduceMotion) {
      x.value = target;
      placed.current = true;
    } else {
      x.value = withSpring(target, { stiffness: 600, damping: 42, mass: 0.7 });
    }
  }, [index, segment, reduceMotion, x]);

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      accessibilityRole="radiogroup"
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        { height: size === "sm" ? 36 : 40, backgroundColor: colors.surfaceAlt },
        style,
      ]}
    >
      {segment > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            { width: segment, backgroundColor: colors.raised },
            { shadowColor: colors.ink },
            styles.thumbShadow,
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((o) => (
        <PressableScale
          key={o.value}
          noScale
          accessibilityRole="radio"
          accessibilityState={{ selected: o.value === value }}
          accessibilityLabel={o.label}
          onPress={() => onChange(o.value)}
          style={styles.item}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.label,
              { color: o.value === value ? colors.ink : colors.inkMuted },
            ]}
          >
            {o.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", borderRadius: radius.sm, padding: PAD },
  thumb: {
    position: "absolute",
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.sm - 3,
  },
  thumbShadow: {
    shadowOpacity: 0.14,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  item: { flex: 1, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: fonts.bodySemi, fontSize: 14 },
});
