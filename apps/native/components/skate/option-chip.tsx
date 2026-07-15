import { useThemeColor } from "heroui-native";
import { StyleSheet, Text, View } from "react-native";

import { ScalePressable } from "@/components/scale-pressable";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Monochrome selectable chip used for stance / base / tier / mode toggles. */
export function OptionChip({ label, selected, onPress }: Props) {
  const [foreground, background, surface, muted] = useThemeColor([
    "foreground",
    "background",
    "surface-secondary",
    "muted",
  ]);

  return (
    <ScalePressable
      onPress={onPress}
      style={styles.hitTarget}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <View style={[styles.chip, { backgroundColor: selected ? foreground : surface }]}>
        <Text style={[styles.label, { color: selected ? background : muted }]}>{label}</Text>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  hitTarget: {
    minHeight: 44,
    justifyContent: "center",
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
