import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useThemeColor } from "heroui-native";
import { forwardRef, type ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DifficultyBar } from "@/components/skate/difficulty-bar";
import { OptionChip } from "@/components/skate/option-chip";
import { TIER_LABEL } from "@/components/skate/tier-label";
import { ThemeToggle } from "@/components/theme-toggle";
import { DOMAINS, DOMAIN_LIST } from "@/lib/skate/domains";
import { TIERS } from "@/lib/skate/tier";
import { useSettings } from "@/stores/settings";

const SNAP_POINTS = ["90%"];

function Section({ title, children }: { title: string; children: ReactNode }) {
  const muted = useThemeColor("muted");
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: muted }]}>{title}</Text>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export const SettingsSheet = forwardRef<BottomSheetModal>(function SettingsSheet(_props, ref) {
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();

  const [background, foreground, muted, surface, accent] = useThemeColor([
    "background",
    "foreground",
    "muted",
    "surface-secondary",
    "accent",
  ]);

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
      backgroundStyle={{ backgroundColor: background }}
      handleIndicatorStyle={{ backgroundColor: muted }}
    >
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          Platform.OS === "web" && styles.contentWeb,
          { paddingBottom: insets.bottom + 28 },
        ]}
      >
        <Text style={[styles.heading, { color: foreground }]}>Settings</Text>

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
          <Text style={[styles.sectionTitle, { color: muted }]}>Difficulty</Text>
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

        <View style={[styles.row, { borderTopColor: surface }]}>
          <Text style={[styles.rowLabel, { color: foreground }]}>Haptics</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={() => dispatch({ type: "toggleHaptics" })}
            trackColor={{ true: accent, false: surface }}
          />
        </View>

        <View style={[styles.row, { borderTopColor: surface }]}>
          <Text style={[styles.rowLabel, { color: foreground }]}>Theme</Text>
          <ThemeToggle />
        </View>

        <Pressable
          onPress={() => dispatch({ type: "reset" })}
          style={[styles.reset, { backgroundColor: surface }]}
        >
          <Text style={[styles.resetLabel, { color: muted }]}>Reset to defaults</Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  contentWeb: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 16,
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
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
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  reset: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  resetLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
