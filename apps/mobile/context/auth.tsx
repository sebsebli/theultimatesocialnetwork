import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getAuthToken,
  setAuthToken as setApiToken,
  clearAuthToken as clearApiToken,
  setAuthErrorHandler,
  getOnboardingComplete,
  setOnboardingComplete as persistOnboardingComplete,
  clearOnboardingComplete as clearOnboardingCompleteStorage,
  api,
} from '../utils/api';
import { registerForPush } from '../utils/push-notifications';

interface AuthContextType {
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean | null;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => { },
  signOut: async () => { },
  completeOnboarding: async () => { },
  resetOnboarding: async () => { },
  isLoading: true,
  isAuthenticated: false,
  onboardingComplete: null,
  userId: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setOnboardingComplete(null);
          setUserId(null);
          setIsLoading(false);
          return;
        }

        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), 3000)
          );
          const me = await Promise.race([api.get('/users/me'), timeoutPromise]) as { id?: string; handle?: string; displayName?: string } | null;
          setIsAuthenticated(true);
          setUserId(me?.id ?? null);
          // Onboarding complete only if server has profile AND user completed onboarding in this app (storage)
          const serverComplete = !!(me?.handle && String(me.handle).trim() && me?.displayName && String(me.displayName).trim());
          const storedComplete = await getOnboardingComplete();
          setOnboardingComplete(serverComplete && storedComplete);

          // Re-register push token on launch
          registerForPush(token).catch(err => console.warn('Push registration failed', err));
        } catch (apiError: any) {
          const status = apiError?.status;
          // Log out when auth is invalid (401/403) or user no longer exists (404). Network/5xx/other → stay logged in (offline).
          if (status === 401 || status === 403 || status === 404) {
            await clearApiToken();
            setIsAuthenticated(false);
            setOnboardingComplete(null);
            setUserId(null);
          } else {
            // Stored session valid; treat as offline but logged in — use storage for onboarding state
            if (__DEV__) {
              console.warn('Auth check failed (network/server error), staying logged in (offline mode)', apiError?.message ?? apiError);
            }
            setIsAuthenticated(true);
            const storedComplete = await getOnboardingComplete();
            setOnboardingComplete(storedComplete);
          }
        }
      } catch (error) {
        setIsAuthenticated(false);
        setOnboardingComplete(null);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    setAuthErrorHandler(() => {
      setIsAuthenticated(false);
      setOnboardingComplete(null);
      setUserId(null);
      router.replace('/welcome');
    });
  }, []);

  const signIn = async (token: string) => {
    await setApiToken(token);
    setIsAuthenticated(true);
    // Always show onboarding after sign-in. Never skip to tabs — user must complete languages → profile → starter-packs.
    // (Returning users who already completed get tabs on next app open via checkAuth.)
    setOnboardingComplete(false);
    router.replace('/onboarding/languages');
    registerForPush(token).catch(err => console.warn('Push registration failed', err));
  };

  const signOut = async () => {
    await clearApiToken();
    await clearOnboardingCompleteStorage();
    setIsAuthenticated(false);
    setOnboardingComplete(null);
    setUserId(null);
    router.replace('/welcome');
  };

  const completeOnboarding = async () => {
    await persistOnboardingComplete();
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  };

  const resetOnboarding = async () => {
    await clearOnboardingCompleteStorage();
    setOnboardingComplete(null);
    router.replace('/onboarding/languages');
  };

  return (
    // @ts-ignore - React 19 compatibility
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        completeOnboarding,
        resetOnboarding,
        isLoading,
        isAuthenticated,
        onboardingComplete,
        userId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}