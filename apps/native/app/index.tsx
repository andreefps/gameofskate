import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { ScalePressable } from "@/components/scale-pressable";
import { DomainPill } from "@/components/skate/domain-pill";
import { GenerateSurface } from "@/components/skate/generate-surface";
import { SettingsSheet } from "@/components/skate/settings-sheet";
import { SLOT_REVEAL_DURATION_MS, TrickReveal } from "@/components/skate/trick-reveal";
import { useAppTheme } from "@/contexts/app-theme-context";
import { DOMAINS } from "@/lib/skate/domains";
import { buildPool, pick } from "@/lib/skate/select";
import { useSettings } from "@/stores/settings";
import type { Trick } from "@/lib/skate/types";

export default function GeneratorScreen() {
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);
  const { isLight } = useAppTheme();

  const domainId = settings.activeDomain;
  const domain = DOMAINS[domainId];
  const ds = settings.domains[domainId];
  const pool = buildPool(domain, ds);

  const [current, setCurrent] = useState<Trick | null>(null);
  const [token, setToken] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const lastIdRef = useRef<string | undefined>(undefined);
  const rollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    };
  }, []);

  // Don't generate on open: stay on the "Tap to roll" prompt until the first tap.
  // Only react to filter changes that invalidate an already-shown trick.
  useEffect(() => {
    setCurrent((prev) => {
      if (prev === null) return null; // no roll yet — keep the prompt
      if (pool.length === 0) return null; // filters now exclude everything
      if (pool.some((t) => t.id === prev.id)) return prev; // still valid
      return pick(pool, lastIdRef.current); // silently swap to a valid trick
    });
    // pool is derived from domainId + ds; re-check only when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId, ds]);

  const roll = () => {
    if (isRolling) return;
    const next = pick(pool, lastIdRef.current);
    if (!next) return;

    if (rollTimerRef.current) clearTimeout(rollTimerRef.current);
    lastIdRef.current = next.id;
    setCurrent(next);
    setToken((t) => t + 1);

    if (reduceMotion) {
      setIsRolling(false);
      return;
    }

    setIsRolling(true);
    rollTimerRef.current = setTimeout(() => {
      setIsRolling(false);
      rollTimerRef.current = null;
    }, SLOT_REVEAL_DURATION_MS);
  };

  const openMenu = () => sheetRef.current?.present();
  const toggleDomain = () =>
    dispatch({ type: "setActiveDomain", domain: domainId === "flatground" ? "grinds" : "flatground" });

  return (
    <Container isScrollable={false} className="bg-background">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <ScalePressable
          onPress={openMenu}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Ionicons name="options-outline" size={26} color={foreground} />
        </ScalePressable>
        <DomainPill domain={domain} onToggle={toggleDomain} hapticsEnabled={settings.hapticsEnabled} />
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.body}>
        {pool.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: foreground }]}>No tricks match</Text>
            <Text style={[styles.emptyBody, { color: muted }]}>
              Your filters rule out every trick. Widen them to roll again.
            </Text>
            <ScalePressable
              onPress={openMenu}
              style={[
                styles.emptyButton,
                {
                  boxShadow: isLight
                    ? "0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06), 0 2px 4px rgba(0, 0, 0, 0.04)"
                    : "0 0 0 1px rgba(255, 255, 255, 0.08)",
                },
              ]}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={[styles.emptyButtonLabel, { color: foreground }]}>Open menu</Text>
            </ScalePressable>
          </View>
        ) : (
          <View
            style={[
              styles.generatorPosition,
              { transform: [{ translateY: -Math.min(windowHeight * 0.15, 140) }] },
            ]}
          >
            <GenerateSurface
              onRoll={roll}
              hapticsEnabled={settings.hapticsEnabled}
              isRolling={isRolling}
              hasRolled={current !== null}
            >
              <TrickReveal
                trick={current}
                token={token}
                candidates={pool}
                hapticsEnabled={settings.hapticsEnabled}
              />
            </GenerateSurface>
          </View>
        )}
      </View>

      <SettingsSheet ref={sheetRef} />
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 44,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  generatorPosition: {
    width: "100%",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  emptyButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
});
