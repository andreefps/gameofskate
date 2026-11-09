import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Container } from "@/components/container";
import { fonts, radius } from "@/theme/tokens";
import { useTheme } from "@/theme/theme-provider";

export default function NotFoundScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <Container>
        <View style={styles.center}>
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.title, { color: colors.ink }]}>Page Not Found</Text>
            <Text style={[styles.body, { color: colors.inkMuted }]}>
              The page you're looking for doesn't exist.
            </Text>
            <Link href="/" style={[styles.button, { backgroundColor: colors.accent, color: colors.accentInk }]}>
              Go Home
            </Link>
          </View>
        </View>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  card: { alignItems: "center", padding: 24, maxWidth: 384, borderRadius: radius.md, gap: 8 },
  title: { fontFamily: fonts.bodySemi, fontSize: 18 },
  body: { fontFamily: fonts.body, fontSize: 14, textAlign: "center" },
  button: {
    marginTop: 8,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    fontFamily: fonts.bodySemi,
    fontSize: 14,
  },
});
