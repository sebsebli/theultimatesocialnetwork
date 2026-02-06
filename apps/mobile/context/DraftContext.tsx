import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface DraftContextType {
  getDraft: (key: string) => string;
  setDraft: (key: string, body: string) => void;
  clearDraft: (key: string) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const getDraft = useCallback((key: string) => drafts[key] || '', [drafts]);

  const setDraft = useCallback((key: string, body: string) => {
    setDrafts((prev) => ({ ...prev, [key]: body }));
  }, []);

  const clearDraft = useCallback((key: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const value = useMemo(() => ({ getDraft, setDraft, clearDraft }), [getDraft, setDraft, clearDraft]);

  return React.createElement(DraftContext.Provider, { value }, children);
}

export function useDrafts() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDrafts must be used within a DraftProvider');
  }
  return context;
}
