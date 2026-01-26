'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export function useRealtime() {
  return useContext(RealtimeContext);
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // We need to pass the JWT token for authentication
    // Assuming we can get it from a cookie or localStorage.
    // In next.js app router client components, cookies are accessible via document.cookie if not HttpOnly,
    // but we made them HttpOnly. 
    // Wait, if cookies are HttpOnly, we cannot read them in JS.
    // We need an endpoint to get the token or pass it from a server component.
    // OR we rely on the API to extract it from the handshake headers?
    // Socket.io supports `extraHeaders`. If the cookie is sent automatically?
    // WebSockets don't automatically send cookies in all browsers/scenarios, but usually yes for same-origin.
    // However, our API might be on a different port/domain in dev.
    // If API is proxyied via Next.js rewrites, cookies might pass.
    
    // For now, let's assume we can fetch a temporary token or use the HttpOnly cookie flow 
    // if the socket connects to the same origin.
    // But NestJS Gateway expects Bearer token in auth payload or headers.
    
    // Let's create an API endpoint `/api/auth/token` (Next.js) that retrieves the HttpOnly cookie 
    // and returns it (only if we decide to expose it to client for socket, which defeats the purpose of HttpOnly for XSS).
    // BETTER: Use session-based auth for socket? 
    // OR: Just let the socket connection fail if not authenticated?
    
    // Actually, for "production-grade", HttpOnly is strictly for HTTP.
    // For WebSockets, we often need a ticket system or we compromise and expose a short-lived token.
    
    // Let's assume we fetch a "socket token" from our Next.js API (which reads the HttpOnly cookie).
    
    const connectSocket = async () => {
      try {
        const res = await fetch('/api/auth/socket-token'); // We need to create this
        if (!res.ok) return;
        const { token } = await res.json();

        const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', {
          auth: { token: `Bearer ${token}` },
          transports: ['websocket'],
        });

        socketInstance.on('connect', () => {
          setIsConnected(true);
          console.log('Socket connected');
        });

        socketInstance.on('disconnect', () => {
          setIsConnected(false);
          console.log('Socket disconnected');
        });

        socketInstance.on('notification', (data) => {
          toast('New notification', 'info');
          router.refresh();
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch (e) {
        console.error('Socket connection failed', e);
      }
    };

    connectSocket();
  }, [toast, router]);

  return (
    <RealtimeContext.Provider value={{ socket, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  );
}
