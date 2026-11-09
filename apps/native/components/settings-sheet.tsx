import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, type ReactNode } from "react";
import { Platform, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { SwitchRow } from "@/components/ui/switch-row";
import { impactLight } from "@/lib/haptics";
import { DOMAINS } from "@/lib/skate/domains";
import { presetFor } from "@/lib/skate/preset";
import { buildPool } from "@/lib/skate/select";
import { TIERS } from "@/lib/skate/tier";
import type { BaseTrick, Stance, Tier } from "@/lib/skate/types";
import { useSettings } from "@/stores/settings";
import { type ThemePreference, useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const SNAP_POINTS = ["90%"];

const TIER_LABEL: Record<Tier, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const TIER_OPTIONS = TIERS.map((t) => ({ value: t, label: TIER_LABEL[t] }));
const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const STANCE_LABEL: Record<Stance, string> = {
  regular: "Regular",
  fakie: "Fakie",
  switch: "Switch",
  nollie: "Nollie",
};

/** Same thresholds as preset.ts: <=3 beginner, <=5 intermediate, else advanced. */
function baseTier(base: BaseTrick): Tier {
  return base.base <= 3 ? "beginner" : base.base <= 5 ? "intermediate" : "advanced";
}

function baseLabel(base: BaseTrick): string {
  return base.dir === "required" ? `FS/BS ${base.name}` : base.name;
}

function sameSet<T>(a: T[], b: T[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.inkMuted }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

type Props = { onOpenChange?: (open: boolean) => void };

export const SettingsSheet = forwardRef<BottomSheetModal, Props>(function SettingsSheet({ onOpenChange }, ref) {
  const { settings, dispatch } = useSettings();
  const { colors, preference, setPreference } = useTheme();
  const insets = useSafeAreaInsets();

  const domainId = settings.activeDomain;
  const domain = DOMAINS[domainId];
  const ds = settings.domains[domainId];
  const poolCount = buildPool(domain, ds).length;

  const preset = presetFor(domain, ds.difficulty);
  const isCustom = !sameSet(preset.stances, ds.enabledStances) || !sameSet(preset.bases, ds.enabledBases);

  const stanceShake = useSharedValue(0);
  const baseShake = useSharedValue(0);
  const stanceStyle = useAnimatedStyle(() => ({ transform: [{ translateX: stanceShake.value }] }));
  const baseStyle = useAnimatedStyle(() => ({ transform: [{ translateX: baseShake.value }] }));

  const refuse = (value: typeof stanceShake) => {
    if (settings.hapticsEnabled) impactLight();
    value.value = withSequence(
      withTiming(-6, { duration: 40 }),
      withTiming(6, { duration: 70 }),
      withTiming(-4, { duration: 60 }),
      withTiming(0, { duration: 40 }),
    );
  };

  const toggleStance = (stance: Stance) => {
    if (ds.enabledStances.length === 1 && ds.enabledStances.includes(stance)) return refuse(stanceShake);
    dispatch({ type: "toggleStance", domain: domainId, stance });
  };
  const toggleBase = (id: string) => {
    if (ds.enabledBases.length === 1 && ds.enabledBases.includes(id)) return refuse(baseShake);
    dispatch({ type: "toggleBase", domain: domainId, base: id });
  };

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      opacity={1}
      style={[props.style, { backgroundColor: colors.backdrop }]}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      pressBehavior="close"
    />
  );

  const webSheet: ViewStyle | undefined =
    Platform.OS === "web" ? { maxWidth: 640, marginHorizontal: "auto" as unknown as number } : undefined;

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={SNAP_POINTS}
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg }}
      handleIndicatorStyle={{ backgroundColor: colors.line, width: 40 }}
      style={webSheet}
      onChange={(index) => onOpenChange?.(index >= 0)}
      onDismiss={() => onOpenChange?.(false)}
    >
      <BottomSheetScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.ink }]}>Trick bag</Text>
          <Text style={[styles.count, { color: colors.inkMuted }]}>
            {poolCount} {poolCount === 1 ? "trick" : "tricks"}
          </Text>
        </View>

        <Section title="Level">
          <Segmented
            options={TIER_OPTIONS}
            value={ds.difficulty}
            onChange={(tier) => dispatch({ type: "setDifficulty", domain: domainId, tier })}
          />
          {isCustom ? (
            <View style={styles.customRow}>
              <Text style={[styles.customLabel, { color: colors.inkMuted }]}>Custom</Text>
              <Button
                size="md"
                variant="ghost"
                label={`Reset to ${TIER_LABEL[ds.difficulty]}`}
                onPress={() => dispatch({ type: "setDifficulty", domain: domainId, tier: ds.difficulty })}
              />
            </View>
          ) : null}
        </Section>

        <Section title="Stances">
          <Animated.View style={[styles.chips, stanceStyle]}>
            {domain.stances.map((stance) => (
              <Chip
                key={stance}
                label={STANCE_LABEL[stance]}
                selected={ds.enabledStances.includes(stance)}
                onPress={() => toggleStance(stance)}
              />
            ))}
          </Animated.View>
        </Section>

        <Section title={`${domainId === "flatground" ? "Flat" : "Ledge"} tricks`}>
          <Animated.View style={[styles.groups, baseStyle]}>
            {TIERS.map((tier) => {
              const bases = domain.bases.filter((b) => baseTier(b) === tier);
              if (bases.length === 0) return null;
              return (
                <View key={tier} style={styles.group}>
                  <Text style={[styles.caption, { color: colors.inkMuted }]}>{TIER_LABEL[tier]}</Text>
                  <View style={styles.chips}>
                    {bases.map((b) => (
                      <Chip
                        key={b.id}
                        label={baseLabel(b)}
                        selected={ds.enabledBases.includes(b.id)}
                        onPress={() => toggleBase(b.id)}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </Animated.View>
        </Section>

        <Section title="Preferences">
          <View style={styles.prefs}>
            {Platform.OS !== "web" ? (
              <SwitchRow
                label="Haptics"
                value={settings.hapticsEnabled}
                onChange={() => dispatch({ type: "toggleHaptics" })}
              />
            ) : null}
            <View style={styles.themeRow}>
              <Text style={[styles.prefLabel, { color: colors.ink }]}>Theme</Text>
              <Segmented options={THEME_OPTIONS} value={preference} onChange={setPreference} />
            </View>
          </View>
        </Section>

        <Button
          variant="ghost"
          label="Reset everything"
          color={colors.danger}
          onPress={() => dispatch({ type: "reset" })}
          style={styles.reset}
        />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 28 },
  titleRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  title: { fontFamily: fonts.display, fontSize: 32, letterSpacing: 0.5 },
  count: { fontFamily: fonts.bodySemi, fontSize: 15 },
  section: { gap: 12 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 1.5 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groups: { gap: 18 },
  group: { gap: 8 },
  caption: { fontFamily: fonts.bodySemi, fontSize: 12 },
  customRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  customLabel: { fontFamily: fonts.bodySemi, fontSize: 13 },
  prefs: { gap: 16 },
  themeRow: { gap: 10 },
  prefLabel: { fontFamily: fonts.bodySemi, fontSize: 16 },
  reset: { alignSelf: "flex-start" },
});
