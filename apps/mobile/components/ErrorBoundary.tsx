import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../constants/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) console.error('ErrorBoundary caught an error:', error, errorInfo);
    // In production, send to crash reporting service (e.g. Sentry)
  }

  handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <View style={styles.container}>
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="error-outline" size={HEADER.iconSize} color={COLORS.error} />
          </View>
        </View>
        <Text style={styles.title}>System Interrupt</Text>
        <Text style={styles.message}>
          An unexpected error occurred. This has been logged for review.
        </Text>
        <Pressable
          style={({ pressed }: { pressed: boolean }) => [styles.button, pressed && { opacity: 0.8 }]}
          onPress={this.handleReset}
          accessibilityRole="button"
          accessibilityLabel="Reload interface"
        >
          <Text style={styles.buttonText}>Reload interface</Text>
        </Pressable>
      </View> as ReactNode;
    }

    return this.props.children;
  }
}

const styles = createStyles({
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
});
