"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

export interface TrailStep {
  type: "post" | "topic" | "user";
  id: string;
  label: string;
  href: string;
}

interface ExplorationTrailContextValue {
  trail: TrailStep[];
  pushStep: (step: TrailStep) => void;
  jumpTo: (index: number) => void;
  clearTrail: () => void;
  isActive: boolean;
}

const ExplorationTrailContext = createContext<ExplorationTrailContextValue>({
  trail: [],
  pushStep: () => {},
  jumpTo: () => {},
  clearTrail: () => {},
  isActive: false,
});

const MAX_TRAIL_LENGTH = 20;

export function ExplorationTrailProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [trail, setTrail] = useState<TrailStep[]>([]);

  const pushStep = useCallback((step: TrailStep) => {
    setTrail((prev) => {
      // Don't push duplicate consecutive steps
      const last = prev[prev.length - 1];
      if (last && last.type === step.type && last.id === step.id) {
        return prev;
      }
      // Check if step already exists in trail — jump back to it instead
      const existingIndex = prev.findIndex(
        (s) => s.type === step.type && s.id === step.id,
      );
      if (existingIndex !== -1) {
        return prev.slice(0, existingIndex + 1);
      }
      const next = [...prev, step];
      return next.length > MAX_TRAIL_LENGTH
        ? next.slice(next.length - MAX_TRAIL_LENGTH)
        : next;
    });
  }, []);

  const jumpTo = useCallback((index: number) => {
    setTrail((prev) => prev.slice(0, index + 1));
  }, []);

  const clearTrail = useCallback(() => {
    setTrail([]);
  }, []);

  const isActive = trail.length > 1;

  const value = useMemo(
    () => ({ trail, pushStep, jumpTo, clearTrail, isActive }),
    [trail, pushStep, jumpTo, clearTrail, isActive],
  );

  return (
    <ExplorationTrailContext.Provider value={value}>
      {children}
    </ExplorationTrailContext.Provider>
  );
}

export function useExplorationTrail() {
  return useContext(ExplorationTrailContext);
}
