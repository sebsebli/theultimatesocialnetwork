import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT } from '../constants/theme';

export interface EmptyStateProps {
  /** Icon name from MaterialIcons, or 'none' to hide */
  icon?: string;
  headline: string;
  subtext?: string;
  /** Optional primary action */
  actionLabel?: string;
  onAction?: () => void;
  /** Optional secondary action (e.g. "Explore") */
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Extra content below (e.g. suggestion list) */
  children?: React.ReactNode;
  /** Tighter padding (e.g. home feed empty state) */
  compact?: boolean;
}

/**
 * Modern empty state used everywhere: home, explore, profile, search, lists.
 * Minimal, social-network style: icon + headline + subtext + optional actions.
 */
export function EmptyState({
  icon = 'inbox',
  headline,
  subtext,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  children,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon !== 'none' && (
        <View style={styles.iconWrap}>
          <MaterialIcons name={icon} size={HEADER.iconSize} color={COLORS.tertiary} />
        </View>
      )}
      <Text style={styles.headline}>{headline}</Text>
      {subtext ? <Text style={styles.subtext}>{subtext}</Text> : null}
      {(actionLabel || secondaryLabel) && (
        <View style={styles.actions}>
          {actionLabel && onAction && (
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              onPress={onAction}
            >
              <Text style={styles.primaryBtnText}>{actionLabel}</Text>
            </Pressable>
          )}
          {secondaryLabel && onSecondary && (
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
              onPress={onSecondary}
            >
              <Text style={styles.secondaryBtnText}>{secondaryLabel}</Text>
            </Pressable>
          )}
        </View>
      )}
      {children ? <View style={[styles.extra, compact && styles.extraCompact]}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xxl,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  containerCompact: {
    paddingVertical: SPACING.l,
    minHeight: 120,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.l,
  },
  headline: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  subtext: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: SPACING.l,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.m,
    justifyContent: 'center',
  },
  primaryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
    backgroundColor: COLORS.primary,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  secondaryBtn: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  btnPressed: {
    opacity: 0.85,
  },
  extra: {
    width: '100%',
    marginTop: SPACING.l,
  },
  extraCompact: {
    marginTop: SPACING.m,
  },
});
