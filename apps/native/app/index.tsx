import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Header } from "@/components/header";
import { SettingsSheet } from "@/components/settings-sheet";
import { TrickStage } from "@/components/trick-stage";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useTrickCaller } from "@/hooks/use-trick-caller";
import type { DomainId } from "@/lib/skate/types";
import { useSettings } from "@/stores/settings";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const SPOTS: { value: DomainId; label: string }[] = [
  { value: "flatground", label: "Flat" },
  { value: "grinds", label: "Ledge" },
];

const WIDE_BREAKPOINT = 768;

export default function CallerScreen() {
  const { colors } = useTheme();
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { pool, current, recent, roll, rollToken } = useTrickCaller();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const wide = width >= WIDE_BREAKPOINT;
  const gutter = wide ? 24 : 20;
  const empty = pool.length === 0;

  useHotkeys({ " ": roll, Enter: roll }, !sheetOpen && !empty);

  const openSettings = () => sheetRef.current?.present();
  const trail = recent
    .slice(0, 4)
    .map((t) => t.name)
    .join(" · ");

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.column,
          {
            paddingTop: insets.top + 12,
            paddingBottom: Math.max(insets.bottom, 12) + 8,
            paddingHorizontal: gutter,
            maxWidth: wide ? 640 + gutter * 2 : undefined,
          },
        ]}
      >
        {/* headerRight: game agent adds the "Play S.K.A.T.E." button here. */}
        <Header onOpenSettings={openSettings} headerRight={null} />

        <View style={styles.spot}>
          <Segmented
            size="sm"
            options={SPOTS}
            value={settings.activeDomain}
            onChange={(domain) => dispatch({ type: "setActiveDomain", domain })}
          />
        </View>

        <TrickStage
          trick={current}
          poolSize={pool.length}
          rollToken={rollToken}
          maxSize={wide ? 150 : 104}
          hapticsEnabled={settings.hapticsEnabled}
          onRoll={roll}
          onOpenSettings={openSettings}
        />

        <View style={styles.trailSlot}>
          {trail ? (
            <Text numberOfLines={1} style={[styles.trail, { color: colors.inkMuted }]}>
              Last: {trail}
            </Text>
          ) : null}
        </View>

        <Button
          size="lg"
          variant="primary"
          icon="shuffle"
          label={current ? "Next trick" : "Call trick"}
          disabled={empty}
          onPress={roll}
        />
      </View>

      <SettingsSheet ref={sheetRef} onOpenChange={setSheetOpen} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center" },
  column: { flex: 1, width: "100%" },
  spot: { width: 180, marginTop: 16 },
  trailSlot: { minHeight: 20, marginBottom: 16, justifyContent: "center" },
  trail: { fontFamily: fonts.bodySemi, fontSize: 13 },
});
