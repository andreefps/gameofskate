import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { forwardRef, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { MAX_PLAYERS } from "@/lib/skate/game";
import { useTheme } from "@/theme/theme-provider";
import { fonts, radius } from "@/theme/tokens";

// gorhom's BottomSheetTextInput calls TextInput.State.currentlyFocusedInput(),
// which react-native-web doesn't implement — use the plain input on web.
const NameInput = (Platform.OS === "web" ? TextInput : BottomSheetTextInput) as typeof TextInput;

type Props = {
  initialNames: string[];
  onStart: (names: string[]) => void;
  onOpenChange?: (open: boolean) => void;
};

function SetupForm({ initialNames, onStart }: Pick<Props, "initialNames" | "onStart">) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [names, setNames] = useState(() => (initialNames.length > 0 ? initialNames : ["", ""]));
  const inputs = useRef<(TextInput | null)[]>([]);

  const setName = (i: number, value: string) => setNames((n) => n.map((x, idx) => (idx === i ? value : x)));
  const remove = (i: number) => setNames((n) => n.filter((_, idx) => idx !== i));
  const add = () => {
    setNames((n) => [...n, ""]);
    // Focus the new row once it has mounted.
    setTimeout(() => inputs.current[names.length]?.focus(), 50);
  };
  const submit = () => onStart(names.map((n) => n.trim()));

  return (
    <BottomSheetScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
    >
        <Text style={[styles.title, { color: colors.ink }]}>Game of S.K.A.T.E.</Text>
        <Text style={[styles.explain, { color: colors.inkMuted }]}>
          Set a trick. Land it and everyone has to match. Miss a match, take a letter. Spell SKATE and you&apos;re out.
        </Text>

        <View style={styles.rows}>
          {names.map((name, i) => (
            <View key={i} style={styles.row}>
              <NameInput
                ref={(el: TextInput | null | undefined) => {
                  inputs.current[i] = el ?? null;
                }}
                value={name}
                onChangeText={(v: string) => setName(i, v)}
                placeholder={`Player ${i + 1}`}
                placeholderTextColor={colors.inkMuted}
                maxLength={20}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType={i === names.length - 1 ? "go" : "next"}
                blurOnSubmit={i === names.length - 1}
                onSubmitEditing={() => (i === names.length - 1 ? submit() : inputs.current[i + 1]?.focus())}
                accessibilityLabel={`Player ${i + 1} name`}
                style={[styles.input, { backgroundColor: colors.surface, color: colors.ink }]}
              />
              {names.length > 1 ? (
                <IconButton icon="close" onPress={() => remove(i)} accessibilityLabel={`Remove player ${i + 1}`} />
              ) : null}
            </View>
          ))}
        </View>

        {names.length === 1 ? (
          <Text style={[styles.hint, { color: colors.inkMuted }]}>
            Solo: see how many you land before S.K.A.T.E.
          </Text>
        ) : null}

        {names.length < MAX_PLAYERS ? (
          <Button variant="ghost" icon="add" label="Add player" onPress={add} style={styles.add} />
        ) : null}

      <Button size="lg" variant="primary" label="Start" onPress={submit} style={styles.start} />
    </BottomSheetScrollView>
  );
}

export const GameSetupSheet = forwardRef<BottomSheetModal, Props>(function GameSetupSheet(
  { initialNames, onStart, onOpenChange },
  ref,
) {
  const { colors } = useTheme();

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
      enableDynamicSizing
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.bg }}
      handleIndicatorStyle={{ backgroundColor: colors.line, width: 40 }}
      style={webSheet}
      onChange={(index) => onOpenChange?.(index >= 0)}
      onDismiss={() => onOpenChange?.(false)}
    >
      <SetupForm initialNames={initialNames} onStart={onStart} />
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, gap: 16 },
  title: { fontFamily: fonts.display, fontSize: 32, letterSpacing: 0.5 },
  explain: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 21 },
  rows: { gap: 10, marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, height: 52, borderRadius: radius.md, paddingHorizontal: 16, fontFamily: fonts.bodySemi, fontSize: 17 },
  hint: { fontFamily: fonts.bodySemi, fontSize: 13 },
  add: { alignSelf: "flex-start" },
  start: { marginTop: 8 },
});
