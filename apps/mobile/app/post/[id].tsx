import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Text, View, ScrollView, Pressable, RefreshControl, Platform, Share, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getWebAppBaseUrl, getAvatarUri } from '../../utils/api';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { SourceOrPostCard } from '../../components/SourceOrPostCard';
import { PostItem } from '../../components/PostItem';
import { PostContent } from '../../components/PostContent';
import { MarkdownText } from '../../components/MarkdownText';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Post } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles } from '../../constants/theme';

export default function PostDetailScreen() {
  const { id, highlightReplyId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { userId } = useAuth();
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
  const [reportTarget, setReportTarget] = useState<{ targetId: string; type: 'POST' | 'REPLY' } | null>(null);
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [replyOptionsVisible, setReplyOptionsVisible] = useState(false);
  const [replyOptionsReplyId, setReplyOptionsReplyId] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedAuthor, setDeniedAuthor] = useState<{ id: string; handle: string; displayName: string; avatarKey?: string | null } | null>(null);

  // Merge API sources with external links extracted from body so all [text](url) show in Sources
  const mergedSources = useMemo(() => {
    const apiExternal = sources.filter((s: any) => s.type === 'external');
    const apiOther = sources.filter((s: any) => s.type !== 'external');
    const urlSeen = new Set(apiExternal.map((s: any) => s.url).filter(Boolean));
    const fromBody: { url: string; title: string | null }[] = [];
    if (post?.body) {
      const linkRegex = /\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g;
      let m;
      while ((m = linkRegex.exec(post.body)) !== null) {
        const url = m[2];
        if (!urlSeen.has(url)) {
          urlSeen.add(url);
          fromBody.push({ url, title: (m[1]?.trim() || null) ?? null });
        }
      }
    }
    return [
      ...apiExternal,
      ...fromBody.map(({ url, title }) => ({ type: 'external' as const, url, title })),
      ...apiOther,
    ];
  }, [sources, post?.body]);

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
    setAccessDenied(false);
    setDeniedAuthor(null);
    try {
      // Step 1: Load main post content first for instant display
      const postRes = await api.get(`/posts/${id}`);
      setPost(postRes);
      setLiked(postRes.isLiked || false);
      setKept(postRes.isKept || false);
      setLoading(false); // Show content now

      // Step 2: Load supplementary data in background (skip for deleted posts)
      if (!postRes.deletedAt) {
        Promise.all([
          api.get(`/posts/${id}/replies`),
          api.get(`/posts/${id}/referenced-by`),
          api.get(`/posts/${id}/sources`),
        ]).then(([repliesRes, referencedRes, sourcesRes]) => {
          setReplies(Array.isArray(repliesRes) ? repliesRes : []);
          setReferencedBy(Array.isArray(referencedRes) ? referencedRes : []);
          setSources(Array.isArray(sourcesRes) ? sourcesRes : []);
        });
      }
    } catch (error: any) {
      setLoading(false);
      setPost(null);
      if (error?.status === 403 && error?.data?.author) {
        setAccessDenied(true);
        setDeniedAuthor(error.data.author as { id: string; handle: string; displayName: string; avatarKey?: string | null });
        return;
      }
      if (error?.status === 404) {
        showError(t('post.notFoundMessage', "This post doesn't exist anymore."));
        router.back();
        return;
      }
    }
  };

  const handleLike = async () => {
    if (!userId) {
      router.replace('/welcome');
      return;
    }
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
    if (!userId) {
      router.replace('/welcome');
      return;
    }
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

  const handleReport = (targetId: string, type: 'POST' | 'REPLY') => setReportTarget({ targetId, type });

  const confirmReport = async () => {
    if (!reportTarget) return;
    try {
      await api.post('/safety/report', {
        targetId: reportTarget.targetId,
        targetType: reportTarget.type,
        reason: 'Reported via mobile app detail view',
      });
      showSuccess(t('post.reportSuccess', 'Content reported successfully'));
    } catch (error) {
      showError(t('post.reportError', 'Failed to report content'));
      throw error;
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = `${getWebAppBaseUrl()}/post/${post.id}`;
    try {
      await Share.share({
        message: `Check out this post by @${post.author.handle}: ${url}`,
        url, // iOS
      });
    } catch (error) {
      // console.error(error);
    }
  };

  const handlePostMenu = () => setPostOptionsVisible(true);

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${id}`);
      showSuccess(t('post.deleted', 'Post deleted'));
      setDeleteConfirmVisible(false);
      setPostOptionsVisible(false);
      router.back();
    } catch (error: any) {
      showError(error?.message || t('post.deleteFailed', 'Failed to delete post'));
      throw error;
    }
  };

  const isOwnPost = !!post && !!userId && post.author?.id === userId;

  const handleReplyMenu = (replyId: string) => {
    setReplyOptionsReplyId(replyId);
    setReplyOptionsVisible(true);
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

  if (accessDenied && deniedAuthor) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('post.thread')} paddingTop={insets.top} />
        <View style={styles.privatePostOverlay}>
          <View style={styles.privatePostBlur}>
            <MaterialIcons name="lock" size={48} color={COLORS.tertiary} />
            <Text style={styles.privatePostTitle}>{t('post.privatePost', 'This is a private post')}</Text>
            <Text style={styles.privatePostSubtext}>
              {t('post.privatePostSubtext', 'Only followers can see this post. Follow the author to request access.')}
            </Text>
          </View>
          <Pressable
            style={styles.privatePostAuthorCard}
            onPress={() => deniedAuthor.handle && router.push(`/user/${deniedAuthor.handle}`)}
          >
            {getAvatarUri({ avatarKey: deniedAuthor.avatarKey }) ? (
              <Image source={{ uri: getAvatarUri({ avatarKey: deniedAuthor.avatarKey })! }} style={styles.privatePostAuthorAvatar} contentFit="cover" />
            ) : (
              <View style={styles.privatePostAuthorAvatarPlaceholder}>
                <Text style={styles.privatePostAuthorInitial}>
                  {(deniedAuthor.displayName || deniedAuthor.handle || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.privatePostAuthorInfo}>
              <Text style={styles.privatePostAuthorName} numberOfLines={1}>{deniedAuthor.displayName || deniedAuthor.handle}</Text>
              <Text style={styles.privatePostAuthorHandle} numberOfLines={1}>@{deniedAuthor.handle}</Text>
            </View>
            <Text style={styles.privatePostFollowCta}>{t('profile.follow', 'Follow')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('post.noPost')}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
        </Pressable>
      </View>
    );
  }

  // Deleted post: show placeholder so graph references still resolve to a page
  if (post.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    return (
      <View style={styles.container}>
        <ScreenHeader title={t('post.thread')} paddingTop={insets.top} />
        <View style={styles.deletedPlaceholder}>
          <MaterialIcons name="delete-outline" size={48} color={COLORS.tertiary} style={styles.deletedPlaceholderIcon} />
          <Text style={styles.deletedPlaceholderText}>
            {t('post.deletedOn', { date: formattedDate, defaultValue: `This post has been deleted on ${formattedDate}.` })}
          </Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.goBack')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        <ScreenHeader
          title={t('post.thread')}
          paddingTop={insets.top}
          right={
            <Pressable onPress={handlePostMenu} hitSlop={10} style={({ pressed }: { pressed: boolean }) => [{ padding: SPACING.s, margin: -SPACING.s }, pressed && { opacity: 0.7 }]}>
              <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={HEADER.iconColor} />
            </Pressable>
          }
        />

        <View style={styles.postContent}>
          <PostContent post={post} disableNavigation referenceMetadata={post.referenceMetadata} />

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
              <MaterialIcons name="menu-book" size={HEADER.iconSize} color={COLORS.primary} />
              <Text style={styles.actionButtonText}>{t('post.readArticle', 'Read')}</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                if (!userId) {
                  router.replace('/welcome');
                  return;
                }
                router.push({ pathname: '/post/compose', params: { replyTo: post.id } });
              }}
              accessibilityLabel={t('post.reply')}
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>{t('post.reply')}</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => {
                if (!userId) {
                  router.replace('/welcome');
                  return;
                }
                router.push({ pathname: '/post/compose', params: { quote: post.id } });
              }}
              accessibilityLabel={t('post.quote')}
              accessibilityRole="button"
            >
              <Text style={styles.actionButtonText}>{t('post.quote')}</Text>
            </Pressable>
          </View>
        </View>

        {mergedSources.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('post.sources', 'Sources')}</Text>
            <View style={styles.sourcesList}>
              {mergedSources.map((source: any, index: number) => {
                const title = source.alias || source.title || source.handle || source.url || source.slug || '';
                const subtitle =
                  source.type === 'external' && source.url
                    ? (source.description?.trim()
                        ? source.description.trim()
                        : (() => {
                            try {
                              return new URL(source.url).hostname.replace('www.', '');
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
                    key={source.type === 'external' && source.url ? `ext-${source.url}` : (source.id ?? `i-${index}`)}
                    type={source.type}
                    title={title}
                    subtitle={subtitle || undefined}
                    onPress={() => {
                      if (source.type === 'external' && source.url) {
                        Linking.openURL(source.url).catch((err: any) => {
                          console.error('Failed to open URL', err);
                          showError(t('post.failedOpenUrl', 'Failed to open URL'));
                        });
                      } else if (source.type === 'post') {
                        router.push(`/post/${source.id}`);
                      } else if (source.type === 'topic') {
                        router.push(`/topic/${encodeURIComponent(source.slug)}`);
                      } else if (source.type === 'user') {
                        router.push(`/user/${source.handle}`);
                      }
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {referencedBy.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('post.referencedBy', 'Referenced by')}</Text>
              <Text style={styles.sectionCount}>{referencedBy.length} {t('post.replies')}</Text>
            </View>
            <View style={styles.sourcesList}>
              {referencedBy.slice(0, 2).map((refPost) => {
                const bodyPreview = (refPost.body ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
                const title = refPost.title ?? bodyPreview || 'Post';
                const subtitle = refPost.author?.displayName || refPost.author?.handle || '';
                return (
                  <SourceOrPostCard
                    key={refPost.id}
                    type="post"
                    title={title}
                    subtitle={subtitle || undefined}
                    onPress={() => (refPost.title ? router.push(`/post/${refPost.id}/reading`) : router.push(`/post/${refPost.id}`))}
                  />
                );
              })}
            </View>
            {referencedBy.length > 2 && (
              <Pressable style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>{t('post.viewAllReferences')}</Text>
              </Pressable>
            )}
          </View>
        )}

        <View
          style={styles.section}
          onLayout={(event: { nativeEvent: { layout: { y: number } } }) => {
            repliesSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Pressable
            onPress={() => router.push(`/post/${id}/comments`)}
            style={styles.sectionHeader}
            accessibilityLabel={t('post.comments', 'Comments')}
            accessibilityRole="button"
          >
            <Text style={styles.sectionTitle}>{t('post.comments', 'Comments')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s }}>
              <Text style={styles.sectionCount}>{replies.length} {(replies.length === 1 ? t('post.replies_one', 'reply') : t('post.replies', 'replies'))}</Text>
              <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
            </View>
          </Pressable>
          {replies.map((reply) => (
            <View
              key={reply.id}
              onLayout={(event: { nativeEvent: { layout: { y: number } } }) => {
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
                  <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={COLORS.tertiary} />
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
            onPress={() => {
              if (!userId) {
                router.replace('/welcome');
                return;
              }
              router.push({ pathname: '/post/compose', params: { replyTo: post.id } });
            }}
            accessibilityLabel={t('post.reply')}
            accessibilityRole="button"
          >
            <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
            <Text style={styles.bottomActionText}>{t('post.reply')}</Text>
          </Pressable>
          <Pressable
            style={styles.bottomActionButton}
            onPress={() => {
              if (!userId) {
                router.replace('/welcome');
                return;
              }
              router.push({ pathname: '/post/compose', params: { quote: post.id } });
            }}
            accessibilityLabel={t('post.quote')}
            accessibilityRole="button"
          >
            <MaterialIcons name="format-quote" size={HEADER.iconSize} color={COLORS.tertiary} />
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
              size={HEADER.iconSize}
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
              size={HEADER.iconSize}
              color={kept ? COLORS.primary : COLORS.tertiary}
            />
            <Text style={[styles.bottomActionText, kept && { color: COLORS.primary }]}>
              {kept ? t('post.kept') : t('post.keep')}
            </Text>
          </Pressable>
          {!post?.author?.isProtected && (
            <Pressable
              style={styles.bottomActionButton}
              onPress={handleShare}
              accessibilityLabel={t('post.share')}
              accessibilityRole="button"
            >
              <MaterialIcons name="ios-share" size={HEADER.iconSize} color={COLORS.tertiary} />
              <Text style={styles.bottomActionText}>{t('post.share')}</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={!!reportTarget}
        title={t('post.reportTitle', 'Report Content')}
        message={t('post.reportMessage', 'Are you sure you want to report this content?')}
        confirmLabel={t('post.report', 'Report')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmReport}
        onCancel={() => setReportTarget(null)}
      />
      <OptionsActionSheet
        visible={postOptionsVisible}
        title={t('post.options', 'Post Options')}
        options={[
          ...(isOwnPost ? [{ label: t('post.delete', 'Delete Post'), onPress: () => { setPostOptionsVisible(false); setDeleteConfirmVisible(true); }, destructive: true as const }] : []),
          { label: t('post.report', 'Report Post'), onPress: () => { setPostOptionsVisible(false); handleReport(id as string, 'POST'); }, destructive: true },
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => setPostOptionsVisible(false)}
      />
      <ConfirmModal
        visible={deleteConfirmVisible}
        title={t('post.delete', 'Delete Post')}
        message={t('post.deleteConfirm', 'Are you sure you want to delete this post? This cannot be undone.')}
        confirmLabel={t('post.delete', 'Delete Post')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
      <OptionsActionSheet
        visible={replyOptionsVisible}
        title={t('post.options', 'Reply Options')}
        options={replyOptionsReplyId ? [
          { label: t('post.report', 'Report Reply'), onPress: () => { setReplyOptionsVisible(false); setReplyOptionsReplyId(null); handleReport(replyOptionsReplyId, 'REPLY'); }, destructive: true },
        ] : []}
        cancelLabel={t('common.cancel')}
        onCancel={() => { setReplyOptionsVisible(false); setReplyOptionsReplyId(null); }}
      />
    </>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  privatePostOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  privatePostBlur: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    minWidth: '100%',
  },
  privatePostTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.l,
  },
  privatePostSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: SPACING.s,
    textAlign: 'center',
  },
  privatePostAuthorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    width: '100%',
    gap: SPACING.m,
  },
  privatePostAuthorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  privatePostAuthorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privatePostAuthorInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  privatePostAuthorInfo: { flex: 1, minWidth: 0 },
  privatePostAuthorName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  privatePostAuthorHandle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  privatePostFollowCta: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
  sourcesList: {
    gap: SPACING.s,
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
  sourceDescription: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
  backButton: {
    marginTop: SPACING.l,
    alignSelf: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  deletedPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  deletedPlaceholderIcon: {
    marginBottom: SPACING.l,
  },
  deletedPlaceholderText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
});