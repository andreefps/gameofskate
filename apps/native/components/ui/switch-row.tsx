import { StyleSheet, Text, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withTiming,
} from "react-native-reanimated";

import { PressableScale } from "@/components/ui/pressable-scale";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

type Props = {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

const W = 50;
const H = 30;
const KNOB = 26;
const PAD = 2;

export function SwitchRow({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : 160;
  const progress = useDerivedValue(() => withTiming(value ? 1 : 0, { duration }), [value, duration]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [colors.line, colors.accent]),
  }));
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * (W - KNOB - PAD * 2) }],
  }));

  return (
    <PressableScale
      noScale
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={styles.row}
    >
      <Text style={[styles.label, { color: colors.ink }]}>{label}</Text>
      <View>
        <Animated.View style={[styles.track, trackStyle]}>
          <Animated.View
            style={[styles.knob, { backgroundColor: colors.surface, shadowColor: colors.ink }, knobStyle]}
          />
        </Animated.View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  label: { fontFamily: fonts.bodySemi, fontSize: 16 },
  track: { width: W, height: H, borderRadius: H / 2, padding: PAD, justifyContent: "center" },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
