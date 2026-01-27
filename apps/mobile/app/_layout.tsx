import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  IBMPlexSerif_400Regular,
  IBMPlexSerif_600SemiBold,
} from '@expo-google-fonts/ibm-plex-serif';
import { Stack, useSegments, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import '../i18n';
// Note: Reanimated is installed but not actively used in this app.
// The babel plugin is configured for potential future use.
// We don't import it here to avoid worklets version mismatch errors in Expo Go.
import { configureNotifications } from '../utils/push-notifications';
import { COLORS } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/auth';
import { ToastProvider } from '../context/ToastContext';
import { SocketProvider } from '../context/SocketContext';
import { View, ActivityIndicator, Text } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as NavigationBar from 'expo-navigation-bar';
import { Platform, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

// Prevent the splash screen from auto-hiding before asset loading is complete.

function AppContent({ onReady }: { onReady?: () => void }) {
  const { isLoading, isAuthenticated, onboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useOfflineSync(); // Sync offline actions when online

  useEffect(() => {
    if (Platform.OS === 'android') {
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
    if (!isLoading && isAuthenticated && !segments[0]) {
      const timeout = setTimeout(() => {
        if (!segments[0]) {
          if (__DEV__) {
            console.log('Segments still empty, forcing navigation');
          }
          if (onboardingComplete === true) {
            router.replace('/(tabs)/');
          } else {
            router.replace('/onboarding/languages');
          }
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, onboardingComplete, segments, router]);

  // Debug logging
  if (__DEV__) {
    console.log('AppContent render:', { isLoading, isAuthenticated, segments: segments[0] });
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.ink, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{
      headerShown: false,
      animation: 'slide_from_right', // Standard iOS-like transition
      presentation: 'card',
      contentStyle: { backgroundColor: COLORS.ink },
    }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen
        name="post/compose"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
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
  const handleAppReady = () => {
    if (!appReady.current) {
      appReady.current = true;
    }
  };

  useEffect(() => {
    // Configure notification handler (non-blocking)
    try {
      configureNotifications();
    } catch (error) {
      console.warn('Failed to configure notifications:', error);
    }

    // Handle notification taps
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      try {
        const deepLink = response.notification.request.content.data.deepLink;
        if (deepLink) {
          Linking.openURL(deepLink as string);
        }
      } catch (e) {
        console.error('Failed to handle notification tap:', e);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const MyDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: COLORS.ink,
      text: COLORS.paper,
      primary: COLORS.primary,
      card: COLORS.ink,
      border: COLORS.divider,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={COLORS.ink} />
      <ErrorBoundary
        fallback={
          <View style={{ flex: 1, backgroundColor: COLORS.ink, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ color: COLORS.paper, fontSize: 16, textAlign: 'center' }}>
              App failed to load. Check console for errors.
            </Text>
          </View>
        }
      >
        <AuthProvider>
          <ToastProvider>
            <SocketProvider>
              <ThemeProvider value={MyDarkTheme}>
                <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
                  <OfflineBanner />
                  <AppContent onReady={handleAppReady} />
                </View>
              </ThemeProvider>
            </SocketProvider>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
