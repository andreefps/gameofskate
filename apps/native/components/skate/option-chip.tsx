import { StyleSheet, Text } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";
import { useTheme } from "@/theme/theme-provider";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Monochrome selectable chip used for stance / base / tier / mode toggles. */
export function OptionChip({ label, selected, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.accent : colors.surfaceAlt,
          boxShadow: selected
            ? `2px 3px 0 ${colors.ink}`
            : `inset 0 0 0 1px ${colors.line}`,
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: selected ? colors.accentInk : colors.ink }]}>{label}</Text>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  label: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
  },
});
