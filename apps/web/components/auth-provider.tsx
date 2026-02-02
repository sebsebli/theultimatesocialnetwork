"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: Record<string, unknown> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signOut: async () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      setUser(null);
      router.push("/");
    }
  };

  const isAuthenticated = !!user;

  // Redirect logic for client-side navigation.
  // Unauthenticated: only protected routes redirect to "/" (landing). Root always shows landing.
  // Authenticated on landing/sign-in: redirect to /home.
  useEffect(() => {
    if (isLoading) return;

    const landingAndPublicRoutes = [
      "/",
      "/welcome",
      "/sign-in",
      "/verify",
      "/privacy",
      "/terms",
      "/imprint",
      "/ai-transparency",
      "/roadmap",
      "/manifesto",
      "/waiting-list",
    ];
    const isPublicRoute =
      landingAndPublicRoutes.includes(pathname) ||
      pathname === "" ||
      pathname.startsWith("/verify") ||
      pathname.startsWith("/waiting-list") ||
      pathname.startsWith("/invite/");

    if (!isAuthenticated && !isPublicRoute) {
      router.replace("/");
    } else if (
      isAuthenticated &&
      (pathname === "/" || pathname === "/welcome" || pathname === "/sign-in")
    ) {
      router.replace("/home");
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, signOut, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
