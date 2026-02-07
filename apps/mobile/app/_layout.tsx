import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  IBMPlexSerif_400Regular,
  IBMPlexSerif_600SemiBold,
} from "@expo-google-fonts/ibm-plex-serif";
import { Stack, useSegments, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import "../i18n";
import { configureNotifications } from "../utils/push-notifications";
import { COLORS } from "../constants/theme";
import { AuthProvider, useAuth } from "../context/auth";
import { ToastProvider, useToast } from "../context/ToastContext";
import { ExternalLinkProvider } from "../context/ExternalLinkContext";
import { SocketProvider } from "../context/SocketContext";
import { DraftProvider } from "../context/DraftContext";
import { SettingsProvider } from "../context/SettingsContext";
import { PostActionProvider } from "../context/PostActionContext";
import { ExplorationTrailProvider } from "../context/ExplorationTrailContext";
import { setApiErrorToastHandler } from "../utils/api";
import { View } from "react-native";
import { FullScreenSkeleton } from "../components/LoadingSkeleton";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ErrorFallbackWithNav } from "../components/ErrorFallbackWithNav";
import { OfflineBanner } from "../components/OfflineBanner";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { SafeAreaProvider } from "react-native-safe-area-context";

import * as NavigationBar from "expo-navigation-bar";
import { Platform, Linking } from "react-native";
import * as Notifications from "expo-notifications";

/** Allowed deep-link schemes. Only open links matching these to prevent open-redirect attacks. */
const ALLOWED_DEEP_LINK_SCHEMES = [
  "citewalk://",
  "https://citewalk.com",
  "https://www.citewalk.com",
];

function isAllowedDeepLink(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return ALLOWED_DEEP_LINK_SCHEMES.some((scheme) => url.startsWith(scheme));
}

// Prevent the splash screen from auto-hiding before asset loading is complete.

/** Registers global API error handler so every API failure shows a toast; never signs out the user. */
function ApiErrorToastRegistration() {
  const { showError } = useToast();
  useEffect(() => {
    setApiErrorToastHandler(showError);
    return () => setApiErrorToastHandler(null);
  }, [showError]);
  return null;
}

function AppContent({ onReady }: { onReady?: () => void }) {
  const { isLoading, isAuthenticated, onboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useOfflineSync(); // Sync offline actions when online

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(COLORS.ink);
    }
  }, []);

  // Notify parent when the app is ready (auth loaded and route is ready)
  const hasNotifiedReady = useRef(false);
  useEffect(() => {
    if (!isLoading && segments[0] && onReady && !hasNotifiedReady.current) {
      // Small delay to ensure the screen is fully rendered (especially for intro modal)
      const timer = setTimeout(() => {
        if (!hasNotifiedReady.current) {
          hasNotifiedReady.current = true;
          onReady();
        }
      }, 500); // Longer delay to ensure intro modal check completes
      return () => clearTimeout(timer);
    }
  }, [isLoading, segments, onReady]);

  // Fallback: If segments are empty after 1s and user is authenticated, navigate by onboarding state
  // So we always show onboarding (language etc.) when not complete, never jump straight to tabs
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Check if we're already on a public route
      const isPublicRoute =
        segments[0] === "welcome" ||
        segments[0] === "sign-in" ||
        segments[0] === "waiting-list";
      if (!isPublicRoute) {
        router.replace("/welcome");
      }
    }
  }, [isLoading, isAuthenticated, onboardingComplete, segments, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <FullScreenSkeleton />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // Standard iOS-like transition
        presentation: "card",
        contentStyle: { backgroundColor: COLORS.ink },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
      <Stack.Screen name="welcome" options={{ animation: "fade" }} />
      <Stack.Screen
        name="onboarding"
        options={{ animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="post/compose"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen name="post/[id]" options={{ presentation: "card" }} />
      <Stack.Screen name="topic/[slug]" options={{ presentation: "card" }} />
      <Stack.Screen
        name="collections/[id]"
        options={{ presentation: "card" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    IBMPlexSerif_400Regular,
    IBMPlexSerif_600SemiBold,
  });

  // Track if we've already hidden the splash screen to prevent multiple calls
  const appReady = useRef(false);

  // Callback when app is ready (auth loaded + route ready)
  const handleAppReady = useCallback(() => {
    if (!appReady.current) {
      appReady.current = true;
    }
  }, []);

  useEffect(() => {
    // Configure notification handler (non-blocking)
    try {
      configureNotifications();
    } catch {
      if (__DEV__) console.warn("Failed to configure notifications");
    }

    // Handle notification taps — validate deep link before opening
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        try {
          const deepLink = response.notification.request.content.data?.deepLink;
          if (typeof deepLink === "string" && isAllowedDeepLink(deepLink)) {
            Linking.openURL(deepLink);
          } else if (__DEV__ && deepLink) {
            console.warn("Blocked untrusted deep link:", deepLink);
          }
        } catch {
          if (__DEV__) console.warn("Failed to handle notification tap");
        }
      },
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const MyDarkTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: COLORS.ink,
        text: COLORS.paper,
        primary: COLORS.primary,
        card: COLORS.ink,
        border: COLORS.divider,
      },
    }),
    [],
  );

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.ink} />
      <ErrorBoundary fallback={<ErrorFallbackWithNav />}>
        <AuthProvider>
          <ToastProvider>
            <ExternalLinkProvider>
              <ApiErrorToastRegistration />
              <SocketProvider>
                <SettingsProvider>
                  <DraftProvider>
                    <PostActionProvider>
                      <ExplorationTrailProvider>
                        <ThemeProvider value={MyDarkTheme}>
                          <View
                            style={{ flex: 1, backgroundColor: COLORS.ink }}
                          >
                            <OfflineBanner />
                            <AppContent onReady={handleAppReady} />
                          </View>
                        </ThemeProvider>
                      </ExplorationTrailProvider>
                    </PostActionProvider>
                  </DraftProvider>
                </SettingsProvider>
              </SocketProvider>
            </ExternalLinkProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
