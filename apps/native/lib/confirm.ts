import { Alert, Platform } from "react-native";

/** Native-feeling destructive confirm: window.confirm on web, Alert elsewhere. */
export function confirmEndGame(onConfirm: () => void): void {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm("End this game?")) onConfirm();
    return;
  }
  Alert.alert("End game?", "The current game will be discarded.", [
    { text: "Cancel", style: "cancel" },
    { text: "End game", style: "destructive", onPress: onConfirm },
  ]);
}
