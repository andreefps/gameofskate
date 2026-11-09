import { StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { useHotkeys } from "@/hooks/use-hotkeys";
import { notifySuccess, notifyWarning } from "@/lib/haptics";
import type { GamePhase } from "@/lib/skate/game";
import { useTheme } from "@/theme/theme-provider";

type Props = {
  phase: GamePhase;
  canUndo: boolean;
  hapticsEnabled: boolean;
  /** False while a sheet is open so keys don't leak through. */
  hotkeysEnabled: boolean;
  onResult: (landed: boolean) => void;
  onUndo: () => void;
  onNewTrick: () => void;
};

export function GameControls({ phase, canUndo, hapticsEnabled, hotkeysEnabled, onResult, onUndo, onNewTrick }: Props) {
  const { colors } = useTheme();

  const landed = () => {
    if (hapticsEnabled) notifySuccess();
    onResult(true);
  };
  const missed = () => {
    if (hapticsEnabled) notifyWarning();
    onResult(false);
  };
  const undo = () => {
    if (canUndo) onUndo();
  };

  useHotkeys(
    { l: landed, L: landed, ArrowRight: landed, m: missed, M: missed, ArrowLeft: missed, u: undo, U: undo, "mod+z": undo },
    hotkeysEnabled,
  );

  return (
    <View>
      <View style={styles.main}>
        <Button
          size="lg"
          variant="secondary"
          icon="close"
          label="Missed"
          color={colors.danger}
          onPress={missed}
          style={styles.flex}
        />
        <Button size="lg" variant="primary" icon="checkmark" label="Landed" onPress={landed} style={styles.flex} />
      </View>
      <View style={styles.sub}>
        <Button variant="ghost" size="md" icon="arrow-undo" label="Undo" disabled={!canUndo} onPress={undo} />
        {phase === "set" ? (
          <Button variant="ghost" size="md" icon="shuffle" label="New trick" onPress={onNewTrick} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  main: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  sub: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, minHeight: 48 },
});
