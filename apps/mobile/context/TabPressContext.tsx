import React, { createContext, useCallback, useContext, useState } from "react";

type TabKey = "index" | "explore" | "messages" | "profile";

type TabPressContextValue = {
  /** Count for each tab; when it increments, that tab's screen should scroll to top and refresh. */
  tabPressCounts: Record<TabKey, number>;
  /** Call when the user presses the currently focused tab (same tab pressed again). */
  emitTabPress: (tab: TabKey) => void;
};

const initialCounts: Record<TabKey, number> = {
  index: 0,
  explore: 0,
  messages: 0,
  profile: 0,
};

const TabPressContext = createContext<TabPressContextValue | null>(null);

export function TabPressProvider({ children }: { children: React.ReactNode }) {
  const [tabPressCounts, setTabPressCounts] =
    useState<Record<TabKey, number>>(initialCounts);

  const emitTabPress = useCallback((tab: TabKey) => {
    setTabPressCounts((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
  }, []);

  return React.createElement(
    TabPressContext.Provider,
    { value: { tabPressCounts, emitTabPress } },
    children,
  );
}

export function useTabPress() {
  const ctx = useContext(TabPressContext);
  if (!ctx) return null;
  return ctx;
}
