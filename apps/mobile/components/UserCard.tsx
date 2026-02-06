import React, { memo, useCallback } from 'react';
import { View, Text, Pressable, Image, type GestureResponderEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getAvatarUri } from '../utils/api';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, FONTS, LAYOUT, createStyles } from '../constants/theme';

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
  avatarKey?: string | null;
  isFollowing?: boolean;
}

interface UserCardProps {
  item: UserCardItem;
  onPress: () => void;
  onFollow?: () => void;
}

function UserCardInner({ item, onPress, onFollow }: UserCardProps) {
  const { t } = useTranslation();
  const displayName = item.displayName || item.handle;

  const handleFollowPress = useCallback((e: GestureResponderEvent) => {
    e?.stopPropagation?.();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFollow?.();
  }, [onFollow]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`${displayName}, @${item.handle}`}
      accessibilityRole="button"
      accessibilityHint={t('common.viewProfile', 'View profile')}
    >
      <View style={styles.row}>
        <View style={styles.avatar} accessibilityElementsHidden>
          {getAvatarUri(item) ? (
            <Image source={{ uri: getAvatarUri(item)! }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.handle}>@{item.handle}</Text>
          {item.bio ? (
            <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text>
          ) : null}
        </View>
        {onFollow != null && (
          <Pressable
            style={[styles.followBtn, item.isFollowing && styles.followBtnActive]}
            onPress={handleFollowPress}
            accessibilityLabel={
              item.isFollowing
                ? t('common.unfollow', { name: displayName, defaultValue: `Unfollow ${displayName}` })
                : t('common.follow', { name: displayName, defaultValue: `Follow ${displayName}` })
            }
            accessibilityRole="button"
          >
            <Text style={[styles.followBtnText, item.isFollowing && styles.followBtnTextActive]}>
              {item.isFollowing ? t('common.following', 'Following') : t('common.followAction', 'Follow')}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

export const UserCard = memo(UserCardInner as React.FunctionComponent<UserCardProps>) as (props: UserCardProps) => React.ReactElement | null;

const styles = createStyles({
  card: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
