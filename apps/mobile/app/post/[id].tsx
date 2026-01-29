import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl, Alert, Platform, Share, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PostItem } from '../../components/PostItem';
import { PostContent } from '../../components/PostContent';
import { MarkdownText } from '../../components/MarkdownText';
import { Post } from '../../types';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function PostDetailScreen() {
  const { id, highlightReplyId } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [referencedBy, setReferencedBy] = useState<Post[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);

  // Scroll ref for deep linking (basic implementation)

  const scrollViewRef = useRef<ScrollView>(null);

  const [highlightY, setHighlightY] = useState<number | null>(null);
  const repliesSectionY = useRef(0);

  useEffect(() => {
    if (highlightY !== null && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: highlightY, animated: true });
      }, 500); // Slight delay for layout to settle
    }
  }, [highlightY]);



  useEffect(() => {

    if (!id) return;



    // Track view
    api.post(`/posts/${id}/view`).catch(() => { });

    // Track read time on unmount
    const startTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 5) {
        api.post(`/posts/${id}/read-time`, { duration }).catch(() => { });
      }
    };
  }, [id]);

  const loadPost = async () => {
    try {
      // Step 1: Load main post content first for instant display
      const postRes = await api.get(`/posts/${id}`);
      setPost(postRes);
      setLiked(postRes.isLiked || false);
      setKept(postRes.isKept || false);
      setLoading(false); // Show content now

      // Step 2: Load supplementary data in background
      Promise.all([
        api.get(`/posts/${id}/replies`),
        api.get(`/posts/${id}/referenced-by`),
        api.get(`/posts/${id}/sources`),
      ]).then(([repliesRes, referencedRes, sourcesRes]) => {
        setReplies(Array.isArray(repliesRes) ? repliesRes : []);
        setReferencedBy(Array.isArray(referencedRes) ? referencedRes : []);
        setSources(Array.isArray(sourcesRes) ? sourcesRes : []);
      });
    } catch (error) {
      // console.error('Failed to load post', error);
      setLoading(false);
    }
  };

  const handleLike = async () => {
    const previous = liked;
    setLiked(!previous);
    try {
      if (previous) {
        await api.delete(`/posts/${id}/like`);
      } else {
        await api.post(`/posts/${id}/like`);
      }
    } catch (error) {
      setLiked(previous);
      // console.error('Failed to toggle like', error);
    }
  };

  const handleKeep = async () => {
    const previous = kept;
    setKept(!previous);
    try {
      if (previous) {
        await api.delete(`/posts/${id}/keep`);
      } else {
        await api.post(`/posts/${id}/keep`);
      }
    } catch (error) {
      setKept(previous);
      // console.error('Failed to toggle keep', error);
    }
  };

  const handleReport = async (targetId: string, type: 'POST' | 'REPLY') => {
    Alert.alert(
      t('post.reportTitle', 'Report Content'),
      t('post.reportMessage', 'Are you sure you want to report this content?'),
      [
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('post.report', 'Report'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/reports`, {
                targetId,
                targetType: type,
                reason: 'Reported via mobile app detail view',
              });
              showSuccess(t('post.reportSuccess', 'Content reported successfully'));
            } catch (error) {
              // console.error('Failed to report', error);
              showError(t('post.reportError', 'Failed to report content'));
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post by @${post.author.handle}: https://cite.app/post/${post.id}`,
        url: `https://cite.app/post/${post.id}`, // iOS
      });
    } catch (error) {
      // console.error(error);
    }
  };

  const handlePostMenu = () => {
    Alert.alert(
      t('post.options', 'Post Options'),
      undefined,
      [
        { text: t('post.report', 'Report Post'), onPress: () => handleReport(id as string, 'POST'), style: 'destructive' },
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      ]
    );
  };

  const handleReplyMenu = (replyId: string) => {
    Alert.alert(
      t('post.options', 'Reply Options'),
      undefined,
      [
        { text: t('post.report', 'Report Reply'), onPress: () => handleReport(replyId, 'REPLY'), style: 'destructive' },
        { text: t('common.cancel', 'Cancel'), style: 'cancel' },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('post.loading')}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('post.noPost')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack', 'Go back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('post.thread')}</Text>
        <Pressable onPress={handlePostMenu} hitSlop={10} style={{ padding: 4 }}>
          <MaterialIcons name="more-horiz" size={24} color={COLORS.paper} />
        </Pressable>
      </View>

      <View style={styles.postContent}>
        <PostContent post={post} disableNavigation />

        <View style={styles.stats}>
          <Text style={styles.stat}>{post.replyCount} {t('post.replies')}</Text>
          <Text style={styles.stat}>{post.quoteCount} {t('post.quotes')}</Text>
          {post.readingTimeMinutes ? <Text style={styles.stat}>{post.readingTimeMinutes} {t('post.minRead', 'min read')}</Text> : null}
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push(`/post/${post.id}/reading`)}
            accessibilityLabel={t('post.readArticle', 'Read article')}
            accessibilityRole="button"
          >
            <MaterialIcons name="menu-book" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>{t('post.readArticle', 'Read')}</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/post/compose', params: { replyTo: post.id } })}
            accessibilityLabel={t('post.reply')}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>{t('post.reply')}</Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={() => router.push({ pathname: '/post/compose', params: { quote: post.id } })}
            accessibilityLabel={t('post.quote')}
            accessibilityRole="button"
          >
            <Text style={styles.actionButtonText}>{t('post.quote')}</Text>
          </Pressable>
        </View>
      </View>

      {sources.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('post.sources', 'SOURCES')}</Text>
          {sources.map((source: any, index: number) => (
            <Pressable
              key={source.id || index}
              style={styles.sourceItem}
              onPress={async () => {
                if (source.type === 'external' && source.url) {
                  Linking.openURL(source.url).catch((err: any) => {
                    console.error('Failed to open URL', err);
                    showError(t('post.failedOpenUrl', 'Failed to open URL'));
                  });
                } else if (source.type === 'post') {
                  router.push(`/post/${source.id}`);
                } else if (source.type === 'topic') {
                  router.push(`/topic/${source.slug}`);
                } else if (source.type === 'user') {
                  router.push(`/user/${source.handle}`);
                }
              }}
              accessibilityLabel={`${t('post.source', 'Source')} ${index + 1}: ${source.title || source.url}`}
              accessibilityRole="link"
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
                    : source.type === 'user' ? 'User'
                      : source.type === 'topic' ? 'Topic'
                        : 'Post'}
                </Text>
                <Text style={styles.sourceTitle} numberOfLines={1}>
                  {source.alias || source.title || source.handle || source.url}
                </Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={COLORS.tertiary} />
            </Pressable>
          ))}
        </View>
      )}

      {referencedBy.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>REFERENCED BY</Text>
            <Text style={styles.sectionCount}>{referencedBy.length} {t('post.replies')}</Text>
          </View>
          {referencedBy.slice(0, 2).map((refPost) => (
            <PostItem key={refPost.id} post={refPost} />
          ))}
          {referencedBy.length > 2 && (
            <Pressable style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>{t('post.viewAllReferences')}</Text>
            </Pressable>
          )}
        </View>
      )}

      <View
        style={styles.section}
        onLayout={(event) => {
          repliesSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.sectionTitle}>{t('post.replies')}</Text>
        {replies.map((reply) => (
          <View
            key={reply.id}
            onLayout={(event) => {
              if (highlightReplyId === reply.id) {
                const itemY = event.nativeEvent.layout.y;
                const totalY = repliesSectionY.current + itemY;
                setHighlightY(totalY);
              }
            }}
            style={[
              styles.replyItem,
              highlightReplyId === reply.id && { backgroundColor: COLORS.hover, borderColor: COLORS.primary, borderWidth: 1 }
            ]}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={styles.authorRow}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarTextSmall}>{reply.author.displayName.charAt(0)}</Text>
                </View>
                <Text style={styles.displayNameSmall}>{reply.author.displayName}</Text>
                <Text style={styles.handleSmall}>@{reply.author.handle}</Text>
              </View>
              <Pressable onPress={() => handleReplyMenu(reply.id)} hitSlop={10}>
                <MaterialIcons name="more-horiz" size={20} color={COLORS.tertiary} />
              </Pressable>
            </View>
            <View style={{ marginTop: 4 }}>
              <MarkdownText>{reply.body}</MarkdownText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.bottomActions}>
        <Pressable
          style={styles.bottomActionButton}
          onPress={() => router.push({ pathname: '/post/compose', params: { replyTo: post.id } })}
          accessibilityLabel={t('post.reply')}
          accessibilityRole="button"
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color={COLORS.tertiary} />
          <Text style={styles.bottomActionText}>{t('post.reply')}</Text>
        </Pressable>
        <Pressable
          style={styles.bottomActionButton}
          onPress={() => router.push({ pathname: '/post/compose', params: { quote: post.id } })}
          accessibilityLabel={t('post.quote')}
          accessibilityRole="button"
        >
          <MaterialIcons name="format-quote" size={20} color={COLORS.tertiary} />
          <Text style={styles.bottomActionText}>{t('post.quote')}</Text>
        </Pressable>
        <Pressable
          style={styles.bottomActionButton}
          onPress={handleLike}
          accessibilityLabel={liked ? t('post.liked') : t('post.like')}
          accessibilityRole="button"
        >
          <MaterialIcons
            name={liked ? "favorite" : "favorite-border"}
            size={20}
            color={liked ? (COLORS.like || COLORS.primary) : COLORS.tertiary}
          />
          <Text style={[styles.bottomActionText, liked && { color: (COLORS.like || COLORS.primary) }]}>
            {liked ? t('post.liked') : t('post.like')}
          </Text>
        </Pressable>
        <Pressable
          style={styles.bottomActionButton}
          onPress={handleKeep}
          accessibilityLabel={kept ? t('post.kept') : t('post.keep')}
          accessibilityRole="button"
        >
          <MaterialIcons
            name={kept ? "bookmark" : "bookmark-border"}
            size={20}
            color={kept ? COLORS.primary : COLORS.tertiary}
          />
          <Text style={[styles.bottomActionText, kept && { color: COLORS.primary }]}>
            {kept ? t('post.kept') : t('post.keep')}
          </Text>
        </Pressable>
        <Pressable
          style={styles.bottomActionButton}
          onPress={handleShare}
          accessibilityLabel={t('post.share')}
          accessibilityRole="button"
        >
          <MaterialIcons name="share" size={20} color={COLORS.tertiary} />
          <Text style={styles.bottomActionText}>{t('post.share')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: SIZES.iconLarge,
  },
  postContent: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  avatar: {
    width: 48, // h-12 w-12
    height: 48,
    borderRadius: 24, // rounded-full
    backgroundColor: COLORS.hover, // bg-primary/20
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  handle: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.serifSemiBold, // IBM Plex Serif for content
  },
  stats: {
    flexDirection: 'row',
    gap: SPACING.l,
    marginTop: SPACING.l,
    marginBottom: SPACING.l,
  },
  stat: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  actionButton: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  section: {
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    marginHorizontal: SPACING.l,
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
  sourceTitle: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  viewAllButton: {
    padding: SPACING.m,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  bottomActionButton: {
    alignItems: 'center',
    gap: 4,
  },
  bottomActionText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  replyItem: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatarSmall: {
    width: 32, // h-8 w-8
    height: 32,
    borderRadius: 16, // rounded-full
    backgroundColor: COLORS.hover, // bg-primary/20
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  displayNameSmall: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginRight: 4,
    fontFamily: FONTS.semiBold,
  },
  handleSmall: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  replyBody: {
    fontSize: 16,
    color: COLORS.secondary,
    lineHeight: 24,
    marginTop: 4,
    fontFamily: FONTS.serifRegular, // IBM Plex Serif for content
  },
  loadingText: {
    color: COLORS.tertiary,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: SPACING.xl,
    fontFamily: FONTS.regular,
  },
});