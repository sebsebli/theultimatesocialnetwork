import React, { memo } from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { MarkdownText } from './MarkdownText';
import { getImageUrl } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles } from '../constants/theme';

const ACTION_ICON_SIZE = HEADER.iconSize;

export interface PostArticlePost {
  id: string;
  title?: string | null;
  body: string;
  createdAt: string;
  author?: {
    displayName?: string | null;
    handle?: string | null;
    avatarUrl?: string | null;
    avatarKey?: string | null;
  } | null;
}

export interface PostArticleBlockProps {
  post: PostArticlePost;
  /** When true, title is not shown (e.g. already in hero overlay). */
  hasHero?: boolean;
  /** Override author line subtitle (e.g. "Preview" in composer). When not set, uses post.createdAt date. */
  authorSubtitle?: string;
  referenceMetadata?: Record<string, { title?: string }>;
  validMentionHandles?: Set<string> | null;
  replyCount?: number;
  liked?: boolean;
  kept?: boolean;
  isDownloaded?: boolean;
  offlineEnabled?: boolean;
  onAuthorPress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onQuote?: () => void;
  onKeep?: () => void;
  onAddToCollection?: () => void;
  onShare?: () => void;
  onDownloadOffline?: () => void;
  /** When provided, used instead of default like button (e.g. for animated like in reading). Use actionBtnStyle for the wrapper. */
  renderLikeButton?: (props: { liked: boolean; onPress: () => void; actionBtnStyle: object }) => React.ReactNode;
}

function PostArticleBlockInner({
  post,
  hasHero = false,
  authorSubtitle,
  referenceMetadata = {},
  validMentionHandles,
  replyCount = 0,
  liked = false,
  kept = false,
  isDownloaded = false,
  offlineEnabled = false,
  onAuthorPress,
  onLike,
  onComment,
  onQuote,
  onKeep,
  onAddToCollection,
  onShare,
  onDownloadOffline,
  renderLikeButton,
}: PostArticleBlockProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const authorInitial = post.author?.displayName?.charAt(0) || post.author?.handle?.charAt(0) || '?';
  const authorName = post.author?.displayName || post.author?.handle || t('post.unknownUser', 'Unknown');
  const subtitle = authorSubtitle ?? (post.createdAt
    ? new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : '');

  return (
    <View style={styles.article}>
      <Pressable
        style={styles.authorLine}
        onPress={onAuthorPress}
        disabled={!onAuthorPress}
      >
        {(post.author?.avatarKey || post.author?.avatarUrl) ? (
          <Image source={{ uri: post.author.avatarKey ? getImageUrl(post.author.avatarKey) : post.author.avatarUrl! }} style={styles.authorAvatarImage} />
        ) : (
          <View style={styles.authorAvatar}>
            <Text style={styles.avatarText}>{authorInitial}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{authorName}</Text>
          {subtitle ? <Text style={styles.readTime}>{subtitle}</Text> : null}
        </View>
      </Pressable>

      {(!hasHero && post.title != null && post.title !== '') ? (
        <Text style={styles.title}>{post.title}</Text>
      ) : null}

      <MarkdownText
        referenceMetadata={referenceMetadata}
        validMentionHandles={validMentionHandles}
        stripLeadingH1IfMatch={post.title ?? undefined}
      >
        {post.body}
      </MarkdownText>

      <View style={styles.actionsRow}>
        {renderLikeButton ? (
          renderLikeButton({ liked, onPress: onLike ?? (() => { }), actionBtnStyle: styles.actionBtn })
        ) : (
          <Pressable style={styles.actionBtn} onPress={onLike} disabled={!onLike}>
            <MaterialIcons
              name={liked ? 'favorite' : 'favorite-border'}
              size={ACTION_ICON_SIZE}
              color={liked ? COLORS.like : COLORS.tertiary}
            />
          </Pressable>
        )}

        <Pressable style={styles.actionBtn} onPress={onComment} disabled={!onComment}>
          <MaterialIcons name="chat-bubble-outline" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
          {replyCount > 0 ? <Text style={styles.actionCount}>{replyCount}</Text> : null}
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onQuote} disabled={!onQuote}>
          <MaterialIcons name="format-quote" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onKeep} disabled={!onKeep} accessibilityLabel={t('post.save', 'Save')}>
          <MaterialIcons
            name={kept ? 'bookmark' : 'bookmark-border'}
            size={ACTION_ICON_SIZE}
            color={kept ? COLORS.primary : COLORS.tertiary}
          />
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onAddToCollection} disabled={!onAddToCollection} accessibilityLabel={t('post.addToCollection', 'Add to collection')}>
          <MaterialIcons name="add-circle-outline" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={onShare} disabled={!onShare}>
          <MaterialIcons name="ios-share" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
        </Pressable>

        {offlineEnabled && (
          <Pressable
            style={styles.actionBtn}
            onPress={onDownloadOffline}
            disabled={!onDownloadOffline}
            accessibilityLabel={isDownloaded ? t('post.removeFromDevice', 'Remove from device') : t('post.downloadForOffline', 'Download for offline')}
          >
            <MaterialIcons
              name="offline-pin"
              size={ACTION_ICON_SIZE}
              color={isDownloaded ? COLORS.primary : COLORS.tertiary}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = createStyles({
  article: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.l,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  authorName: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  readTime: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
    marginBottom: SPACING.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.s,
    paddingRight: SPACING.l,
    paddingBottom: SPACING.s,
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
  },
  actionCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});

export const PostArticleBlock = memo(PostArticleBlockInner as React.FunctionComponent<PostArticleBlockProps>) as (props: PostArticleBlockProps) => React.ReactElement | null;
