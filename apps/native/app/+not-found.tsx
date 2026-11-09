import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <Text style={[styles.title, { color: colors.ink }]}>NOT FOUND</Text>
        <Text style={[styles.body, { color: colors.inkMuted }]}>This page doesn't exist.</Text>
        <Link href="/" style={[styles.button, { backgroundColor: colors.accent, color: colors.accentInk }]}>
          Go home
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", paddingHorizontal: 24, gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 72, lineHeight: 68 },
  body: { fontFamily: fonts.bodySemi, fontSize: 16 },
  button: {
    alignSelf: "flex-start",
    marginTop: 16,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: radius.sm,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});
