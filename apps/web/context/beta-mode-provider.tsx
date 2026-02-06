"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";

/** Single source of truth: fetched from GET /api/invites/beta-mode (backend system_settings BETA_MODE). */
interface BetaModeContextValue {
  betaMode: boolean;
  loading: boolean;
}

const BetaModeContext = createContext<BetaModeContextValue>({
  betaMode: true,
  loading: true,
});

export function BetaModeProvider({ children }: { children: ReactNode }) {
  const [betaMode, setBetaMode] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchBetaMode = useCallback(async () => {
    try {
      const res = await fetch("/api/invites/beta-mode", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { betaMode?: boolean };
        setBetaMode(typeof data.betaMode === "boolean" ? data.betaMode : true);
      }
    } catch {
      setBetaMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBetaMode();
  }, [fetchBetaMode]);

  const value = useMemo(
    () => ({ betaMode, loading }),
    [betaMode, loading],
  );

  return (
    <BetaModeContext.Provider value={value}>
      {children}
    </BetaModeContext.Provider>
  );
}

export function useBetaMode(): BetaModeContextValue {
  return useContext(BetaModeContext);
}
