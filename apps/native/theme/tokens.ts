export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkMuted: string;
  line: string;
  /** Very low-emphasis ink for placeholder display type. */
  ghost: string;
  /** `ghost` for content sitting on an ink-filled surface. */
  ghostOnInk: string;
  /** Elevated control surface (segmented thumb) — must contrast with surfaceAlt. */
  raised: string;
  accent: string;
  accentInk: string;
  success: string;
  danger: string;
  backdrop: string;
};

export const light: Palette = {
  bg: "#F1EEE7",
  surface: "#FFFFFF",
  surfaceAlt: "#E6E2D9",
  ink: "#121211",
  inkMuted: "#6E6A62",
  line: "rgba(18,18,17,0.10)",
  ghost: "rgba(18,18,17,0.18)",
  ghostOnInk: "rgba(241,238,231,0.28)",
  raised: "#FFFFFF",
  accent: "#FF4F1A",
  accentInk: "#FFFFFF",
  success: "#1F9D55",
  danger: "#E5383B",
  backdrop: "rgba(18,18,17,0.45)",
};

export const dark: Palette = {
  bg: "#0F0F0E",
  surface: "#1A1A18",
  surfaceAlt: "#262522",
  ink: "#F1EEE7",
  inkMuted: "#8F8B83",
  line: "rgba(241,238,231,0.10)",
  ghost: "rgba(241,238,231,0.16)",
  ghostOnInk: "rgba(15,15,14,0.28)",
  raised: "#3B3A36",
  accent: "#FF5C2B",
  accentInk: "#0F0F0E",
  success: "#34C46E",
  danger: "#FF5A5F",
  backdrop: "rgba(0,0,0,0.6)",
};

export const fonts = {
  display: "BarlowCondensed_800ExtraBold",
  body: "DMSans_400Regular",
  bodySemi: "DMSans_600SemiBold",
  bodyBold: "DMSans_700Bold",
} as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 7: 32, 8: 40 } as const;
