import React, { memo } from 'react';
import { Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, SIZES, HEADER, LAYOUT, createStyles } from '../constants/theme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  /** Dismiss the error screen (e.g. show empty state or go back). */
  onDismiss?: () => void;
}

function ErrorStateInner({ message = 'Something went wrong', onRetry, onDismiss }: ErrorStateProps) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons name="error-outline" size={HEADER.iconSize} color={COLORS.error} />
      </View>
      <Text style={styles.title}>Oops!</Text>
      <Text style={styles.text}>{message}</Text>
      <View style={styles.actions}>
        {onRetry && (
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.button,
              styles.buttonPrimary,
              pressed && styles.buttonPressed
            ]}
            onPress={onRetry}
          >
            <Text style={styles.buttonText}>{t('common.tryAgain')}</Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            style={({ pressed }: { pressed: boolean }) => [
              styles.button,
              styles.buttonSecondary,
              pressed && styles.buttonPressed
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.buttonTextSecondary}>{t('common.dismiss', 'Dismiss')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export const ErrorState = memo(ErrorStateInner as React.FunctionComponent<ErrorStateProps>) as (props: ErrorStateProps) => React.ReactElement | null;

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
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  text: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    lineHeight: 24,
    maxWidth: 280,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.m,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  button: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    fontWeight: '600',
  },
});
