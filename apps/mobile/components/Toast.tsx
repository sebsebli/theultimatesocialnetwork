import React, { useEffect, useRef } from 'react';
import { Text, Animated, ViewStyle, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, SIZES, HEADER, createStyles } from '../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type, onHide, duration = 3000 }: ToastProps) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide();
      });
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'error-outline';
      default: return 'info-outline';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { bg: COLORS.ink, border: COLORS.primary, text: COLORS.paper, icon: COLORS.primary };
      case 'error': return { bg: COLORS.ink, border: COLORS.error, text: COLORS.paper, icon: COLORS.error };
      default: return { bg: COLORS.ink, border: COLORS.divider, text: COLORS.paper, icon: COLORS.secondary };
    }
  };

  const colors = getColors();
  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.container,
        { 
          opacity, 
          transform: [{ translateY }],
          top: insets.top + SPACING.l,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        }
      ]}
    >
      <MaterialIcons name={getIcon()} size={HEADER.iconSize} color={colors.icon} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </AnimatedView>
  );
}

const styles = createStyles({
  container: {
    position: 'absolute',
    left: SPACING.l,
    right: SPACING.l,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
});
