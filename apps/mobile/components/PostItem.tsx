import React, { useRef, memo } from 'react';
import { StyleSheet, Text, View, Pressable, Share, Platform, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { api } from '../utils/api';
import { queueAction } from '../utils/offlineQueue';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useToast } from '../context/ToastContext';
import { MarkdownText } from './MarkdownText';
import AddToCollectionSheet, { AddToCollectionSheetRef } from './AddToCollectionSheet';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

interface PostItemProps {
  post: {
    id: string;
    title?: string;
    body: string;
    createdAt: string;
    author?: {
      id: string;
      handle: string;
      displayName: string;
    };
    replyCount: number;
    quoteCount: number;
    privateLikeCount?: number;
    headerImageKey?: string;
  };
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
  const [liked, setLiked] = React.useState(false);
  const [kept, setKept] = React.useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

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

  const handleShare = async () => {
    Haptics.selectionAsync();
    const url = `https://cite.app/post/${post.id}`;
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(url);
        showSuccess('Link copied to clipboard');
      } else {
        await Share.share({ message: url });
      }
      onShare?.();
    } catch (error) {
      console.error('Failed to share', error);
    }
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
        <Text style={styles.metaText}>Post data incomplete</Text>
      </View>
    ) as React.JSX.Element;
  }

  const authorInitial = post.author.displayName
    ? post.author.displayName.charAt(0).toUpperCase()
    : '?';

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [styles.authorRow, pressed && { opacity: 0.7 }]}
        onPress={() => post.author?.handle && router.push(`/user/${post.author.handle}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {authorInitial}
          </Text>
        </View>
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author.displayName || 'Unknown'}</Text>
            <MaterialIcons name="circle" size={4} color={COLORS.tertiary} style={styles.dotIcon} />
            <Text style={styles.metaText}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
        <Pressable
          onPress={handleMenu}
          hitSlop={12}
          style={({ pressed }: { pressed: boolean }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}
        >
          <MaterialIcons name="more-horiz" size={20} color={COLORS.tertiary} />
        </Pressable>
      </Pressable>

      {/* Content */}
      <Pressable
        onPress={() => {
          if (post.title) {
            router.push(`/post/${post.id}/reading`);
          } else {
            router.push(`/post/${post.id}`);
          }
        }}
        style={({ pressed }: { pressed: boolean }) => [styles.content, pressed && { opacity: 0.9 }]}
        accessibilityRole="button"
        accessibilityLabel={post.title || post.body.substring(0, 50)}
      >
        {post.title && (
          <Text style={styles.title}>{post.title}</Text>
        )}
        <MarkdownText>{post.body}</MarkdownText>
        {post.headerImageKey && (
          <Image
            source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/images/${post.headerImageKey}` }}
            style={styles.headerImage}
            contentFit="cover"
            transition={300}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
            accessibilityLabel={t('post.headerImage')}
          />
        )}
      </Pressable>

      {/* Private Feedback Line (Author Only) */}
      {post.privateLikeCount !== undefined && post.privateLikeCount > 0 && (
        <View style={styles.privateFeedback}>
          <MaterialIcons name="favorite" size={14} color={COLORS.like} />
          <Text style={styles.privateFeedbackText}>
            Private: Liked by {post.privateLikeCount} people
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
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m, // gap-3
  },
  avatar: {
    width: 40, // h-10 w-10
    height: 40,
    borderRadius: 20, // rounded-full
    backgroundColor: 'rgba(110, 122, 138, 0.2)', // bg-primary/20
    alignItems: 'center',
    justifyContent: 'center',
    // Optional: Add image support here later
  },
  avatarText: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14, // text-sm
    fontWeight: '600',
    color: COLORS.paper, // text-paper
    fontFamily: FONTS.semiBold,
  },
  dotIcon: {
    marginHorizontal: 6, // gap-1.5
  },
  metaText: {
    fontSize: 12, // text-xs
    color: COLORS.tertiary, // text-tertiary
    fontFamily: FONTS.regular,
  },
  handle: {
    fontSize: 12, // text-xs (if shown)
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  content: {
    gap: SPACING.s, // gap-2
  },
  title: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: COLORS.paper, // text-paper
    lineHeight: 24, // leading-snug
    fontFamily: FONTS.serifSemiBold, // IBM Plex Serif for content
    letterSpacing: -0.5, // tracking-tight
  },
  headerImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    marginTop: SPACING.m,
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