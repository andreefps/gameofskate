import { Ionicons } from "@expo/vector-icons";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useThemeColor } from "heroui-native";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Container } from "@/components/container";
import { DomainPill } from "@/components/skate/domain-pill";
import { GenerateSurface } from "@/components/skate/generate-surface";
import { SettingsSheet } from "@/components/skate/settings-sheet";
import { TrickReveal } from "@/components/skate/trick-reveal";
import { DOMAINS } from "@/lib/skate/domains";
import { buildPool, pick } from "@/lib/skate/select";
import { useSettings } from "@/stores/settings";
import type { Trick } from "@/lib/skate/types";

export default function GeneratorScreen() {
  const { settings, dispatch } = useSettings();
  const insets = useSafeAreaInsets();
  const [foreground, muted] = useThemeColor(["foreground", "muted"]);

  const domainId = settings.activeDomain;
  const domain = DOMAINS[domainId];
  const ds = settings.domains[domainId];
  const pool = buildPool(domain, ds);
  const poolNames = pool.map((t) => t.name);

  const [current, setCurrent] = useState<Trick | null>(null);
  const [token, setToken] = useState(0);
  const lastIdRef = useRef<string | undefined>(undefined);
  const sheetRef = useRef<BottomSheetModal>(null);

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
    const next = pick(pool, lastIdRef.current);
    if (!next) return;
    lastIdRef.current = next.id;
    setCurrent(next);
    setToken((t) => t + 1);
  };

  const openMenu = () => sheetRef.current?.present();
  const toggleDomain = () =>
    dispatch({ type: "setActiveDomain", domain: domainId === "flatground" ? "grinds" : "flatground" });

  return (
    <Container isScrollable={false} className="bg-background">
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={openMenu} hitSlop={12} style={styles.menuButton}>
          <Ionicons name="options-outline" size={26} color={foreground} />
        </Pressable>
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
            <Pressable onPress={openMenu} style={styles.emptyButton} hitSlop={8}>
              <Text style={[styles.emptyButtonLabel, { color: foreground }]}>Open menu</Text>
            </Pressable>
          </View>
        ) : (
          <GenerateSurface onRoll={roll} hapticsEnabled={settings.hapticsEnabled}>
            {current ? (
              <TrickReveal
                trick={current}
                token={token}
                flickerNames={poolNames}
                hapticsEnabled={settings.hapticsEnabled}
              />
            ) : (
              <Text style={[styles.prompt, { color: muted }]}>Tap to roll</Text>
            )}
          </GenerateSurface>
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
    width: 32,
    alignItems: "flex-start",
  },
  headerSpacer: {
    width: 32,
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#8888",
  },
  emptyButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  prompt: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
});
