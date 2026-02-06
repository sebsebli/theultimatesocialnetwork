import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../utils/api";
import { useAuth } from "./auth";

interface MePreferences {
  preferences?: { smartCiteEnabled?: boolean };
}

interface SettingsContextType {
  smartCiteEnabled: boolean;
  setSmartCiteEnabled: (enabled: boolean) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  smartCiteEnabled: true,
  setSmartCiteEnabled: async () => {},
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [smartCiteEnabled, setSmartCiteEnabledState] = useState(true);

  // Load from local storage on mount
  useEffect(() => {
    AsyncStorage.getItem("citewalk_smart_cite")
      .then((val) => {
        if (val !== null) {
          setSmartCiteEnabledState(val === "true");
        }
      })
      .catch(() => {
        // Fallback: keep default
      });
  }, []);

  // Sync from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      api
        .get<MePreferences>("/users/me")
        .then((me) => {
          const remoteVal = me?.preferences?.smartCiteEnabled;
          if (remoteVal !== undefined) {
            setSmartCiteEnabledState(remoteVal);
            AsyncStorage.setItem("citewalk_smart_cite", String(remoteVal)).catch(() => { /* persist preference best-effort */ });
          }
        })
        .catch(() => {
          // Network error; keep local value
        });
    }
  }, [isAuthenticated]);

  const setSmartCiteEnabled = useCallback(
    async (enabled: boolean) => {
      // 1. Optimistic update
      setSmartCiteEnabledState(enabled);

      // 2. Local persistence
      await AsyncStorage.setItem("citewalk_smart_cite", String(enabled));

      // 3. Server sync
      if (isAuthenticated) {
        try {
          const me = await api.get<MePreferences>("/users/me");
          const currentPrefs = me?.preferences || {};
          await api.patch("/users/me", {
            preferences: { ...currentPrefs, smartCiteEnabled: enabled },
          });
        } catch {
          if (__DEV__) console.warn("Failed to sync settings to server");
        }
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(() => ({ smartCiteEnabled, setSmartCiteEnabled }), [smartCiteEnabled, setSmartCiteEnabled]);

  return React.createElement(SettingsContext.Provider, { value }, children);
}
