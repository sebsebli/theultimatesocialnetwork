import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { MarkdownText } from './MarkdownText';
import { Avatar } from './Avatar';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

import { Post } from '../types';

interface PostContentProps {
  post: Partial<Post> & Pick<Post, 'id' | 'body' | 'createdAt'>;
  onMenuPress?: () => void;
  disableNavigation?: boolean;
  headerImageUri?: string | null;
  showSources?: boolean;
  referenceMetadata?: Record<string, { title?: string }>;
}

export function PostContent({ post, onMenuPress, disableNavigation = false, headerImageUri, showSources = false, referenceMetadata = {} }: PostContentProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t('common.time.now', 'now');
    if (minutes < 60) return `${minutes}${t('common.time.minutes', 'm')}`;
    if (hours < 24) return `${hours}${t('common.time.hours', 'h')}`;
    if (days < 7) return `${days}${t('common.time.days', 'd')}`;
    return d.toLocaleDateString();
  };

  const handleAuthorPress = () => {
    if (!disableNavigation && post.author?.handle) {
      router.push(`/user/${post.author.handle}`);
    }
  };

  const handlePostPress = () => {
    if (!disableNavigation) {
        if (post.title) {
            router.push(`/post/${post.id}/reading`);
        } else {
            router.push(`/post/${post.id}`);
        }
    }
  };

  const handleSourcePress = async (source: any) => {
    if (disableNavigation) return;
    if (source.type === 'external') {
      await WebBrowser.openBrowserAsync(source.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
        toolbarColor: COLORS.ink,
        controlsColor: COLORS.primary,
      });
    } else if (source.type === 'post') {
      router.push(`/post/${source.id}`);
    } else if (source.type === 'topic') {
       // Slugify
       const slug = source.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
       router.push(`/topic/${slug}`);
    } else if (source.type === 'user') {
       router.push(`/user/${source.handle}`);
    }
  };

  // Strip title from body if it matches the header
  const displayBody = (post.title && post.body.startsWith(`# ${post.title}`))
    ? post.body.substring(post.body.indexOf('\n') + 1).trim()
    : post.body;

  // Determine image source
  const imageSource = headerImageUri 
    ? { uri: headerImageUri }
    : post.headerImageKey 
      ? { uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/images/${post.headerImageKey}` }
      : null;

  // Extract sources
  const sources = useMemo(() => {
    const list: any[] = [];
    if (!post.body) return list;

    // External links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(post.body)) !== null) {
      if (match[2].startsWith('http')) {
        list.push({ type: 'external', title: match[1], url: match[2], icon: 'link' });
      }
    }

    // Post links [[post:id|alias]]
    const postRegex = /\[\[post:([^\]]+?)(?:\|([^\]]+?))?\]\]/g;
    while ((match = postRegex.exec(post.body)) !== null) {
      const id = match[1];
      const alias = match[2];
      const resolvedTitle = referenceMetadata[id]?.title;
      list.push({ 
          type: 'post', 
          id, 
          title: alias || resolvedTitle || 'Referenced Post', 
          icon: 'description' 
      });
    }

    // Topic links [[Topic]]
    const topicRegex = /\[\[([^\]:]+?)\]\]/g; // Simplified, assumes no prefix means topic
    while ((match = topicRegex.exec(post.body)) !== null) {
       // Avoid matching post: or other prefixes if simplified regex catches them
       if (!match[1].startsWith('post:')) {
         const parts = match[1].split('|');
         list.push({ type: 'topic', title: parts[0], alias: parts[1], icon: 'tag' });
       }
    }

    // Mentions @handle
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    while ((match = mentionRegex.exec(post.body)) !== null) {
      list.push({ type: 'user', handle: match[1], title: `@${match[1]}`, icon: 'person' });
    }

    return list;
  }, [post.body]);

  if (!post.author) return null;

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [styles.authorRow, pressed && !disableNavigation && { opacity: 0.7 }]}
        onPress={handleAuthorPress}
        disabled={disableNavigation}
      >
        <Avatar name={post.author.displayName} size={40} />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author.displayName || t('post.unknownUser', 'Unknown')}</Text>
            <MaterialIcons name="circle" size={4} color={COLORS.tertiary} style={styles.dotIcon} />
            <Text style={styles.metaText}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
        {onMenuPress && (
          <Pressable
            onPress={onMenuPress}
            hitSlop={12}
            style={({ pressed }: { pressed: boolean }) => [{ padding: 4 }, pressed && { opacity: 0.5 }]}
          >
            <MaterialIcons name="more-horiz" size={20} color={COLORS.tertiary} />
          </Pressable>
        )}
      </Pressable>

      {/* Content */}
      <Pressable
        onPress={handlePostPress}
        disabled={disableNavigation}
        style={({ pressed }: { pressed: boolean }) => [styles.content, pressed && !disableNavigation && { opacity: 0.9 }]}
      >
        {post.title && (
          <Text style={styles.title}>{post.title}</Text>
        )}
        <MarkdownText referenceMetadata={referenceMetadata}>{displayBody}</MarkdownText>
        {imageSource && (
          <Image
            source={imageSource}
            style={styles.headerImage}
            contentFit="cover"
            transition={300}
            placeholder={post.headerImageBlurhash}
            placeholderContentFit="cover"
            cachePolicy="memory-disk"
          />
        )}
      </Pressable>

      {/* Sources Section */}
      {showSources && sources.length > 0 && (
        <View style={styles.sourcesSection}>
          <Text style={styles.sourcesHeader}>{t('post.sources', 'SOURCES')}</Text>
          {sources.map((source, index) => (
            <Pressable 
              key={index} 
              style={({ pressed }) => [styles.sourceItem, pressed && { backgroundColor: COLORS.hover }]}
              onPress={() => handleSourcePress(source)}
            >
              <Text style={styles.sourceNumber}>{index + 1}</Text>
              <View style={styles.sourceIcon}>
                <Text style={styles.sourceIconText}>
                  {source.type === 'external' && source.url 
                    ? (new URL(source.url).hostname).charAt(0).toUpperCase()
                    : (source.title || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceDomain}>
                  {source.type === 'external' && source.url 
                    ? new URL(source.url).hostname 
                    : source.type === 'user' ? 'User' : 'Topic/Post'}
                </Text>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {source.alias || source.title || source.handle}
                </Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={COLORS.tertiary} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.m,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  dotIcon: {
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  content: {
    gap: SPACING.s,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    lineHeight: 24,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  headerImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    marginTop: SPACING.m,
  },
  sourcesSection: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  sourcesHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    marginBottom: SPACING.m,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.m,
  },
  sourceNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    minWidth: 20,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceIconText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  sourceContent: {
    flex: 1,
    gap: 2,
  },
  sourceDomain: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  sourceText: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
});
