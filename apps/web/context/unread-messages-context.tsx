"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface UnreadMessagesContextValue {
  unreadCount: number;
  refresh: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue>({
  unreadCount: 0,
  refresh: () => {},
});

export function UnreadMessagesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/threads");
      if (res.ok) {
        const threads = await res.json();
        const total = (threads || []).reduce(
          (sum: number, t: { unreadCount?: number }) => sum + (t.unreadCount ?? 0),
          0
        );
        setUnreadCount(total);
      }
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  return useContext(UnreadMessagesContext);
}
