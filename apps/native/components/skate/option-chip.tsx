import { useThemeColor } from "heroui-native";
import { StyleSheet, Text } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Monochrome selectable chip used for stance / base / tier / mode toggles. */
export function OptionChip({ label, selected, onPress }: Props) {
  const [foreground, surface] = useThemeColor(["foreground", "surface-secondary"]);

  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? "#F15B45" : surface,
          boxShadow: selected
            ? "2px 3px 0 rgba(23, 33, 43, 0.78)"
            : "inset 0 0 0 1px rgba(23, 33, 43, 0.08)",
        },
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, { color: selected ? "#FFF7DF" : foreground }]}>{label}</Text>
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
