import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './auth'; // Adjust import based on where AuthContext is
import { getAuthToken } from '../utils/api';
import { useToast } from './ToastContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
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
        console.log('Mobile Socket Connected');
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
      });

      socketInstance.on('notification', (data) => {
        showSuccess('New Notification'); // Replace with specific message
        // Trigger global refetch or state update
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

  const Provider = SocketContext.Provider as any;
  return (
    <Provider value={{ socket, isConnected }}>
      {children}
    </Provider>
  ) as React.ReactElement;
}
