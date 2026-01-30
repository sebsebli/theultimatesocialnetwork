import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/** Topic card: row with most recent article image (or icon) + title + follow; description; optional recent excerpt. */
export const TopicCard = ({ item, onPress, onFollow }: { item: any; onPress: () => void; onFollow?: () => void }) => {
  const imageUrl =
    (item as any).headerImageUrl ||
    (item.headerImageKey ? `${API_BASE}/images/${item.headerImageKey}` : null) ||
    (item.recentPostImageKey ? `${API_BASE}/images/${item.recentPostImageKey}` : null) ||
    (item.latestPostImageKey ? `${API_BASE}/images/${item.latestPostImageKey}` : null) ||
    (item.recentPost?.headerImageKey ? `${API_BASE}/images/${item.recentPost.headerImageKey}` : null) ||
    (item.recentPost?.headerImageUrl ? item.recentPost.headerImageUrl : null);
  return (
    <Pressable onPress={onPress} style={styles.topicCard}>
      <View style={styles.topicRow}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.topicPreviewImage} />
        ) : (
          <View style={styles.topicIcon}>
            <MaterialIcons name="topic" size={HEADER.iconSize} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.topicInfo}>
          <Text style={styles.topicTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.topicStatsInline}>
            {item.postCount ?? 0} posts
            {(item.followerCount != null && item.followerCount > 0) ? ` · ${item.followerCount} followers` : ''}
          </Text>
          {item.recentPostExcerpt ? (
            <Text style={styles.topicRecentExcerpt} numberOfLines={2}>{item.recentPostExcerpt}</Text>
          ) : null}
        </View>
        {onFollow != null && (
          <Pressable
            style={[styles.topicFollowBtn, item.isFollowing && styles.followingButton]}
            onPress={(e: { stopPropagation?: () => void }) => { e?.stopPropagation?.(); onFollow(); }}
          >
            <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
              {item.isFollowing ? 'Following' : 'Follow'}
            </Text>
          </Pressable>
        )}
      </View>
      {item.description ? (
        <Text style={styles.topicDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
    </Pressable>
  );
};

export const PersonCard = ({
  item,
  onPress,
  onFollow,
  fullWidth,
}: {
  item: any;
  onPress: () => void;
  onFollow?: () => void;
  fullWidth?: boolean;
}) => (
  <Pressable onPress={onPress} style={[styles.personCard, fullWidth && styles.personCardFullWidth]}>
    <View style={styles.personRow}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.displayName?.charAt(0) || item.handle?.charAt(0)}
        </Text>
      </View>
      <View style={styles.personInfo}>
        <Text style={styles.personName} numberOfLines={1}>{item.displayName || item.handle}</Text>
        <Text style={styles.personHandle}>@{item.handle}</Text>
        {item.bio ? <Text style={styles.personBio} numberOfLines={2}>{item.bio}</Text> : null}
      </View>
    </View>
    {onFollow != null ? (
      <View style={styles.personSecondRow}>
        <Pressable
          style={[styles.personFollowButton, item.isFollowing && styles.followingButton]}
          onPress={(e: { stopPropagation: () => void }) => {
            e.stopPropagation();
            onFollow();
          }}
        >
          <Text style={[styles.personFollowButtonText, item.isFollowing && styles.followingButtonText]}>
            {item.isFollowing ? 'FOLLOWING' : 'FOLLOW'}
          </Text>
        </Pressable>
      </View>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  topicCard: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    position: 'relative',
  },
  topicPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.divider,
    marginRight: SPACING.m,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  topicInfo: {
    flex: 1,
    minWidth: 0,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  topicStatsInline: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  topicRecentExcerpt: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    fontStyle: 'italic',
  },
  topicFollowBtn: {
    marginLeft: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexShrink: 0,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  followingButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followingButtonText: {
    color: COLORS.ink,
  },
  topicDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginTop: SPACING.s,
    marginLeft: 48 + SPACING.m,
  },
  personCard: {
    padding: SPACING.xl, // p-5
    backgroundColor: COLORS.hover, // bg-white/5
    borderRadius: SIZES.borderRadius,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider, // border-white/10
  },
  personCardFullWidth: {
    marginHorizontal: 0,
    width: '100%',
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.l, // gap-4
  },
  avatar: {
    width: 56, // w-14
    height: 56, // h-14
    borderRadius: 28, // rounded-full
    backgroundColor: COLORS.divider, // bg-primary/20 fallback
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personSecondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  personWhy: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  personHandle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  personBio: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 6,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    opacity: 0.95,
  },
  personFollowButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: 'center',
  },
  personFollowButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});