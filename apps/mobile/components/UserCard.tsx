import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

/**
 * Shared user profile card used everywhere: followers, following, suggestions, explore, search.
 * Follow button is always top-right (social-network style).
 */
export interface UserCardItem {
  id: string;
  handle: string;
  displayName?: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isFollowing?: boolean;
}

interface UserCardProps {
  item: UserCardItem;
  onPress: () => void;
  onFollow?: () => void;
}

export function UserCard({ item, onPress, onFollow }: UserCardProps) {
  const handleFollowPress = (e: any) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFollow?.();
  };

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {(item.displayName || item.handle || '?').charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{item.displayName || item.handle}</Text>
          <Text style={styles.handle}>@{item.handle}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          ) : null}
        </View>
        {onFollow != null && (
          <Pressable
            style={[styles.followBtn, item.isFollowing && styles.followBtnActive]}
            onPress={handleFollowPress}
          >
            <Text style={[styles.followBtnText, item.isFollowing && styles.followBtnTextActive]}>
              {item.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  handle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  bio: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  followBtn: {
    marginLeft: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  followBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  followBtnTextActive: {
    color: COLORS.ink,
  },
});
