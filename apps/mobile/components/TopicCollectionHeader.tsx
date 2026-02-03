import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../constants/theme';

export type TopicCollectionType = 'topic' | 'collection';

export interface TopicCollectionHeaderProps {
  type: TopicCollectionType;
  title: string;
  description?: string | null;
  onBack: () => void;
  onAction?: () => void;
  actionLabel?: string;
  isActionActive?: boolean;
  /** Topic: post count & contributor count. Collection: optional. */
  metrics?: { postCount?: number; contributorCount?: number; itemCount?: number };
  /** Show search icon (topic), more menu (collection), or nothing. */
  rightAction?: 'search' | 'more' | null;
  onRightAction?: () => void;
  children?: React.ReactNode;
}

/**
 * Shared header for Topic and Collection screens:
 * - Optional hero image (from a random post when available)
 * - Title and optional description
 * - Back button, optional primary action (Follow / Share)
 * - Optional metrics row
 * - Children e.g. tabs (topic) or extra content
 */
function TopicCollectionHeaderInner({
  type,
  title,
  description,
  onBack,
  onAction,
  actionLabel,
  isActionActive,
  metrics,
  rightAction,
  onRightAction,
  children,
}: TopicCollectionHeaderProps) {
  const typeLabel = type === 'topic' ? 'TOPIC' : 'COLLECTION';

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View style={styles.headerBar}>
          <Pressable
            onPress={onBack}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
            </View>
          </Pressable>
          <View style={styles.headerBarSpacer} />
          {rightAction === 'search' && onRightAction && (
            <Pressable style={styles.rightButton} onPress={onRightAction}>
              <View style={styles.iconCircle}>
                <MaterialIcons name="search" size={HEADER.iconSize} color={HEADER.iconColor} />
              </View>
            </Pressable>
          )}
          {rightAction === 'more' && onRightAction && (
            <Pressable style={styles.rightButton} onPress={onRightAction} accessibilityLabel="More options">
              <View style={styles.iconCircle}>
                <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={HEADER.iconColor} />
              </View>
            </Pressable>
          )}
        </View>
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            <Text style={styles.title}>{title}</Text>
            {metrics && (metrics.postCount != null || metrics.contributorCount != null || metrics.itemCount != null) && (
              <View style={styles.metricsRow}>
                {(metrics.postCount != null || metrics.itemCount != null) && (
                  <Text style={styles.metricText}>
                    {(metrics.postCount ?? metrics.itemCount ?? 0).toLocaleString()} {type === 'collection' ? 'items' : 'posts'}
                  </Text>
                )}
                {metrics.contributorCount != null && type === 'topic' && (
                  <>
                    {(metrics.postCount != null || metrics.itemCount != null) && (
                      <Text style={styles.metricText}> • </Text>
                    )}
                    <Text style={styles.metricText}>
                      {metrics.contributorCount.toLocaleString()} contributors
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>
          {onAction && actionLabel && (
            <Pressable
              style={[styles.actionButton, isActionActive && styles.actionButtonActive]}
              onPress={onAction}
            >
              <Text style={[styles.actionButtonText, isActionActive && styles.actionButtonTextActive]}>
                {actionLabel}
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {description ? (
        <View style={styles.descriptionBlock}>
          <View style={styles.descriptionBorder} />
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      ) : null}

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

export const TopicCollectionHeader = memo(TopicCollectionHeaderInner as React.FunctionComponent<TopicCollectionHeaderProps>) as (props: TopicCollectionHeaderProps) => React.ReactElement | null;

const styles = createStyles({
  wrapper: {
    backgroundColor: COLORS.ink,
    marginBottom: SPACING.m,
  },
  header: {
    width: '100%',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.l,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  headerBarSpacer: {
    flex: 1,
  },
  backButton: {},
  rightButton: {},
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  overlayContent: {
    flex: 1,
    marginRight: SPACING.m,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metricText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  actionButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  actionButtonTextActive: {
    color: COLORS.ink,
  },
  descriptionBlock: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  descriptionBorder: {
    width: 2,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.m,
  },
  descriptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.paper,
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  children: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
});

