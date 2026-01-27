import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getAuthToken,
  setAuthToken as setApiToken,
  clearAuthToken as clearApiToken,
  setAuthErrorHandler,
  getOnboardingComplete,
  setOnboardingComplete as persistOnboardingComplete,
  api,
} from '../utils/api';

interface AuthContextType {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean | null;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => { },
  signOut: async () => { },
  completeOnboarding: async () => { },
  isLoading: true,
  isAuthenticated: false,
  onboardingComplete: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setOnboardingComplete(null);
          setIsLoading(false);
          return;
        }

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 3000)
          );
          await Promise.race([api.get('/users/me'), timeoutPromise]);
          setIsAuthenticated(true);
          const complete = await getOnboardingComplete();
          setOnboardingComplete(complete);
        } catch (apiError: any) {
          if (apiError?.message === 'Auth check timeout' || apiError?.status === 0) {
            if (__DEV__) {
              console.warn('Auth check failed (timeout/network), assuming not authenticated');
            }
            setIsAuthenticated(false);
            setOnboardingComplete(null);
          } else if (apiError?.status === 401 || apiError?.status === 403) {
            await clearApiToken();
            setIsAuthenticated(false);
            setOnboardingComplete(null);
          } else {
            setIsAuthenticated(false);
            setOnboardingComplete(null);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setOnboardingComplete(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    setAuthErrorHandler(() => {
      setIsAuthenticated(false);
    });
  }, []);

  const signIn = async (token: string) => {
    await setApiToken(token);
    setIsAuthenticated(true);
    const complete = await getOnboardingComplete();
    setOnboardingComplete(complete);
    if (complete) {
      router.replace('/(tabs)/');
    } else {
      router.replace('/onboarding/languages');
    }
  };

  const signOut = async () => {
    await clearApiToken();
    setIsAuthenticated(false);
    setOnboardingComplete(null);
    router.replace('/welcome');
  };

  const completeOnboarding = async () => {
    await persistOnboardingComplete();
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  };

  return (
    // @ts-ignore - React 19 compatibility
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        completeOnboarding,
        isLoading,
        isAuthenticated,
        onboardingComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
