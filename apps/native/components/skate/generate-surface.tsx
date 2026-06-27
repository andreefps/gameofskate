import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet } from "react-native";

import { impactMedium } from "@/lib/haptics";

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
      style={[styles.surface, Platform.OS === "web" && styles.web]}
      hitSlop={28}
      onPress={() => {
        if (hapticsEnabled) impactMedium();
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
  web: {
    cursor: "pointer",
    userSelect: "none",
  },
});
