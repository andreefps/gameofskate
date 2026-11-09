import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, type ReactNode } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScalePressable } from "@/components/scale-pressable";
import { DifficultyBar } from "@/components/skate/difficulty-bar";
import { OptionChip } from "@/components/skate/option-chip";
import { TIER_LABEL } from "@/components/skate/tier-label";
import { ThemeToggle } from "@/components/theme-toggle";
import { DOMAINS, DOMAIN_LIST } from "@/lib/skate/domains";
import { TIERS } from "@/lib/skate/tier";
import { useTheme } from "@/theme/theme-provider";
import { useSettings } from "@/stores/settings";

const SNAP_POINTS = ["90%"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  const foreground = colors.ink;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View style={[styles.sectionMarker, { backgroundColor: colors.accent }]} />
        <Text style={[styles.sectionTitle, { color: foreground }]}>{title}</Text>
      </View>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export const SettingsSheet = forwardRef<BottomSheetModal>(function SettingsSheet(_props, ref) {
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();

  const { colors } = useTheme();
  const background = colors.surface;
  const foreground = colors.ink;
  const muted = colors.inkMuted;
  const surface = colors.surfaceAlt;
  const accent = colors.accent;

  const domainId = settings.activeDomain;
  const domain = DOMAINS[domainId];
  const ds = settings.domains[domainId];

  // Bar position follows the selected difficulty level.
  const difficultyValue = Math.max(0, TIERS.indexOf(ds.difficulty));

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" />
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={[styles.sheet, { backgroundColor: background }]}
      handleIndicatorStyle={{ backgroundColor: foreground, width: 44, opacity: 0.35 }}
    >
      <BottomSheetScrollView
        contentContainerStyle={StyleSheet.flatten([
          styles.content,
          Platform.OS === "web" && styles.contentWeb,
          { paddingBottom: insets.bottom + 28 },
        ])}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.headingKicker, { backgroundColor: colors.accent, color: colors.accentInk }]}>BUILD YOUR LINE</Text>
          <Text style={[styles.heading, { color: foreground }]}>Tune the session</Text>
          <Text style={[styles.headingBody, { color: muted }]}>Pick the spot, difficulty, and trick bag.</Text>
        </View>

        <Section title="Mode">
          {DOMAIN_LIST.map((d) => (
            <OptionChip
              key={d.id}
              label={d.label}
              selected={d.id === domainId}
              onPress={() => dispatch({ type: "setActiveDomain", domain: d.id })}
            />
          ))}
        </Section>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={[styles.sectionMarker, { backgroundColor: colors.accent }]} />
            <Text style={[styles.sectionTitle, { color: foreground }]}>Difficulty</Text>
          </View>
          <DifficultyBar
            labels={TIERS.map((t) => TIER_LABEL[t])}
            value={difficultyValue}
            onChange={(index) => {
              const tier = TIERS[index];
              if (tier) dispatch({ type: "setDifficulty", domain: domainId, tier });
            }}
            hapticsEnabled={settings.hapticsEnabled}
          />
        </View>

        <Section title="Stances">
          {domain.stances.map((stance) => (
            <OptionChip
              key={stance}
              label={stance === "regular" ? "Regular" : stance[0]!.toUpperCase() + stance.slice(1)}
              selected={ds.enabledStances.includes(stance)}
              onPress={() => dispatch({ type: "toggleStance", domain: domainId, stance })}
            />
          ))}
        </Section>

        <Section title={`${domain.label} tricks`}>
          {domain.bases.map((base) => (
            <OptionChip
              key={base.id}
              label={base.name}
              selected={ds.enabledBases.includes(base.id)}
              onPress={() => dispatch({ type: "toggleBase", domain: domainId, base: base.id })}
            />
          ))}
        </Section>

        <ScalePressable
          static
          style={[styles.row, { borderTopColor: surface }]}
          onPress={() => dispatch({ type: "toggleHaptics" })}
          accessibilityRole="switch"
          accessibilityState={{ checked: settings.hapticsEnabled }}
          accessibilityLabel="Haptics"
        >
          <Text style={[styles.rowLabel, { color: foreground }]}>Haptics</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={() => dispatch({ type: "toggleHaptics" })}
            trackColor={{ true: accent, false: surface }}
            thumbColor={colors.accentInk}
            style={styles.nonInteractive}
            accessible={false}
          />
        </ScalePressable>

        <View style={[styles.row, { borderTopColor: surface }]}>
          <Text style={[styles.rowLabel, { color: foreground }]}>Theme</Text>
          <ThemeToggle hapticsEnabled={settings.hapticsEnabled} />
        </View>

        <ScalePressable
          onPress={() => dispatch({ type: "reset" })}
          style={[styles.reset, { backgroundColor: colors.ink }]}
          accessibilityRole="button"
        >
          <Text style={[styles.resetLabel, { color: colors.bg }]}>Reset the setup</Text>
        </ScalePressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  contentWeb: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
  },
  titleBlock: {
    marginBottom: 28,
  },
  headingKicker: {
    alignSelf: "flex-start",
    marginBottom: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 1.7,
    transform: [{ rotate: "-2deg" }],
  },
  heading: {
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 38,
    lineHeight: 40,
    textTransform: "uppercase",
  },
  headingBody: {
    marginTop: 2,
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
  },
  section: {
    marginBottom: 27,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 13,
  },
  sectionMarker: {
    width: 15,
    height: 5,
    transform: [{ rotate: "-9deg" }],
  },
  sectionTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 56,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
  },
  reset: {
    marginTop: 18,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resetLabel: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
  },
  nonInteractive: {
    pointerEvents: "none",
  },
});
