import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth';
import { getAuthToken, getApiBaseUrl } from '../utils/api';

type SocketEventCallback = (data: unknown) => void;

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  clearUnreadNotifications: () => void;
  clearUnreadMessages: () => void;
  on: (event: string, callback: SocketEventCallback) => void;
  off: (event: string, callback: SocketEventCallback) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

export function SocketProvider({ children }: { children: React.ReactNode }): React.ReactElement {
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

        const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
        const socketInstance = io(baseUrl, {
          auth: { token: `Bearer ${token}` },
          transports: ['websocket'],
          reconnectionAttempts: 5,
          reconnectionDelay: 2000,
        });

        socketInstance.on('connect', () => {
          if (!cancelled) setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          if (!cancelled) setIsConnected(false);
        });

        socketInstance.on('notification', () => {
          if (!cancelled) setUnreadNotifications((prev) => prev + 1);
        });

        socketInstance.on('message', () => {
          if (!cancelled) setUnreadMessages((prev) => prev + 1);
        });

        socketRef.current = socketInstance;
        if (!cancelled) setSocket(socketInstance);
      } catch {
        if (__DEV__) console.warn('Socket connection failed');
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

  const clearUnreadNotifications = useCallback(() => setUnreadNotifications(0), []);
  const clearUnreadMessages = useCallback(() => setUnreadMessages(0), []);

  const on = useCallback((event: string, callback: SocketEventCallback) => {
    socketRef.current?.on(event, callback);
  }, []);

  const off = useCallback((event: string, callback: SocketEventCallback) => {
    socketRef.current?.off(event, callback);
  }, []);

  const value = useMemo<SocketContextType>(
    () => ({
      socket,
      isConnected,
      unreadNotifications,
      unreadMessages,
      clearUnreadNotifications,
      clearUnreadMessages,
      on,
      off,
    }),
    [socket, isConnected, unreadNotifications, unreadMessages, clearUnreadNotifications, clearUnreadMessages, on, off],
  );

  // @ts-expect-error React 19 JSX return type compatibility
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
