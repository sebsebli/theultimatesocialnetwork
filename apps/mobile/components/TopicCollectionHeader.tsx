import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
/** Same header image format as collection/topic: 4:3 aspect ratio. */
const HEADER_ASPECT = 3 / 4;

export type TopicCollectionType = 'topic' | 'collection';

export interface TopicCollectionHeaderProps {
  type: TopicCollectionType;
  title: string;
  description?: string | null;
  /** Optional header image key (e.g. from a random post). */
  headerImageKey?: string | null;
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
export function TopicCollectionHeader({
  type,
  title,
  description,
  headerImageKey,
  onBack,
  onAction,
  actionLabel,
  isActionActive,
  metrics,
  rightAction,
  onRightAction,
  children,
}: TopicCollectionHeaderProps) {
  const { width: screenWidth } = useWindowDimensions();
  const headerHeight = Math.round(screenWidth * HEADER_ASPECT);
  const typeLabel = type === 'topic' ? 'TOPIC' : 'COLLECTION';

  return (
    <View style={styles.wrapper}>
      <View style={[styles.header, { height: headerHeight }]}>
        {headerImageKey ? (
          <Image
            source={{ uri: `${API_BASE}/images/${headerImageKey}` }}
            style={StyleSheet.flatten([styles.heroImage, { height: headerHeight }])}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.heroPlaceholder]} />
        )}

        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <View style={styles.iconCircle}>
            <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={COLORS.paper} />
          </View>
        </Pressable>

        {rightAction === 'search' && onRightAction && (
          <Pressable style={styles.rightButton} onPress={onRightAction}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="search" size={HEADER.iconSize} color={COLORS.paper} />
            </View>
          </Pressable>
        )}
        {rightAction === 'more' && onRightAction && (
          <Pressable style={styles.rightButton} onPress={onRightAction} accessibilityLabel="More options">
            <View style={styles.iconCircle}>
              <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={COLORS.paper} />
            </View>
          </Pressable>
        )}

        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            <Text style={styles.title}>{title}</Text>
            {metrics && (metrics.postCount != null || metrics.contributorCount != null || metrics.itemCount != null) && (
              <View style={styles.metricsRow}>
                {(metrics.postCount != null || metrics.itemCount != null) && (
                  <Text style={styles.metricText}>
                    {(metrics.postCount ?? metrics.itemCount ?? 0).toLocaleString()} posts
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

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.ink,
    marginBottom: SPACING.m,
  },
  header: {
    position: 'relative',
    width: '100%',
  },
  heroImage: {
    width: '100%',
    opacity: 0.7,
  },
  heroPlaceholder: {
    backgroundColor: COLORS.hover,
  },
  backButton: {
    position: 'absolute',
    top: SPACING.l,
    left: HEADER.barPaddingHorizontal,
    zIndex: 10,
  },
  rightButton: {
    position: 'absolute',
    top: SPACING.l,
    right: HEADER.barPaddingHorizontal,
    zIndex: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.l,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  overlayContent: {
    flex: 1,
    marginRight: SPACING.m,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.5,
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  metricText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  actionButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: '#FFF',
    backgroundColor: 'transparent',
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
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

/**
 * Pick a stable "random" header image key from posts that have one.
 * Uses a simple hash of the seed (e.g. slug/id) so the same feed shows the same image.
 */
export function pickRandomHeaderImageKey(
  posts: { headerImageKey?: string | null }[],
  seed: string
): string | null {
  const withImages = posts.filter((p) => p?.headerImageKey);
  if (withImages.length === 0) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h << 5) - h + seed.charCodeAt(i);
  const idx = Math.abs(h) % withImages.length;
  return withImages[idx]?.headerImageKey ?? null;
}
