import React, { memo } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getImageUrl } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles } from '../constants/theme';

const TOPIC_IMAGE_ASPECT = 16 / 9;

/** Topic card: same style as people/posts — hero image (from recent article), topic + recent article title/excerpt, follow. */
const TopicCardInner = ({ item, onPress, onFollow }: { item: any; onPress: () => void; onFollow?: () => void }) => {
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

  const meta = [
    item.postCount != null && `${item.postCount} ${t('profile.posts', 'posts').toLowerCase()}`,
    item.followerCount != null && item.followerCount > 0 && `${item.followerCount} ${t('profile.followers', 'followers').toLowerCase()}`,
  ].filter(Boolean).join(' · ');

  return (
    <Pressable onPress={onPress} style={styles.topicCard}>
      {imageUrl ? (
        <>
          <View style={styles.topicHeroWrap}>
            <Image source={{ uri: imageUrl }} style={styles.topicHeroImage} resizeMode="cover" />
            <View style={styles.topicHeroGradient} />
            <View style={styles.topicHeroTextWrap}>
              <Text style={styles.topicHeroTitle} numberOfLines={2}>{item.title}</Text>
              {latestTitle ? (
                <Text style={styles.topicHeroLatest} numberOfLines={1}>{latestTitle}</Text>
              ) : latestExcerpt ? (
                <Text style={styles.topicHeroLatest} numberOfLines={1}>{latestExcerpt}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.topicFooter}>
            {meta ? <Text style={styles.topicMeta} numberOfLines={1}>{meta}</Text> : null}
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
        </>
      ) : (
        <>
          <View style={styles.topicContent}>
            <Text style={styles.topicTitle} numberOfLines={2}>{item.title}</Text>
            {(latestTitle || latestExcerpt) ? (
              <View style={styles.topicLatestBlock}>
                {latestTitle ? (
                  <Text style={styles.topicLatestTitle} numberOfLines={2}>{latestTitle}</Text>
                ) : null}
                {latestExcerpt ? (
                  <Text style={styles.topicLatestExcerpt} numberOfLines={2}>{latestExcerpt}</Text>
                ) : null}
                {latestAuthor ? (
                  <Text style={styles.topicLatestAuthor} numberOfLines={1}>{latestAuthor}</Text>
                ) : null}
              </View>
            ) : item.description ? (
              <Text style={styles.topicDescription} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
          <View style={styles.topicFooter}>
            {meta ? <Text style={styles.topicMeta} numberOfLines={1}>{meta}</Text> : null}
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
        </>
      )}
    </Pressable>
  );
};

type TopicCardProps = { item: any; onPress: () => void; onFollow?: () => void };
export const TopicCard = memo(TopicCardInner as React.FunctionComponent<TopicCardProps>) as (props: TopicCardProps) => React.ReactElement | null;

export interface PersonCardProps {
  item: any;
  onPress: () => void;
  onFollow?: () => void;
  fullWidth?: boolean;
}

function PersonCardInner({ item, onPress, onFollow, fullWidth }: PersonCardProps) {
  const avatarUri = (item.avatarKey ? getImageUrl(item.avatarKey) : null) || item.avatarUrl || null;
  const initial = (item.displayName || item.handle || '?').charAt(0).toUpperCase();
  return (
    <Pressable onPress={onPress} style={[styles.personCard, fullWidth && styles.personCardFullWidth]}>
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
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
}

export const PersonCard = memo(PersonCardInner as React.FunctionComponent<PersonCardProps>) as (props: PersonCardProps) => React.ReactElement | null;

const styles = createStyles({
  topicCard: {
    backgroundColor: COLORS.hover,
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
    borderRadius: SIZES.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  topicHeroWrap: {
    width: '100%',
    aspectRatio: TOPIC_IMAGE_ASPECT,
    backgroundColor: COLORS.divider,
    position: 'relative',
  },
  topicHeroImage: {
    width: '100%',
    height: '100%',
  },
  topicHeroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topicHeroTextWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.l,
    paddingTop: 40,
  },
  topicHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  topicHeroLatest: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  topicContent: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.s,
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  topicLatestBlock: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  topicLatestTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  topicLatestExcerpt: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  topicLatestAuthor: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 6,
  },
  topicDescription: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 18,
    marginTop: SPACING.s,
  },
  topicFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  topicMeta: {
    flex: 1,
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  topicFollowBtn: {
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
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