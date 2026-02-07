import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export interface TrailStep {
  type: "post" | "topic" | "user" | "explore";
  id: string;
  label: string;
  href: string;
  timestamp: number;
}

interface ExplorationTrailContextType {
  trail: TrailStep[];
  pushStep: (step: Omit<TrailStep, "timestamp">) => void;
  jumpTo: (index: number) => void;
  clearTrail: () => void;
  isActive: boolean;
}

const ExplorationTrailContext =
  createContext<ExplorationTrailContextType | null>(null);

export function ExplorationTrailProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [trail, setTrail] = useState<TrailStep[]>([]);

  const pushStep = useCallback((step: Omit<TrailStep, "timestamp">) => {
    setTrail((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.type === step.type && last.id === step.id) return prev;

      const existingIndex = prev.findIndex(
        (s) => s.type === step.type && s.id === step.id,
      );
      if (existingIndex >= 0) return prev.slice(0, existingIndex + 1);

      const newTrail = [...prev, { ...step, timestamp: Date.now() }];
      if (newTrail.length > 20) return newTrail.slice(-20);
      return newTrail;
    });
  }, []);

  const jumpTo = useCallback((index: number) => {
    setTrail((prev) => prev.slice(0, index + 1));
  }, []);

  const clearTrail = useCallback(() => setTrail([]), []);

  const value: ExplorationTrailContextType = {
    trail,
    pushStep,
    jumpTo,
    clearTrail,
    isActive: trail.length > 1,
  };
  return React.createElement(
    ExplorationTrailContext.Provider,
    { value },
    children,
  );
}

export function useExplorationTrail() {
  const ctx = useContext(ExplorationTrailContext);
  if (!ctx)
    return {
      pushStep: () => {},
      trail: [] as TrailStep[],
      jumpTo: () => {},
      clearTrail: () => {},
      isActive: false,
    };
  return ctx;
}
