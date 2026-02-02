import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  getAuthToken,
  setAuthToken as setApiToken,
  clearAuthToken as clearApiToken,
  getOnboardingComplete,
  setOnboardingComplete as persistOnboardingComplete,
  clearOnboardingComplete as clearOnboardingCompleteStorage,
  setOnUnauthorized,
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
  const signOutRef = useRef<() => Promise<void>>(() => Promise.resolve());

  // When any API returns 401 (invalid/expired token or revoked session), sign out and go to welcome
  useEffect(() => {
    setOnUnauthorized(() => signOutRef.current?.());
    return () => setOnUnauthorized(null);
  }, []);

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
          const me = await Promise.race([api.get('/users/me'), timeoutPromise]) as { id?: string; needsOnboarding?: boolean } | null;
          setIsAuthenticated(true);
          setUserId(me?.id ?? null);
          // Server tells us if user still needs onboarding (placeholder profile); also respect local completion
          const needsOnboarding = me?.needsOnboarding === true;
          const storedComplete = await getOnboardingComplete();
          setOnboardingComplete(!needsOnboarding && storedComplete);

          // Re-register push token on launch
          registerForPush(token).catch(err => console.warn('Push registration failed', err));
        } catch (apiError: any) {
          const status = apiError?.status;
          const message = String(apiError?.message ?? '').toLowerCase();
          const userNoLongerExists = status === 404 || message.includes('user no longer exists');
          // Backend: GET /users/me returns 401 (invalid/expired/revoked token), 404 "User no longer exists" (deleted account).
          // Sign out and go to welcome for both; otherwise treat as offline and keep session.
          if (status === 401 || userNoLongerExists) {
            await clearApiToken();
            await clearOnboardingCompleteStorage();
            setIsAuthenticated(false);
            setOnboardingComplete(null);
            setUserId(null);
            router.replace('/welcome');
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
    // Never sign out on API errors – only on explicit Sign out or when /users/me returns 401 on app load
  }, []);

  const signIn = async (token: string) => {
    await setApiToken(token);
    setIsAuthenticated(true);
    registerForPush(token).catch(err => console.warn('Push registration failed', err));

    // If server says profile complete (not placeholder), treat as returning user and go to home
    try {
      const me = await api.get('/users/me') as { id?: string; needsOnboarding?: boolean } | null;
      setUserId(me?.id ?? null);
      if (me?.needsOnboarding !== true) {
        await persistOnboardingComplete();
        setOnboardingComplete(true);
        router.replace('/(tabs)/');
        return;
      }
    } catch (_) {
      // Network or auth error: continue to onboarding
    }
    setOnboardingComplete(false);
    // Onboarding index will redirect to the correct stage (languages / profile / starter-packs)
    router.replace('/onboarding');
  };

  const signOut = async () => {
    await clearApiToken();
    await clearOnboardingCompleteStorage();
    setIsAuthenticated(false);
    setOnboardingComplete(null);
    setUserId(null);
    router.replace('/welcome');
  };
  signOutRef.current = signOut;

  const completeOnboarding = async () => {
    await persistOnboardingComplete();
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  };

  const resetOnboarding = async () => {
    await clearOnboardingCompleteStorage();
    setOnboardingComplete(null);
    router.replace('/onboarding');
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