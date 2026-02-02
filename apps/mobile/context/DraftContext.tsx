import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DraftContextType {
  getDraft: (key: string) => string;
  setDraft: (key: string, body: string) => void;
  clearDraft: (key: string) => void;
}

const DraftContext = createContext<DraftContextType | undefined>(undefined);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const getDraft = (key: string) => drafts[key] || '';

  const setDraft = (key: string, body: string) => {
    setDrafts((prev) => ({ ...prev, [key]: body }));
  };

  const clearDraft = (key: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <DraftContext.Provider value={{ getDraft, setDraft, clearDraft }}>
      {children}
    </DraftContext.Provider>
  );
}

export function useDrafts() {
  const context = useContext(DraftContext);
  if (!context) {
    throw new Error('useDrafts must be used within a DraftProvider');
  }
  return context;
}
