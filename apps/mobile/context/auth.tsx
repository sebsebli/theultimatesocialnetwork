import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import {
  getAuthToken,
  setAuthToken as setApiToken,
  clearAuthToken as clearApiToken,
  setRefreshToken as setApiRefreshToken,
  clearRefreshToken as clearApiRefreshToken,
  getRefreshToken as getApiRefreshToken,
  getOnboardingComplete,
  setOnboardingComplete as persistOnboardingComplete,
  clearOnboardingComplete as clearOnboardingCompleteStorage,
  setOnUnauthorized,
  api,
  ApiError,
} from '../utils/api';
import { registerForPush } from '../utils/push-notifications';

/** Auth check timeout – generous to handle slow mobile networks. */
const AUTH_CHECK_TIMEOUT_MS = 8_000;

interface MeResponse {
  id?: string;
  needsOnboarding?: boolean;
}

interface AuthContextType {
  signIn: (token: string, refreshToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingComplete: boolean | null;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
  completeOnboarding: async () => {},
  resetOnboarding: async () => {},
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
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          if (!cancelled) {
            setIsAuthenticated(false);
            setOnboardingComplete(null);
            setUserId(null);
            setIsLoading(false);
          }
          return;
        }

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Auth check timeout')), AUTH_CHECK_TIMEOUT_MS)
          );
          const me = await Promise.race([
            api.get<MeResponse>('/users/me'),
            timeoutPromise,
          ]);
          if (cancelled) return;

          setIsAuthenticated(true);
          setUserId(me?.id ?? null);
          // Server tells us if user still needs onboarding (placeholder profile); also respect local completion
          const needsOnboarding = me?.needsOnboarding === true;
          const storedComplete = await getOnboardingComplete();
          setOnboardingComplete(!needsOnboarding && storedComplete);

          // Re-register push token on launch (non-blocking)
          registerForPush(token).catch((err) => {
            if (__DEV__) console.warn('Push registration failed', err);
          });
        } catch (apiError: unknown) {
          if (cancelled) return;
          const status = apiError instanceof ApiError ? apiError.status : undefined;
          const message = String(
            apiError instanceof Error ? apiError.message : ''
          ).toLowerCase();
          const userNoLongerExists = status === 404 || message.includes('user no longer exists');
          // Backend: GET /users/me returns 401 (invalid/expired/revoked token), 404 "User no longer exists" (deleted account).
          // Sign out and go to welcome for both; otherwise treat as offline and keep session.
          if (status === 401 || userNoLongerExists) {
            await clearApiToken();
            await clearApiRefreshToken();
            await clearOnboardingCompleteStorage();
            setIsAuthenticated(false);
            setOnboardingComplete(null);
            setUserId(null);
            router.replace('/welcome');
          } else {
            // Stored session valid; treat as offline but logged in — use storage for onboarding state
            if (__DEV__) {
              console.warn('Auth check failed (network/server error), staying logged in (offline mode)', message);
            }
            setIsAuthenticated(true);
            const storedComplete = await getOnboardingComplete();
            setOnboardingComplete(storedComplete);
          }
        }
      } catch {
        if (!cancelled) {
          setIsAuthenticated(false);
          setOnboardingComplete(null);
          setUserId(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAuth();
    return () => { cancelled = true; };
  }, [router]);

  // Re-validate session when app returns to foreground
  useEffect(() => {
    const handleAppState = (state: AppStateStatus) => {
      if (state === 'active' && isAuthenticated) {
        // Lightweight check — if it fails with 401 the global handler will sign out
        api.get('/users/me').catch(() => { /* session warm-up best-effort */ });
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated]);

  const signIn = useCallback(async (token: string, refreshToken?: string) => {
    await setApiToken(token);
    if (refreshToken) {
      await setApiRefreshToken(refreshToken);
    }
    setIsAuthenticated(true);
    registerForPush(token).catch((err) => {
      if (__DEV__) console.warn('Push registration failed', err);
    });

    // If server says profile complete (not placeholder), treat as returning user and go to home
    try {
      const me = await api.get<MeResponse>('/users/me');
      setUserId(me?.id ?? null);
      if (me?.needsOnboarding !== true) {
        await persistOnboardingComplete();
        setOnboardingComplete(true);
        router.replace('/(tabs)/');
        return;
      }
    } catch {
      // Network or auth error: continue to onboarding
    }
    setOnboardingComplete(false);
    router.replace('/onboarding');
  }, [router]);

  const signOut = useCallback(async () => {
    // Revoke refresh token on server (best-effort)
    try {
      const refreshToken = await getApiRefreshToken();
      if (refreshToken) {
        api.post('/auth/logout', { refreshToken }).catch(() => { /* server-side logout best-effort */ });
      }
    } catch {
      // ignore
    }
    await clearApiToken();
    await clearApiRefreshToken();
    await clearOnboardingCompleteStorage();
    setIsAuthenticated(false);
    setOnboardingComplete(null);
    setUserId(null);
    router.replace('/welcome');
  }, [router]);

  // Keep signOutRef in sync for the global 401 handler
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  const completeOnboarding = useCallback(async () => {
    await persistOnboardingComplete();
    setOnboardingComplete(true);
    router.replace('/(tabs)/');
  }, [router]);

  const resetOnboarding = useCallback(async () => {
    await clearOnboardingCompleteStorage();
    setOnboardingComplete(null);
    router.replace('/onboarding');
  }, [router]);

  const value = useMemo<AuthContextType>(
    () => ({
      signIn,
      signOut,
      completeOnboarding,
      resetOnboarding,
      isLoading,
      isAuthenticated,
      onboardingComplete,
      userId,
    }),
    [signIn, signOut, completeOnboarding, resetOnboarding, isLoading, isAuthenticated, onboardingComplete, userId],
  );

  return (
    // @ts-expect-error React 19 JSX return type compatibility
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}