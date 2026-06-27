import * as Haptics from "expo-haptics";
import type { ReactNode } from "react";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  onRoll: () => void;
  hapticsEnabled: boolean;
  children: ReactNode;
};

/**
 * Centered, content-hugging tap target (the trick name) that rolls a new trick.
 * Intentionally NOT full-screen — keeps the rest of the screen non-interactive
 * to avoid accidental rolls. `hitSlop` extends the zone slightly past the name.
 */
export function GenerateSurface({ onRoll, hapticsEnabled, children }: Props) {
  return (
    <Pressable
      style={styles.surface}
      hitSlop={28}
      onPress={() => {
        if (hapticsEnabled) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        onRoll();
      }}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 28,
    borderRadius: 28,
  },
});
