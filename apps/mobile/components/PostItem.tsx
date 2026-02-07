import React, { useRef, memo, useEffect } from "react";
import {
  Text,
  View,
  Animated,
  AccessibilityInfo,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { api } from "../utils/api";
import { queueAction } from "../utils/offlineQueue";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { useAuth } from "../context/auth";
import { usePostActions } from "../context/PostActionContext";
import {
  COLORS,
  SPACING,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../constants/theme";
import { PostContent } from "./PostContent";
import { ActionButton } from "./ActionButton";

import { Post } from "../types";

// ── Module-level reduce-motion cache ───────────────────────────────────
// Checked once and shared across all PostItem instances instead of each
// item spawning its own async AccessibilityInfo call.
let _reduceMotionCached: boolean | null = null;

function getReduceMotion(): boolean {
  if (_reduceMotionCached !== null) return _reduceMotionCached;
  // Start async check; default to false until resolved
  AccessibilityInfo.isReduceMotionEnabled().then((v) => {
    _reduceMotionCached = v;
  });
  return false;
}

// Warm the cache on module load
getReduceMotion();

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
  const { userId } = useAuth();
  const { openShare, openCollection, openOptions } = usePostActions();
  const [liked, setLiked] = React.useState(post.isLiked ?? false);
  const [kept, setKept] = React.useState(post.isKept ?? false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Sync from server when post prop changes (e.g. refetched feed with updated isLiked/isKept)
  React.useEffect(() => {
    setLiked(post.isLiked ?? false);
    setKept(post.isKept ?? false);
  }, [post.id, post.isLiked, post.isKept]);

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
      if (!getReduceMotion()) {
        animateLike();
      }
      const next = !liked;
      setLiked(next); // Optimistic update

      if (isOffline) {
        await queueAction({
          type: "like",
          endpoint: `/posts/${post.id}/like`,
          method: next ? "POST" : "DELETE",
        });
      } else {
        if (next) await api.post(`/posts/${post.id}/like`);
        else await api.delete(`/posts/${post.id}/like`);
      }
      onLike?.();
    } catch (error) {
      if (__DEV__) console.error("Failed to like", error);
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
          type: "keep",
          endpoint: `/posts/${post.id}/keep`,
          method: next ? "POST" : "DELETE",
        });
      } else {
        if (next) await api.post(`/posts/${post.id}/keep`);
        else await api.delete(`/posts/${post.id}/keep`);
      }
      onKeep?.();
    } catch (error) {
      if (__DEV__) console.error("Failed to keep", error);
      setKept(kept); // Revert on error
    }
  };

  const handleShare = () => {
    openShare(post.id, {
      authorIsProtected: post.author?.isProtected === true,
    });
    onShare?.();
  };

  const handleMenu = () => {
    openOptions(post, { onDeleted });
  };

  // Use placeholder author when API omits it (e.g. pending user) so the post preview always shows
  const authorId = post.author?.id ?? (post as { authorId?: string }).authorId;
  const author =
    post.author ??
    (authorId
      ? {
        id: authorId,
        handle: t("post.unknownUser", "Unknown"),
        displayName: t("post.unknownUser", "Unknown"),
      }
      : null);
  if (!author) return null;

  const postWithAuthor = author !== post.author ? { ...post, author } : post;

  return (
    <View style={styles.container}>
      <PostContent
        post={postWithAuthor}
        onMenuPress={isPreview ? undefined : handleMenu}
        disableNavigation={isPreview}
        headerImageUri={headerImageUri}
        showSources={isPreview}
        referenceMetadata={post.referenceMetadata ?? undefined}
        inlineEnrichment={post.inlineEnrichment}
        maxBodyLines={isPreview ? undefined : 10}
      />

      {isPreview ? null : (
        <>
          {/* Action Row - Matching Stitch Reference + Like */}
          <View style={styles.actions}>
            <ActionButton
              icon="favorite-border"
              activeIcon="favorite"
              active={liked}
              activeColor={COLORS.like}
              onPress={handleLike}
              label={liked ? t("post.unlike", "Unlike") : t("post.like", "Like")}
              scaleValue={scaleValue}
              count={userId === author.id && post.privateLikeCount ? post.privateLikeCount : undefined}
            />

            <ActionButton
              icon="chat-bubble-outline"
              onPress={() => {
                onReply?.();
                router.push(`/post/${post.id}/comments`);
              }}
              label={
                post.replyCount > 0
                  ? t("post.repliesCount", {
                    count: post.replyCount,
                    defaultValue: `${post.replyCount} replies`,
                  })
                  : t("post.reply", "Reply")
              }
              count={post.replyCount}
            />

            <ActionButton
              icon="format-quote"
              onPress={() => {
                router.push({
                  pathname: "/post/compose",
                  params: { quote: post.id },
                });
                onQuote?.();
              }}
              label={t("post.quote", "Quote")}
              count={post.quoteCount}
            />

            <ActionButton
              icon="bookmark-border"
              activeIcon="bookmark"
              active={kept}
              onPress={handleKeep}
              label={
                kept
                  ? t("post.removeKeep", "Remove from keeps")
                  : t("post.keep", "Keep")
              }
            />

            <ActionButton
              icon="add-circle-outline"
              onPress={() => {
                onAddToCollection?.();
                openCollection(post.id);
              }}
              label={t("post.add")}
            />

            <ActionButton
              icon="ios-share"
              onPress={handleShare}
              label={t("post.share")}
            />
          </View>
        </>
      )}
    </View>
  );
}

// Wrap with memo and type assert to satisfy React 19's strict JSX checking
// PostItemComponent returns JSX.Element | null, but memo() expects ReactNode
const MemoizedPostItem = memo(
  PostItemComponent as React.ComponentType<PostItemProps>,
) as typeof PostItemComponent;

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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: SPACING.s,
  },
  privateFeedbackText: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING.s, // pt-2
    paddingRight: SPACING.l, // pr-4
  },
});
