import type { ComponentProps } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type PressableProps = ComponentProps<typeof Pressable>;

type Props = Omit<PressableProps, "onPressIn" | "onPressOut" | "style"> & {
  /** Disables scale feedback when movement would compete with the interaction. */
  static?: boolean;
  style?: StyleProp<ViewStyle>;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
};

/** Native, interruptible press feedback shared by the app's compact controls. */
export function ScalePressable({
  static: isStatic = false,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: Props) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const setPressed = (pressed: boolean) => {
    const shouldScale = pressed && !disabled && !isStatic && !reduceMotion;
    scale.value = withTiming(shouldScale ? 0.96 : 1, {
      duration: pressed ? 90 : 150,
      easing: Easing.out(Easing.cubic),
    });
  };

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    />
  );
}
