import { useThemeColor } from "heroui-native";
import { Pressable, StyleSheet, Text } from "react-native";

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
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? foreground : surface }]}
    >
      <Text style={[styles.label, { color: selected ? background : muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
