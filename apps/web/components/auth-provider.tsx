'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: any | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user', error);
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
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to sign out', error);
    } finally {
      setUser(null);
      router.push('/');
    }
  };

  const isAuthenticated = !!user;

  // Redirect logic for client-side navigation
  useEffect(() => {
    if (isLoading) return;

    const publicRoutes = ['/', '/welcome', '/sign-in', '/verify', '/privacy', '/terms', '/imprint', '/ai-transparency', '/roadmap', '/manifesto'];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/verify');

    if (!isAuthenticated && !isPublicRoute) {
      router.replace('/');
    } else if (isAuthenticated && (pathname === '/' || pathname === '/welcome' || pathname === '/sign-in')) {
      router.replace('/home');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
