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
import { Stack, useSegments, Redirect, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import '../i18n';
// Note: Reanimated is installed but not actively used in this app.
// The babel plugin is configured for potential future use.
// We don't import it here to avoid worklets version mismatch errors in Expo Go.
import { configureNotifications } from '../utils/push-notifications';
import { COLORS } from '../constants/theme';
import { AuthProvider, useAuth } from '../context/auth';
import { View, ActivityIndicator, Text } from 'react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading, isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useOfflineSync(); // Sync offline actions when online

  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(COLORS.ink);
    }
  }, []);

  // Fallback: If segments are empty after 1 second and user is authenticated, navigate to tabs
  // This handles the case where router isn't ready immediately
  useEffect(() => {
    if (!isLoading && isAuthenticated && !segments[0]) {
      const timeout = setTimeout(() => {
        if (!segments[0]) {
          if (__DEV__) {
            console.log('Segments still empty, forcing navigation to tabs');
          }
          router.replace('/(tabs)/');
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [isLoading, isAuthenticated, segments, router]);

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

  // Get current route segment
  const currentSegment = segments[0];
  const isPublicRoute = currentSegment === 'welcome' || currentSegment === 'sign-in' || currentSegment === 'onboarding';

  // Use Redirect components for declarative navigation
  // Only redirect if we have a segment (router is ready)
  if (currentSegment) {
    if (!isAuthenticated && !isPublicRoute) {
      if (__DEV__) {
        console.log('Redirecting to welcome (not authenticated, not on public route)');
      }
      return <Redirect href="/welcome" />;
    }

    if (isAuthenticated && (currentSegment === 'welcome' || currentSegment === 'sign-in')) {
      if (__DEV__) {
        console.log('Redirecting to tabs (authenticated, on public route)');
      }
      return <Redirect href="/(tabs)/" />;
    }
  }

  // Always render the Stack - it handles initial routing
  // Always start with welcome - redirects will handle authenticated users
  if (__DEV__) {
    console.log('Rendering Stack - always starting with welcome, isAuthenticated:', isAuthenticated);
  }

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName="welcome"
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="sign-in" />
      {/* onboarding routes are handled automatically by Expo Router file-based routing */}
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="post/[id]" />
      <Stack.Screen name="topic/[slug]" />
      <Stack.Screen name="user/[handle]" />
      <Stack.Screen name="collections" />
      <Stack.Screen name="collections/[id]" />
      <Stack.Screen name="keeps" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="search" />
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
  const splashScreenHidden = useRef(false);

  const hideSplashScreen = async () => {
    // Only hide once - prevent multiple calls
    if (splashScreenHidden.current) {
      return;
    }
    splashScreenHidden.current = true;

    try {
      // Small delay to ensure native view controller is ready (especially on iOS)
      await new Promise(resolve => setTimeout(resolve, Platform.OS === 'ios' ? 200 : 100));
      await SplashScreen.hideAsync();
    } catch (error) {
      // Silently ignore splash screen errors - they're not critical
      // This can happen in Expo Go or when the native view controller isn't ready
      if (__DEV__) {
        console.warn('Splash screen hide error (non-critical):', error);
      }
      // Reset the flag so we can try again if needed
      splashScreenHidden.current = false;
    }
  };

  useEffect(() => {
    // Configure notification handler (non-blocking)
    try {
      configureNotifications();
    } catch (error) {
      console.warn('Failed to configure notifications:', error);
    }

    // Hide splash screen after fonts load or error
    if (loaded || error) {
      hideSplashScreen();
    }
  }, [loaded, error]);

  // Fallback: hide splash screen after 2 seconds even if fonts haven't loaded
  // This prevents the app from being stuck on splash screen
  useEffect(() => {
    const timeout = setTimeout(() => {
      hideSplashScreen();
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, []);

  // Don't block rendering on fonts - show app with system fonts as fallback
  // This ensures the app always renders something
  if (__DEV__) {
    console.log('RootLayout render:', { loaded, error });
  }

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
          <ThemeProvider value={MyDarkTheme}>
            <View style={{ flex: 1, backgroundColor: COLORS.ink }}>
              <OfflineBanner />
              <AppContent />
            </View>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}