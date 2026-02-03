import React, { useMemo } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { getImageUrl, getAvatarUri } from '../utils/api';
import { MarkdownText } from './MarkdownText';
import { SourceOrPostCard } from './SourceOrPostCard';
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from '../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const HERO_ASPECT = 3 / 4;

export interface PostReadingContentPost {
  id: string;
  title?: string | null;
  body: string;
  headerImageKey?: string | null;
  createdAt: string;
  author?: {
    id?: string;
    displayName?: string;
    handle?: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  } | null;
  referenceMetadata?: Record<string, { title?: string }>;
}

export interface SourceItem {
  type: 'post' | 'topic' | 'user' | 'external';
  id?: string;
  url?: string;
  title?: string;
  slug?: string;
  handle?: string;
  description?: string;
}

export interface PostReadingContentProps {
  post: PostReadingContentPost;
  /** Override header image URL (e.g. local file URI in composer preview) */
  headerImageUri?: string | null;
  sources: SourceItem[];
  /** Show like/comment/keep/share row (false in composer preview) */
  showActions?: boolean;
  /** Called when a source is pressed (optional in preview) */
  onSourcePress?: (source: SourceItem) => void;
}

function dedupeSources(sources: SourceItem[]): SourceItem[] {
  const seen = new Set<string>();
  return sources.filter((s) => {
    const key =
      s.type === 'external' ? (s.url ?? s.id ?? '') :
      s.type === 'post' ? (s.id ?? '') :
      s.type === 'user' ? (s.handle ?? s.id ?? '') :
      s.type === 'topic' ? (s.slug ?? s.id ?? '') :
      `${s.type}-${s.id ?? s.url ?? s.handle ?? s.slug ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Renders the full post reading layout: hero image, author line, title, body, optional actions, sources.
 * Used by the reading screen and by the composer preview so preview matches the full post page.
 */
export function PostReadingContent({
  post,
  headerImageUri,
  sources,
  showActions = false,
  onSourcePress,
}: PostReadingContentProps) {
  const { t } = useTranslation();
  const sourcesUnique = useMemo(() => dedupeSources(sources), [sources]);
  const heroImageUri = headerImageUri ?? (post.headerImageKey ? getImageUrl(post.headerImageKey) : null);
  const hasHero = Boolean(heroImageUri);
  const authorName = post.author?.displayName || post.author?.handle || t('post.unknownUser', 'Unknown');
  const authorAvatarUri = getAvatarUri(post.author ?? undefined);
  const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={!hasHero && styles.articleTopPadding}>
      {/* Hero: full width, title overlay */}
      {hasHero && heroImageUri && (
        <View style={[styles.heroImageWrap, { height: SCREEN_WIDTH * HERO_ASPECT }]}>
          <ExpoImage
            source={{ uri: heroImageUri }}
            style={[styles.heroImage, { width: SCREEN_WIDTH, height: SCREEN_WIDTH * HERO_ASPECT }]}
            contentFit="cover"
          />
          {post.title != null && post.title !== '' && (
            <View style={styles.heroTitleOverlay}>
              <Text style={styles.heroTitleText} numberOfLines={2}>
                {post.title}
              </Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.article}>
        {/* Author line */}
        <View style={styles.authorLine}>
          {authorAvatarUri ? (
            <ExpoImage source={{ uri: authorAvatarUri }} style={styles.authorAvatarImage} contentFit="cover" />
          ) : (
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>
                {(post.author?.displayName ?? post.author?.handle ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{authorName}</Text>
            <Text style={styles.readTime}>{dateStr}</Text>
          </View>
        </View>

        {/* Title only when no hero (hero already shows title) */}
        {!hasHero && post.title != null && post.title !== '' && (
          <Text style={styles.title}>{post.title}</Text>
        )}

        <MarkdownText
          stripLeadingH1IfMatch={post.title ?? undefined}
          referenceMetadata={post.referenceMetadata}
        >
          {post.body}
        </MarkdownText>

        {showActions && (
          <View style={styles.actionsRow}>
            <View style={styles.actionBtn}>
              <MaterialIcons name="favorite-border" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
            <View style={styles.actionBtn}>
              <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
            <View style={styles.actionBtn}>
              <MaterialIcons name="format-quote" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
            <View style={styles.actionBtn}>
              <MaterialIcons name="bookmark-border" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
            <View style={styles.actionBtn}>
              <MaterialIcons name="add-circle-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
            <View style={styles.actionBtn}>
              <MaterialIcons name="ios-share" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
          </View>
        )}
      </View>

      {/* Sources section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('post.sources', 'Sources')}</Text>
        {sourcesUnique.length === 0 ? (
          <Text style={styles.emptyText}>{t('post.noSources', 'No tagged sources in this post.')}</Text>
        ) : (
          <View style={styles.sourcesList}>
            {sourcesUnique.map((source, index) => {
              const title = source.title || source.url || source.handle || source.slug || '';
              const subtitle =
                source.type === 'external' && source.url
                  ? (source.description?.trim()
                      ? source.description.trim()
                      : (() => {
                          try {
                            return new URL(source.url!).hostname.replace('www.', '');
                          } catch {
                            return '';
                          }
                        })())
                  : source.type === 'user'
                    ? `@${source.handle}`
                    : source.type === 'topic'
                      ? t('post.topic', 'Topic')
                      : '';
              return (
                <SourceOrPostCard
                  key={
                    source.type === 'external' && source.url
                      ? `ext-${source.url}`
                      : source.id ?? source.handle ?? source.slug ?? `i-${index}`
                  }
                  type={source.type}
                  title={title}
                  subtitle={subtitle || undefined}
                  onPress={() => onSourcePress?.(source)}
                />
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = createStyles({
  articleTopPadding: {
    paddingTop: SPACING.l,
  },
  heroImageWrap: {
    width: SCREEN_WIDTH,
    alignSelf: 'center',
    marginBottom: SPACING.l,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    backgroundColor: COLORS.divider,
  },
  heroTitleOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.l,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  heroTitleText: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
  },
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
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.xs,
  },
  section: {
    marginTop: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  emptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  sourcesList: {
    gap: SPACING.s,
  },
});
