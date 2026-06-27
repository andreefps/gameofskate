import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";

import { hydrate, settingsReducer } from "@/lib/skate/settings";
import type { Settings, SettingsAction } from "@/lib/skate/settings";
import { loadSync, save } from "@/stores/persist";

const STORAGE_KEY = "skate.settings.v1";

function init(): Settings {
  return hydrate(loadSync(STORAGE_KEY));
}

type SettingsContextValue = {
  settings: Settings;
  dispatch: React.Dispatch<SettingsAction>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, dispatch] = useReducer(settingsReducer, undefined, init);

  useEffect(() => {
    save(STORAGE_KEY, settings);
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, dispatch }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
