import { useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { RevealFade, TrickName } from "@/components/trick-name";
import { Button } from "@/components/ui/button";
import { PressableScale } from "@/components/ui/pressable-scale";
import { fitHero } from "@/lib/ui/fit-hero";
import { tierOf, tierRank } from "@/lib/skate/tier";
import type { Tier, Trick } from "@/lib/skate/types";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const TIER_LABEL: Record<Tier, string> = {
  beginner: "BEGINNER",
  intermediate: "INTERMEDIATE",
  advanced: "ADVANCED",
};

const EMPTY_WORDS = ["TAP", "TO", "CALL"];

type Props = {
  trick: Trick | null;
  poolSize: number;
  rollToken: number;
  maxSize: number;
  hapticsEnabled: boolean;
  onRoll: () => void;
  onOpenSettings: () => void;
  /** Game mode: tapping does nothing and the difficulty label is replaced by this turn line. */
  interactive?: boolean;
  turnLine?: ReactNode;
};

function DifficultyMeta({ rank, label, lead }: { rank: number; label: string; lead?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.meta}>
      {lead}
      {rank > 0 ? (
        <View style={styles.dots}>
          {[1, 2, 3].map((n) => (
            <View
              key={n}
              style={[styles.dot, { backgroundColor: n <= rank ? colors.accent : colors.line }]}
            />
          ))}
        </View>
      ) : null}
      {lead ? null : <Text style={[styles.metaLabel, { color: colors.inkMuted }]}>{label}</Text>}
    </View>
  );
}

export function TrickStage({
  trick,
  poolSize,
  rollToken,
  maxSize,
  hapticsEnabled,
  onRoll,
  onOpenSettings,
  interactive = true,
  turnLine,
}: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
  };

  const name = trick?.name ?? "";
  useEffect(() => {
    // iOS has no polite live region; announce explicitly. Web/Android use the live region below.
    if (Platform.OS === "ios" && name) AccessibilityInfo.announceForAccessibility(name);
  }, [name, rollToken]);

  if (poolSize === 0) {
    return (
      <View style={styles.stage} onLayout={onLayout}>
        <Text style={[styles.emptyTitle, { color: colors.ink }]}>NO TRICKS</Text>
        <Text style={[styles.emptyBody, { color: colors.inkMuted }]}>Your filters rule out every trick.</Text>
        <Button label="Open settings" variant="secondary" onPress={onOpenSettings} style={styles.emptyButton} />
      </View>
    );
  }

  const words = trick ? trick.name.toUpperCase().split(" ") : EMPTY_WORDS;
  const { fontSize, lineHeight } = fitHero(words, size.width, size.height, maxSize);
  const ready = size.width > 0;
  const rank = trick ? tierRank(tierOf(trick.difficulty)) : 0;
  const metaLabel = trick ? TIER_LABEL[tierOf(trick.difficulty)] : `${poolSize} TRICKS IN THE BAG`;

  return (
    <PressableScale
      noScale
      onPress={onRoll}
      disabled={!interactive}
      accessible={interactive ? undefined : false}
      accessibilityRole={interactive ? "button" : undefined}
      accessibilityLabel={interactive ? "Call a trick" : undefined}
      style={styles.stage}
    >
      <View style={styles.inner} onLayout={onLayout}>
        {ready ? (
          <View key={trick ? `t${rollToken}` : "empty"}>
            <RevealFade wordCount={words.length} animate={!!trick}>
              <DifficultyMeta rank={rank} label={metaLabel} lead={turnLine} />
            </RevealFade>
            <TrickName
              words={words}
              fontSize={fontSize}
              lineHeight={lineHeight}
              color={trick ? colors.ink : colors.ghost}
              animate={!!trick}
              haptics={hapticsEnabled}
            />
            <View style={styles.aliasSlot}>
              {trick?.alias ? (
                <RevealFade wordCount={words.length}>
                  <Text style={[styles.alias, { color: colors.inkMuted }]}>aka {trick.alias}</Text>
                </RevealFade>
              ) : null}
            </View>
          </View>
        ) : null}
      </View>
      <View
        pointerEvents="none"
        accessibilityLiveRegion="polite"
        style={styles.srOnly}
        importantForAccessibility="yes"
      >
        <Text>{trick ? trick.name : ""}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, justifyContent: "center" },
  inner: { flex: 1, justifyContent: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, height: 16 },
  dots: { flexDirection: "row", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metaLabel: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5 },
  aliasSlot: { minHeight: 24, marginTop: 12 },
  alias: { fontFamily: fonts.bodySemi, fontSize: 16 },
  srOnly: { position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden" },
  emptyTitle: { fontFamily: fonts.display, fontSize: 72, lineHeight: 68, letterSpacing: 0.5 },
  emptyBody: { fontFamily: fonts.bodySemi, fontSize: 16, marginTop: 12 },
  emptyButton: { alignSelf: "flex-start", marginTop: 24 },
});
