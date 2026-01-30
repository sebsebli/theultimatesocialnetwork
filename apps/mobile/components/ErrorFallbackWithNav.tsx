import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';

/**
 * Shown when ErrorBoundary catches an error. Provides "Go to Home" so the user
 * is never stuck without navigation. We do NOT sign the user out on app error —
 * auth state is preserved so they can go home and retry.
 */
export function ErrorFallbackWithNav() {
  const router = useRouter();

  const goHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="error-outline" size={HEADER.iconSize} color={COLORS.error} />
        </View>
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>
        An unexpected error occurred. You can go back to Home and try again.
      </Text>
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [styles.button, pressed && { opacity: 0.8 }]}
        onPress={goHome}
      >
        <MaterialIcons name="home" size={HEADER.iconSize} color={COLORS.ink} />
        <Text style={styles.buttonText}>Go to Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    backgroundColor: COLORS.ink,
  },
  iconContainer: {
    marginBottom: SPACING.l,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  message: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 160,
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
});
