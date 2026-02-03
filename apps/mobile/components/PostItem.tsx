import React, { useRef, memo, useState } from 'react';
import { Text, View, Pressable, Platform, Animated } from 'react-native';
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
import { ConfirmModal } from './ConfirmModal';
import { OptionsActionSheet } from './OptionsActionSheet';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles } from '../constants/theme';
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
  /** Called after post is deleted (e.g. remove from list) */
  onDeleted?: () => void;
  /** Preview mode (e.g. composer): no actions, no navigation, optional local header image */
  isPreview?: boolean;
  headerImageUri?: string | null;
}

function PostItemComponent({
  post,
  onLike,
  onReply,
  onQuote,
  onKeep,
  onAddToCollection,
  onShare,
  onDeleted,
  isPreview = false,
  headerImageUri,
}: PostItemProps): React.JSX.Element | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { isOffline } = useNetworkStatus();
  const { showSuccess, showError } = useToast();
  const { userId } = useAuth();
  const [liked, setLiked] = React.useState(post.isLiked ?? false);
  const [kept, setKept] = React.useState(post.isKept ?? false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Sync from server when post prop changes (e.g. refetched feed with updated isLiked/isKept)
  React.useEffect(() => {
    setLiked(post.isLiked ?? false);
    setKept(post.isKept ?? false);
  }, [post.id, post.isLiked, post.isKept]);
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);
  const shareSheetRef = useRef<ShareSheetRef>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

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
      const next = !liked;
      setLiked(next); // Optimistic update

      if (isOffline) {
        await queueAction({
          type: 'like',
          endpoint: `/posts/${post.id}/like`,
          method: next ? 'POST' : 'DELETE',
        });
      } else {
        if (next) await api.post(`/posts/${post.id}/like`);
        else await api.delete(`/posts/${post.id}/like`);
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
      const next = !kept;
      setKept(next); // Optimistic update

      if (isOffline) {
        await queueAction({
          type: 'keep',
          endpoint: `/posts/${post.id}/keep`,
          method: next ? 'POST' : 'DELETE',
        });
      } else {
        if (next) await api.post(`/posts/${post.id}/keep`);
        else await api.delete(`/posts/${post.id}/keep`);
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

  const handleReport = () => setReportModalVisible(true);

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${post.id}`);
      showSuccess(t('post.deleted', 'Post deleted'));
      setDeleteConfirmVisible(false);
      setOptionsModalVisible(false);
      onDeleted?.();
    } catch (error) {
      showError(t('post.deleteFailed', 'Failed to delete post'));
      throw error;
    }
  };

  const isOwnPost = !!userId && post.author?.id === userId;

  const confirmReport = async () => {
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
      throw error;
    }
  };

  const handleMenu = () => {
    Haptics.selectionAsync();
    if (Platform.OS === 'web') {
      const result = window.confirm(t('post.reportMessage', 'Are you sure you want to report this post?'));
      if (result) handleReport();
    } else {
      setOptionsModalVisible(true);
    }
  };

  // Never show "data incomplete" — hide incomplete posts entirely
  if (!post.author) return null;

  return (
    <View style={styles.container}>
      <PostContent
        post={post}
        onMenuPress={isPreview ? undefined : handleMenu}
        disableNavigation={isPreview}
        headerImageUri={headerImageUri}
        showSources={isPreview}
        referenceMetadata={post.referenceMetadata ?? undefined}
        maxBodyLines={isPreview ? undefined : 10}
      />

      {isPreview ? null : (
        <>
          {/* Private Feedback Line (Author Only) - never show like count to non-creators */}
          {userId === post.author?.id && post.privateLikeCount !== undefined && post.privateLikeCount > 0 && (
            <View style={styles.privateFeedback}>
              <MaterialIcons name="favorite" size={HEADER.iconSize} color={COLORS.like} />
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
                  size={HEADER.iconSize}
                  color={liked ? COLORS.like : COLORS.tertiary}
                />
              </Animated.View>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                onReply?.();
                router.push(`/post/${post.id}/comments`);
              }}
            >
              <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
              {post.replyCount > 0 && (
                <Text style={styles.actionCount}>{post.replyCount}</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => {
                router.push({ pathname: '/post/compose', params: { quote: post.id } });
                onQuote?.();
              }}
            >
              <MaterialIcons name="format-quote" size={HEADER.iconSize} color={COLORS.tertiary} />
              {post.quoteCount > 0 && (
                <Text style={styles.actionCount}>{post.quoteCount}</Text>
              )}
            </Pressable>

            <Pressable style={styles.actionButton} onPress={handleKeep}>
              <MaterialIcons
                name={kept ? "bookmark" : "bookmark-border"}
                size={HEADER.iconSize}
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
              <MaterialIcons name="add-circle-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={handleShare}
              accessibilityLabel={t('post.share')}
              accessibilityRole="button"
            >
              <MaterialIcons name="ios-share" size={HEADER.iconSize} color={COLORS.tertiary} />
            </Pressable>
          </View>

          <AddToCollectionSheet ref={collectionSheetRef} />
          <ShareSheet ref={shareSheetRef} />
          <ConfirmModal
            visible={reportModalVisible}
            title={t('post.reportTitle', 'Report Post')}
            message={t('post.reportMessage', 'Are you sure you want to report this post?')}
            confirmLabel={t('post.report', 'Report')}
            cancelLabel={t('common.cancel')}
            destructive
            onConfirm={confirmReport}
            onCancel={() => setReportModalVisible(false)}
          />
          <OptionsActionSheet
            visible={optionsModalVisible}
            title={t('post.options', 'Post Options')}
            options={[
              ...(isOwnPost ? [{ label: t('post.delete', 'Delete Post'), onPress: () => { setOptionsModalVisible(false); setDeleteConfirmVisible(true); }, destructive: true as const, icon: 'delete-outline' as const }] : []),
              { label: t('post.report', 'Report Post'), onPress: () => { setOptionsModalVisible(false); setReportModalVisible(true); }, destructive: true, icon: 'flag' },
            ]}
            cancelLabel={t('common.cancel')}
            onCancel={() => setOptionsModalVisible(false)}
          />
          <ConfirmModal
            visible={deleteConfirmVisible}
            title={t('post.delete', 'Delete Post')}
            message={t('post.deleteConfirm', 'Are you sure you want to delete this post? This cannot be undone.')}
            confirmLabel={t('post.delete', 'Delete Post')}
            cancelLabel={t('common.cancel')}
            destructive
            icon="warning"
            onConfirm={handleDeletePost}
            onCancel={() => setDeleteConfirmVisible(false)}
          />
        </>
      )}
    </View>
  );
}

// Wrap with memo and type assert to satisfy React 19's strict JSX checking
// PostItemComponent returns JSX.Element | null, but memo() expects ReactNode
const MemoizedPostItem = memo(PostItemComponent as React.ComponentType<PostItemProps>) as typeof PostItemComponent;

// Type assertion: component always returns JSX.Element, never undefined
export const PostItem = MemoizedPostItem;

const styles = createStyles({
  container: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
    gap: SPACING.m,
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