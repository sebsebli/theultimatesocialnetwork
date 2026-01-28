import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth'; // Adjust import based on where AuthContext is
import { getAuthToken } from '../utils/api';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  clearUnreadNotifications: () => void;
  clearUnreadMessages: () => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
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
  const { showSuccess } = useToast();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const connect = async () => {
      const token = await getAuthToken();
      if (!token) return;

      const socketInstance = io(process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000', {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('notification', (data) => {
        setUnreadNotifications(prev => prev + 1);
      });

      socketInstance.on('message', (data) => {
        // Increment if not current thread? Hard to know here.
        // For now, simple increment.
        setUnreadMessages(prev => prev + 1);
      });

      setSocket(socketInstance);
    };

    connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated]);

  const clearUnreadNotifications = useCallback(() => setUnreadNotifications(0), []);
  const clearUnreadMessages = useCallback(() => setUnreadMessages(0), []);

  const on = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  const off = useCallback((event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  const Provider = SocketContext.Provider as any;
  return (
    <Provider value={{ socket, isConnected, unreadNotifications, unreadMessages, clearUnreadNotifications, clearUnreadMessages, on, off }}>
      {children}
    </Provider>
  ) as React.ReactElement;
}
