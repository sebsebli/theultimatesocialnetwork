"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

interface RealtimeContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadNotifications: number;
  clearUnreadNotifications: () => void;
  on: (event: string, callback: (data: unknown) => void) => void;
  off: (event: string, callback: (data: unknown) => void) => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
}

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const connectSocket = async () => {
      try {
        const res = await fetch("/api/auth/socket-token");
        if (!res.ok) return;
        const { token } = await res.json();

        const socketInstance = io(
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
          {
            auth: { token: `Bearer ${token}` },
            transports: ["websocket"],
          },
        );

        socketInstance.on("connect", () => {
          setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
        });

        socketInstance.on("notification", () => {
          setUnreadNotifications((prev) => prev + 1);
          toast("New notification", "info");
          router.refresh();
        });

        setSocket(socketInstance);

        return () => {
          socketInstance.disconnect();
        };
      } catch {
        // Silent fail
      }
    };

    connectSocket();
  }, [toast, router]);

  const on = (event: string, callback: (data: unknown) => void) => {
    if (socket) {
      socket.on(event, callback);
    }
  };

  const off = (event: string, callback: (data: unknown) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  const clearUnreadNotifications = () => setUnreadNotifications(0);

  return (
    <RealtimeContext.Provider
      value={{
        socket,
        isConnected,
        unreadNotifications,
        clearUnreadNotifications,
        on,
        off,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}
