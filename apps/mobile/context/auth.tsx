import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { getAuthToken, setAuthToken as setApiToken, clearAuthToken as clearApiToken, setAuthErrorHandler, api } from '../utils/api';

interface AuthContextType {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => { },
  signOut: async () => { },
  isLoading: true,
  isAuthenticated: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // CRITICAL: Validate token with API, don't just check if it exists
        // This ensures stale/invalid tokens are rejected
        // Add timeout to prevent hanging if API is unreachable
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 3000)
          );

          // Use the api client which handles the API URL correctly
          await Promise.race([
            api.get('/auth/me'),
            timeoutPromise
          ]);
          // If we get here, token is valid
          setIsAuthenticated(true);
        } catch (apiError: any) {
          // Timeout or network error - don't clear token, just assume not authenticated for now
          // This allows the app to load even if API is unreachable
          if (apiError?.message === 'Auth check timeout' || apiError?.status === 0) {
            if (__DEV__) {
              console.warn('Auth check failed (timeout/network), assuming not authenticated');
            }
            // Don't clear token on network error - might be temporary
            setIsAuthenticated(false);
          } else if (apiError?.status === 401 || apiError?.status === 403) {
            // 401/403 means token is invalid - clear it
            await clearApiToken();
            setIsAuthenticated(false);
          } else {
            // Other error - assume not authenticated to be safe
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Set up auth error handler for 401 responses
    // Just update state - let Redirect components in _layout.tsx handle navigation
    setAuthErrorHandler(() => {
      setIsAuthenticated(false);
    });
  }, []);


  const signIn = async (token: string) => {
    await setApiToken(token);
    setIsAuthenticated(true);
    router.replace('/(tabs)/');
  };

  const signOut = async () => {
    await clearApiToken();
    setIsAuthenticated(false);
    router.replace('/welcome');
  };

  return (
    // @ts-ignore - React 19 compatibility: Context.Provider returns ReactNode which may include undefined
    <AuthContext.Provider value={{ signIn, signOut, isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}
