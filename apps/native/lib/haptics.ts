import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Haptics are native-only; on web these are no-ops so call sites stay uniform
// and can never throw. Call sites still gate on the user's hapticsEnabled setting.
const isWeb = Platform.OS === "web";

export function impactMedium(): void {
  if (!isWeb) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

export function impactLight(): void {
  if (!isWeb) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function notifySuccess(): void {
  if (!isWeb) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export function selectionTick(): void {
  if (!isWeb) void Haptics.selectionAsync();
}
