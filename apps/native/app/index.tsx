import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GameControls } from "@/components/game/game-controls";
import { GameOver } from "@/components/game/game-over";
import { GameSetupSheet } from "@/components/game/game-setup-sheet";
import { PlayersStrip } from "@/components/game/players-strip";
import { TurnLine } from "@/components/game/turn-line";
import { Header } from "@/components/header";
import { SettingsSheet } from "@/components/settings-sheet";
import { TrickStage } from "@/components/trick-stage";
import { SwipeHint } from "@/components/swipe-hint";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { useGameTrick } from "@/hooks/use-game-trick";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { useTrickCaller } from "@/hooks/use-trick-caller";
import { confirmEndGame } from "@/lib/confirm";
import { DOMAINS } from "@/lib/skate/domains";
import { matchesPreset } from "@/lib/skate/preset";
import type { DomainId } from "@/lib/skate/types";
import { useGame } from "@/stores/game";
import { useSettings } from "@/stores/settings";
import { useTheme } from "@/theme/theme-provider";
import { fonts } from "@/theme/tokens";

const SPOTS: { value: DomainId; label: string }[] = [
  { value: "flatground", label: "Flat" },
  { value: "grinds", label: "Ledge" },
];

const WIDE_BREAKPOINT = 768;

const LEVEL_LABEL = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } as const;

export default function CallerScreen() {
  const { colors } = useTheme();
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const gameStore = useGame();
  const { game } = gameStore;
  const caller = useTrickCaller({ lock: game?.present.phase === "match" });
  const { pool, current, recent, roll, back, canBack, direction, rollToken, animate } = caller;
  useGameTrick(caller);
  const sheetRef = useRef<BottomSheetModal>(null);
  const setupRef = useRef<BottomSheetModal>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [swiped, setSwiped] = useState(false);
  const sheetOpen = settingsOpen || setupOpen;

  const wide = width >= WIDE_BREAKPOINT;
  const gutter = wide ? 24 : 20;
  const empty = pool.length === 0;

  useHotkeys(
    { " ": roll, Enter: roll, ArrowUp: roll, ArrowRight: roll, ArrowDown: back, ArrowLeft: back },
    !game && !sheetOpen && !empty,
  );


  const openSettings = () => sheetRef.current?.present();
  const openSetup = () => setupRef.current?.present();
  const openGameFromSettings = () => {
    sheetRef.current?.dismiss();
    openSetup();
  };
  const domainSettings = settings.domains[settings.activeDomain];
  const levelLabel = matchesPreset(DOMAINS[settings.activeDomain], domainSettings)
    ? LEVEL_LABEL[domainSettings.difficulty]
    : "Custom";
  const startGame = (names: string[]) => {
    setupRef.current?.dismiss();
    gameStore.start(names);
  };
  const state = game?.present;
  const over = state?.phase === "over";
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
        <Header
          levelLabel={levelLabel}
          onOpenSettings={openSettings}
          headerRight={
            game ? (
              <Button size="sm" variant="ghost" icon="close" label="End" onPress={() => confirmEndGame(gameStore.end)} />
            ) : null
          }
        />

        <View style={styles.spot}>
          <Segmented
            size="sm"
            disabled={game?.present.phase === "match"}
            options={SPOTS}
            value={settings.activeDomain}
            onChange={(domain) => dispatch({ type: "setActiveDomain", domain })}
          />
        </View>

        {state && !over ? <PlayersStrip state={state} /> : null}

        {state && over ? (
          <GameOver
            state={state}
            canUndo={game!.past.length > 0}
            maxSize={wide ? 150 : 104}
            hapticsEnabled={settings.hapticsEnabled}
            hotkeysEnabled={!sheetOpen}
            onRematch={gameStore.rematch}
            onNewGame={openSetup}
            onDone={gameStore.end}
            onUndo={gameStore.undo}
          />
        ) : (
          <>
            <TrickStage
              trick={current}
              pool={pool}
              poolSize={pool.length}
              rollToken={rollToken}
              animate={animate}
              maxSize={wide ? 150 : 104}
              hapticsEnabled={settings.hapticsEnabled}
              onRoll={roll}
              onBack={back}
              canBack={canBack}
              direction={direction}
              onSwipe={() => setSwiped(true)}
              onOpenSettings={openSettings}
              interactive={!state}
              turnLine={state ? <TurnLine state={state} /> : undefined}
            />

            {state ? (
              <GameControls
                phase={state.phase}
                canUndo={game!.past.length > 0}
                hapticsEnabled={settings.hapticsEnabled}
                hotkeysEnabled={!sheetOpen && !empty}
                onResult={gameStore.result}
                onUndo={gameStore.undo}
                onNewTrick={roll}
              />
            ) : (
              <>
                <View style={styles.trailSlot}>
                  {trail ? (
                    <Text numberOfLines={1} style={[styles.trail, { color: colors.inkMuted }]}>
                      Last: {trail}
                    </Text>
                  ) : null}
                </View>

                <SwipeHint hidden={swiped || empty} />
              </>
            )}
          </>
        )}
      </View>

      <SettingsSheet
        ref={sheetRef}
        onOpenChange={setSettingsOpen}
        onOpenGame={game ? undefined : openGameFromSettings}
      />
      <GameSetupSheet
        ref={setupRef}
        initialNames={gameStore.lastNames}
        onStart={startGame}
        onOpenChange={setSetupOpen}
      />
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
