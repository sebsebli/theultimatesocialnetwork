import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { getImageUrl } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT } from '../constants/theme';

/** Topic card: bigger card with topic + most recent post (image, excerpt, author) to give users a sense of the topic. */
export const TopicCard = ({ item, onPress, onFollow }: { item: any; onPress: () => void; onFollow?: () => void }) => {
  const { t } = useTranslation();
  const recent = item.recentPost;
  const imageUrl =
    (recent?.headerImageKey ? getImageUrl(recent.headerImageKey) : null) ||
    (item.headerImageKey ? getImageUrl(item.headerImageKey) : null) ||
    (item.recentPostImageKey ? getImageUrl(item.recentPostImageKey) : null) ||
    (item.latestPostImageKey ? getImageUrl(item.latestPostImageKey) : null) ||
    (item.recentPost?.headerImageKey ? getImageUrl(item.recentPost.headerImageKey) : null) ||
    (item as any).headerImageUrl ||
    (item.recentPost?.headerImageUrl ? item.recentPost.headerImageUrl : null);
  const latestTitle = recent?.title?.trim() || null;
  const latestExcerpt = (recent?.bodyExcerpt || item.recentPostExcerpt || '').trim() || null;
  const latestAuthor = recent?.author ? `@${recent.author.handle}` : null;

  return (
    <Pressable onPress={onPress} style={styles.topicCard}>
      {/* Optional header image from latest post — bigger card */}
      {imageUrl ? (
        <View style={styles.topicCardImageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.topicCardImage} />
          <View style={styles.topicCardImageOverlay} />
        </View>
      ) : null}
      <View style={styles.topicCardContent}>
        <View style={styles.topicRow}>
          {!imageUrl ? (
            <View style={styles.topicIcon}>
              <MaterialIcons name="topic" size={HEADER.iconSize} color={COLORS.primary} />
            </View>
          ) : null}
          <View style={[styles.topicInfo, !imageUrl && { marginLeft: 0 }]}>
            <Text style={styles.topicTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.topicStatsInline}>
              {item.postCount ?? 0} {t('profile.posts', 'posts').toLowerCase()}
              {(item.followerCount != null && item.followerCount > 0) ? ` · ${item.followerCount} ${t('profile.followers', 'followers').toLowerCase()}` : ''}
            </Text>
          </View>
          {onFollow != null && (
            <Pressable
              style={[styles.topicFollowBtn, item.isFollowing && styles.followingButton]}
              onPress={(e: { stopPropagation?: () => void }) => { e?.stopPropagation?.(); onFollow(); }}
            >
              <Text style={[styles.followButtonText, item.isFollowing && styles.followingButtonText]}>
                {item.isFollowing ? t('profile.following') : t('profile.follow')}
              </Text>
            </Pressable>
          )}
        </View>
        {/* Latest post in topic — gives users a sense of the topic */}
        {(recent && (latestTitle || latestExcerpt)) ? (
          <View style={styles.topicLatestBlock}>
            <Text style={styles.topicLatestLabel}>{t('explore.latest')}</Text>
            {latestTitle ? (
              <Text style={styles.topicLatestTitle} numberOfLines={2}>{latestTitle}</Text>
            ) : null}
            {latestExcerpt ? (
              <Text style={[latestTitle ? styles.topicLatestExcerpt : styles.topicLatestExcerptOnly]} numberOfLines={2}>
                {latestExcerpt}
              </Text>
            ) : null}
            {latestAuthor ? (
              <Text style={styles.topicLatestAuthor}>{latestAuthor}</Text>
            ) : null}
          </View>
        ) : item.description ? (
          <Text style={styles.topicDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
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
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  topicCardImageWrap: {
    width: '100%',
    aspectRatio: 2.2,
    backgroundColor: COLORS.divider,
  },
  topicCardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  topicCardImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topicCardContent: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicPreviewImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.divider,
    marginRight: SPACING.m,
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
    marginLeft: 0,
  },
  topicTitle: {
    fontSize: 17,
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
  topicLatestBlock: {
    marginTop: SPACING.m,
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  topicLatestLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    letterSpacing: 1,
  },
  topicLatestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
  },
  topicLatestExcerpt: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  topicLatestExcerptOnly: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 20,
  },
  topicLatestAuthor: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 6,
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
    marginLeft: 0,
  },
  personCard: {
    padding: SPACING.xl, // p-5
    backgroundColor: COLORS.hover, // bg-white/5
    borderRadius: SIZES.borderRadius,
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
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