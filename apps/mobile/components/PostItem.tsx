import React, { useRef, memo } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../utils/api';
import { queueAction } from '../utils/offlineQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/auth';
import AddToCollectionSheet, { AddToCollectionSheetRef } from './AddToCollectionSheet';
import ShareSheet, { ShareSheetRef } from './ShareSheet';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';
import { PostContent } from './PostContent';

import { Post } from '../types';

interface PostItemProps {
  post: Post;
  onLike?: () => void;
  onReply?: () => void;
  onQuote?: () => void;
  onKeep?: () => void;
  onAddToCollection?: () => void;
  onShare?: () => void;
}

function PostItemComponent({
  post,
  onLike,
  onReply,
  onQuote,
  onKeep,
  onAddToCollection,
  onShare,
}: PostItemProps): React.JSX.Element | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { isOffline } = useNetworkStatus();
  const { showSuccess, showError } = useToast();
  const { userId } = useAuth();
  const [liked, setLiked] = React.useState(false);
  const [kept, setKept] = React.useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);
  const shareSheetRef = useRef<ShareSheetRef>(null);

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      animateLike();
      setLiked(!liked); // Optimistic update

      if (isOffline) {
        await queueAction({
          type: 'like',
          endpoint: `/posts/${post.id}/like`,
          method: 'POST',
        });
      } else {
        await api.post(`/posts/${post.id}/like`);
      }
      onLike?.();
    } catch (error) {
      console.error('Failed to like', error);
      setLiked(liked); // Revert on error
    }
  };

  const handleKeep = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setKept(!kept); // Optimistic update

      if (isOffline) {
        await queueAction({
          type: 'keep',
          endpoint: `/posts/${post.id}/keep`,
          method: 'POST',
        });
      } else {
        await api.post(`/posts/${post.id}/keep`);
      }
      onKeep?.();
    } catch (error) {
      console.error('Failed to keep', error);
      setKept(kept); // Revert on error
    }
  };

  const handleShare = () => {
    Haptics.selectionAsync();
    shareSheetRef.current?.open(post.id);
  };

  const handleReport = async () => {
    Alert.alert(
      t('post.reportTitle', 'Report Post'),
      t('post.reportMessage', 'Are you sure you want to report this post?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('post.report', 'Report'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (isOffline) {
                await queueAction({
                  type: 'report',
                  endpoint: `/safety/report`,
                  method: 'POST',
                  data: { targetId: post.id, targetType: 'POST', reason: 'Reported via mobile app' },
                });
              } else {
                await api.post(`/safety/report`, {
                  targetId: post.id,
                  targetType: 'POST',
                  reason: 'Reported via mobile app',
                });
              }
              showSuccess(t('post.reportSuccess', 'Post reported successfully'));
            } catch (error) {
              console.error('Failed to report', error);
              showError(t('post.reportError', 'Failed to report post'));
            }
          },
        },
      ]
    );
  };

  const handleMenu = () => {
    Haptics.selectionAsync();
    if (Platform.OS === 'web') {
      const result = window.confirm('Report this post?');
      if (result) handleReport();
    } else {
      Alert.alert(
        t('post.options', 'Post Options'),
        undefined,
        [
          { text: t('post.report', 'Report Post'), onPress: handleReport, style: 'destructive' },
          { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        ]
      );
    }
  };

  // Handle missing author data gracefully
  if (!post.author) {
    return (
      <View style={styles.container}>
        <Text style={styles.metaText}>{t('post.dataIncomplete', 'Post data incomplete')}</Text>
      </View>
    ) as React.JSX.Element;
  }

  return (
    <View style={styles.container}>

      <PostContent post={post} onMenuPress={handleMenu} />

      {/* Private Feedback Line (Author Only) - never show like count to non-creators */}
      {userId === post.author?.id && post.privateLikeCount !== undefined && post.privateLikeCount > 0 && (
        <View style={styles.privateFeedback}>
          <MaterialIcons name="favorite" size={14} color={COLORS.like} />
          <Text style={styles.privateFeedbackText}>
            {t('post.privateLikedBy', { count: post.privateLikeCount, defaultValue: `Private: Liked by ${post.privateLikeCount} people` })}
          </Text>
        </View>
      )}

      {/* Action Row - Matching Stitch Reference + Like */}
      <View style={styles.actions}>
        <Pressable style={styles.actionButton} onPress={handleLike}>
          {/* @ts-ignore - React 19 compatibility: Animated.View returns ReactNode | Promise<ReactNode> */}
          <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
            <MaterialIcons
              name={liked ? "favorite" : "favorite-border"}
              size={20}
              color={liked ? COLORS.like : COLORS.tertiary}
            />
          </Animated.View>
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => {
            router.push(`/post/${post.id}`);
            onReply?.();
          }}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.tertiary} />
          {post.replyCount > 0 && (
            <Text style={styles.actionCount}>{post.replyCount}</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => {
            router.push(`/compose?quote=${post.id}`);
            onQuote?.();
          }}
        >
          <MaterialIcons name="format-quote" size={20} color={COLORS.tertiary} />
          {post.quoteCount > 0 && (
            <Text style={styles.actionCount}>{post.quoteCount}</Text>
          )}
        </Pressable>

        <Pressable style={styles.actionButton} onPress={handleKeep}>
          <MaterialIcons
            name={kept ? "bookmark" : "bookmark-border"}
            size={20}
            color={kept ? COLORS.primary : COLORS.tertiary}
          />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={() => {
            onAddToCollection?.();
            collectionSheetRef.current?.open(post.id);
          }}
          accessibilityLabel={t('post.add')}
          accessibilityRole="button"
        >
          <MaterialIcons name="add-circle-outline" size={20} color={COLORS.tertiary} />
        </Pressable>

        <Pressable
          style={styles.actionButton}
          onPress={handleShare}
          accessibilityLabel={t('post.share')}
          accessibilityRole="button"
        >
          <MaterialIcons name="ios-share" size={20} color={COLORS.tertiary} />
        </Pressable>
      </View>

      <AddToCollectionSheet ref={collectionSheetRef} />
      <ShareSheet ref={shareSheetRef} />
    </View>
  );
}

// Wrap with memo and type assert to satisfy React 19's strict JSX checking
// PostItemComponent returns JSX.Element | null, but memo() expects ReactNode
const MemoizedPostItem = memo(PostItemComponent as React.ComponentType<PostItemProps>) as typeof PostItemComponent;

// Type assertion: component always returns JSX.Element, never undefined
export const PostItem = MemoizedPostItem;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.xl, // px-5 (20px)
    paddingTop: SPACING.xxl, // py-6 (24px)
    paddingBottom: SPACING.xxl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
    gap: SPACING.m, // gap-3
  },
  metaText: {
    fontSize: 12, // text-xs
    color: COLORS.tertiary, // text-tertiary
    fontFamily: FONTS.regular,
  },
  privateFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.s,
  },
  privateFeedbackText: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.s, // pt-2
    paddingRight: SPACING.l, // pr-4
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4, // gap-1
    padding: SPACING.xs,
    // Clean look matching web app - no background
  },
  actionCount: {
    fontSize: 12, // text-xs
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});