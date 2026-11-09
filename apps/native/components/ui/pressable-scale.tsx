import { useState, type ComponentProps } from "react";
import {
  Platform,
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { impactLight } from "@/lib/haptics";
import { useSettings } from "@/stores/settings";
import { useTheme } from "@/theme/theme-provider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableProps = ComponentProps<typeof Pressable>;

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  /** Fire a light haptic tick on press (respects the haptics setting). */
  haptic?: boolean;
  /** Skip the scale effect. */
  noScale?: boolean;
};

const SPRING = { stiffness: 700, damping: 40, mass: 0.6 } as const;
const isWeb = Platform.OS === "web";

export function PressableScale({
  style,
  haptic = false,
  noScale = false,
  disabled,
  onPressIn,
  onPressOut,
  onFocus,
  onBlur,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const { colors } = useTheme();
  const { settings } = useSettings();
  const scale = useSharedValue(1);
  const [focusVisible, setFocusVisible] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const press = (pressed: boolean) => {
    const active = pressed && !disabled && !noScale && !reduceMotion;
    scale.value = withSpring(active ? 0.97 : 1, SPRING);
  };

  const webStyle = isWeb
    ? ({
        cursor: disabled ? "default" : "pointer",
        outlineStyle: focusVisible ? "solid" : "none",
        outlineWidth: 2,
        outlineOffset: 2,
        outlineColor: colors.accent,
      } as ViewStyle)
    : null;

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e: GestureResponderEvent) => {
        press(true);
        if (haptic && settings.hapticsEnabled && !disabled) impactLight();
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        press(false);
        onPressOut?.(e);
      }}
      onFocus={(e) => {
        if (isWeb) {
          const target = e.target as unknown as { matches?: (s: string) => boolean };
          setFocusVisible(target.matches?.(":focus-visible") ?? true);
        }
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocusVisible(false);
        onBlur?.(e);
      }}
      style={[style, webStyle, animatedStyle]}
    />
  );
}
