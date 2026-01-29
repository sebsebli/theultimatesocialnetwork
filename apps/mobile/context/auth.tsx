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
import { registerForPush } from '../utils/push-notifications';

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

          // Re-register push token on launch
          registerForPush(token).catch(err => console.warn('Push registration failed', err));
        } catch (apiError: any) {
          const status = apiError?.status;
          // Log out when auth is invalid (401/403) or user no longer exists (404). Network/5xx/other → stay logged in (offline).
          if (status === 401 || status === 403 || status === 404) {
            await clearApiToken();
            setIsAuthenticated(false);
            setOnboardingComplete(null);
          } else {
            // Stored session valid; treat as offline but logged in
            if (__DEV__) {
              console.warn('Auth check failed (network/server error), staying logged in (offline mode)', apiError?.message ?? apiError);
            }
            setIsAuthenticated(true);
            const complete = await getOnboardingComplete();
            setOnboardingComplete(complete);
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
      setOnboardingComplete(null);
      router.replace('/welcome');
    });
  }, []);

  const signIn = async (token: string) => {
    await setApiToken(token);
    setIsAuthenticated(true);
    const complete = await getOnboardingComplete();
    setOnboardingComplete(complete);

    // Register push token
    registerForPush(token).catch(err => console.warn('Push registration failed', err));

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