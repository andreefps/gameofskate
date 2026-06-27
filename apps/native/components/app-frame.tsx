import { useThemeColor } from "heroui-native";
import type { ReactNode } from "react";
import { Platform, StyleSheet, View } from "react-native";

const MAX_WIDTH = 440;

/**
 * On web, constrains the app to a centered phone-width column over a muted
 * backdrop so the desktop experience mirrors the mobile app. On native (and
 * narrow mobile web), it renders children untouched (full-width).
 */
export function AppFrame({ children }: { children: ReactNode }) {
  const [backdrop, background] = useThemeColor(["background-secondary", "background"]);

  if (Platform.OS !== "web") return <>{children}</>;

  return (
    <View style={[styles.outer, { backgroundColor: backdrop }]}>
      <View style={[styles.inner, { backgroundColor: background }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: "center",
  },
  inner: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_WIDTH,
  },
});
