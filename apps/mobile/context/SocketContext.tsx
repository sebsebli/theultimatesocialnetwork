import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./auth";
import { getAuthToken, getApiBaseUrl } from "../utils/api";

type SocketEventCallback = (data: unknown) => void;

// ── Split into two contexts so badge-count changes don't re-render
//    every consumer that only needs the socket instance (and vice-versa). ──

interface SocketCoreContextType {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, callback: SocketEventCallback) => void;
  off: (event: string, callback: SocketEventCallback) => void;
}

interface SocketBadgesContextType {
  unreadNotifications: number;
  unreadMessages: number;
  clearUnreadNotifications: () => void;
  clearUnreadMessages: () => void;
}

/** Combined type kept for backward-compat with existing `useSocket()` callers. */
type SocketContextType = SocketCoreContextType & SocketBadgesContextType;

const SocketCoreContext = createContext<SocketCoreContextType | undefined>(
  undefined,
);
const SocketBadgesContext = createContext<SocketBadgesContextType | undefined>(
  undefined,
);

/** Use when you need badge counts (unread notifications / messages). */
export function useSocketBadges(): SocketBadgesContextType {
  const context = useContext(SocketBadgesContext);
  if (!context)
    throw new Error("useSocketBadges must be used within a SocketProvider");
  return context;
}

/** Full combined hook – backward compatible. Consumers that only need badges
 *  should prefer `useSocketBadges()` to avoid re-renders from socket events. */
export function useSocket(): SocketContextType {
  const core = useContext(SocketCoreContext);
  const badges = useContext(SocketBadgesContext);
  if (!core || !badges) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return { ...core, ...badges };
}

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { isAuthenticated } = useAuth();
  // Use ref to track socket for cleanup without stale closure issues
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let cancelled = false;

    const connect = async () => {
      try {
        const token = await getAuthToken();
        if (!token || cancelled) return;

        const baseUrl = getApiBaseUrl().replace(/\/api$/, "");
        const socketInstance = io(baseUrl, {
          auth: { token: `Bearer ${token}` },
          transports: ["websocket"],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socketInstance.on("connect", () => {
          if (!cancelled) setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          if (!cancelled) setIsConnected(false);
        });

        socketInstance.on("notification", () => {
          if (!cancelled) setUnreadNotifications((prev) => prev + 1);
        });

        socketInstance.on("message", () => {
          if (!cancelled) setUnreadMessages((prev) => prev + 1);
        });

        socketRef.current = socketInstance;
        if (!cancelled) setSocket(socketInstance);
      } catch {
        if (__DEV__) console.warn("Socket connection failed");
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated]);

  const clearUnreadNotifications = useCallback(
    () => setUnreadNotifications(0),
    [],
  );
  const clearUnreadMessages = useCallback(() => setUnreadMessages(0), []);

  const on = useCallback((event: string, callback: SocketEventCallback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: SocketEventCallback) => {
    socketRef.current?.off(event, callback);
  }, []);

  // ── Core context value — only changes when socket or connection changes ──
  const coreValue = useMemo<SocketCoreContextType>(
    () => ({ socket, isConnected, on, off }),
    [socket, isConnected, on, off],
  );

  // ── Badges context value — only changes when badge counts change ──
  const badgesValue = useMemo<SocketBadgesContextType>(
    () => ({
      unreadNotifications,
      unreadMessages,
      clearUnreadNotifications,
      clearUnreadMessages,
    }),
    [
      unreadNotifications,
      unreadMessages,
      clearUnreadNotifications,
      clearUnreadMessages,
    ],
  );

  const inner = (
    // @ts-expect-error React 19 JSX return type compatibility
    <SocketBadgesContext.Provider value={badgesValue}>
      {children}
    </SocketBadgesContext.Provider>
  );

  // @ts-expect-error React 19 JSX return type compatibility
  return (
    <SocketCoreContext.Provider value={coreValue}>
      {inner}
    </SocketCoreContext.Provider>
  );
}
