import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
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
import { DOMAINS } from "@/lib/skate/domains";
import { buildPool, pick } from "@/lib/skate/select";
import { useSettings } from "@/stores/settings";
import type { Trick } from "@/lib/skate/types";
import { useTheme } from "@/theme/theme-provider";

export default function GeneratorScreen() {
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { colors } = useTheme();
  const foreground = colors.ink;
  const muted = colors.inkMuted;

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
      return pick(pool, lastIdRef.current ? [lastIdRef.current] : []); // silently swap to a valid trick
    });
    // pool is derived from domainId + ds; re-check only when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domainId, ds]);

  const roll = () => {
    if (isRolling) return;
    const next = pick(pool, lastIdRef.current ? [lastIdRef.current] : []);
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
    <Container isScrollable={false}>
      <View style={styles.skyDecorations}>
        <View style={[styles.sun, { backgroundColor: colors.accent }]} />
        <View style={[styles.railLine, { borderColor: colors.ink }]} />
        <Text style={[styles.skyScribble, { color: colors.ink }]}>////</Text>
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brand}>
          <Text style={[styles.brandKicker, { color: foreground }]}>TRICK GENERATOR</Text>
          <Text style={[styles.brandName, { color: foreground }]}>SKATE CALL</Text>
        </View>
        <ScalePressable
          onPress={openMenu}
          style={[
            styles.menuButton,
            {
              backgroundColor: colors.surface,
              boxShadow: `3px 4px 0 ${colors.ink}`,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <Ionicons name="options" size={22} color={foreground} />
        </ScalePressable>
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
                  boxShadow: `0 0 0 1px ${colors.line}`,
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
              windowHeight < 700 && styles.generatorCompact,
            ]}
          >
            <DomainPill domain={domain} onToggle={toggleDomain} hapticsEnabled={settings.hapticsEnabled} />
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
            <Text style={[styles.footerNote, { color: foreground }]}>SET IT. LAND IT. PASS IT.</Text>
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
    paddingHorizontal: 22,
    paddingBottom: 10,
    zIndex: 2,
  },
  brand: {
    gap: 0,
  },
  brandKicker: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 2.1,
  },
  brandName: {
    marginTop: -2,
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: 0.4,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  skyDecorations: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    pointerEvents: "none",
  },
  sun: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -74,
    top: -52,
    opacity: 0.9,
  },
  railLine: {
    position: "absolute",
    width: 190,
    height: 76,
    left: -60,
    bottom: -26,
    borderWidth: 7,
    borderRadius: 14,
    transform: [{ rotate: "-9deg" }],
    opacity: 0.13,
  },
  skyScribble: {
    position: "absolute",
    right: 24,
    bottom: 34,
    fontFamily: "BarlowCondensed_800ExtraBold",
    fontSize: 26,
    letterSpacing: -2,
    opacity: 0.18,
    transform: [{ rotate: "-10deg" }],
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  generatorPosition: {
    width: "100%",
    alignItems: "center",
    gap: 14,
    transform: [{ translateY: -10 }],
  },
  generatorCompact: {
    transform: [{ translateY: 0 }, { scale: 0.9 }],
  },
  footerNote: {
    fontFamily: "DMSans_700Bold",
    fontSize: 9,
    letterSpacing: 2.2,
    opacity: 0.68,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: "BarlowCondensed_800ExtraBold",
  },
  emptyBody: {
    fontFamily: "DMSans_400Regular",
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
    fontFamily: "DMSans_600SemiBold",
  },
});
