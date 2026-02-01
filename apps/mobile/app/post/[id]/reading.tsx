import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Dimensions,
  Animated,
} from 'react-native';
import type { ScrollViewProps, ViewProps } from 'react-native';

/** Typed Animated components for React 19 JSX compatibility */
const AnimatedScrollView = Animated.ScrollView as (props: ScrollViewProps & { style?: any }) => React.ReactElement | null;
const AnimatedView = Animated.View as (props: ViewProps & { style?: any }) => React.ReactElement | null;

import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { api, getImageUrl } from '../../../utils/api';
import { MarkdownText } from '../../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles, toDimension, toDimensionValue } from '../../../constants/theme';
const ACTION_ICON_SIZE = HEADER.iconSize;
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/auth';
import AddToCollectionSheet, { AddToCollectionSheetRef } from '../../../components/AddToCollectionSheet';
import ShareSheet, { ShareSheetRef } from '../../../components/ShareSheet';
import { ReportModal } from '../../../components/ReportModal';
import { OptionsActionSheet } from '../../../components/OptionsActionSheet';
import { ConfirmModal } from '../../../components/ConfirmModal';
import { PostPreviewRow } from '../../../components/PostPreviewRow';
import { EmptyState } from '../../../components/EmptyState';
import { useToast } from '../../../context/ToastContext';
import {
  savePostForOffline,
  removeOfflinePost,
  isPostDownloaded,
  getDownloadSavedForOffline,
  type OfflinePost,
} from '../../../utils/offlineStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Post {
  id: string;
  title?: string;
  body: string;
  createdAt: string;
  headerImageKey?: string | null;
  replyCount?: number;
  quoteCount?: number;
  author?: { id?: string; displayName?: string; handle?: string; avatarUrl?: string | null; avatarKey?: string | null };
  isLiked?: boolean;
  isKept?: boolean;
  lang?: string | null;
  referenceMetadata?: Record<string, { title?: string }>;
}

export default function ReadingModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const { showSuccess, showError } = useToast();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [quotedBy, setQuotedBy] = useState<any[]>([]);
  const [sourcesTab, setSourcesTab] = useState<'sources' | 'quoted'>('sources');
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);
  const shareSheetRef = useRef<ShareSheetRef>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const postData = await api.get(`/posts/${postId}`);
      setPost(postData);
      setLiked(!!postData?.isLiked);
      setKept(!!postData?.isKept);
      const [sourcesData, quotesData, downloaded, enabled] = await Promise.all([
        api.get(`/posts/${postId}/sources`).catch(() => []),
        api.get(`/posts/${postId}/quotes`).catch(() => []),
        isPostDownloaded(postId),
        getDownloadSavedForOffline(),
      ]);
      setSources(Array.isArray(sourcesData) ? sourcesData : []);
      setQuotedBy(Array.isArray(quotesData) ? quotesData : quotesData?.items ?? []);
      setIsDownloaded(downloaded);
      setOfflineEnabled(enabled);
    } catch (error: any) {
      setPost(null);
      if (error?.status === 404) {
        showError(t('post.notFoundMessage', "This post doesn't exist anymore."));
        router.back();
      } else {
        showError(t('post.loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [postId, t]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  useEffect(() => {
    if ((post?.quoteCount ?? 0) === 0) setSourcesTab('sources');
  }, [post?.quoteCount]);

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prev = liked;
    setLiked(!prev);
    try {
      if (prev) await api.delete(`/posts/${postId}/like`);
      else await api.post(`/posts/${postId}/like`);
    } catch {
      setLiked(prev);
    }
  };

  const handleKeep = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prev = kept;
    setKept(!prev);
    try {
      if (prev) await api.delete(`/posts/${postId}/keep`);
      else await api.post(`/posts/${postId}/keep`);
    } catch {
      setKept(prev);
    }
  };

  const handleDownloadOffline = async () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isDownloaded) {
        await removeOfflinePost(post.id);
        setIsDownloaded(false);
        showSuccess(t('post.removedFromDevice', 'Removed from device'));
      } else {
        const payload: OfflinePost = {
          id: post.id,
          title: post.title ?? null,
          body: post.body,
          createdAt: post.createdAt,
          headerImageKey: post.headerImageKey ?? null,
          author: post.author,
          lang: post.lang ?? null,
          savedAt: Date.now(),
        };
        await savePostForOffline(payload);
        setIsDownloaded(true);
        showSuccess(t('post.downloadedForOffline', 'Saved for offline reading'));
      }
    } catch (e) {
      showError(t('post.downloadFailed', 'Download failed'));
    }
  };

  const handleReportSubmit = async (reason: string, comment?: string) => {
    try {
      await api.post('/safety/report', {
        targetId: post!.id,
        targetType: 'POST',
        reason,
        comment,
      });
      showSuccess(t('post.reportSuccess', 'Post reported successfully'));
    } catch (e) {
      showError(t('post.reportError', 'Failed to report post'));
      throw e;
    }
  };

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${postId}`);
      showSuccess(t('post.deleted', 'Post deleted'));
      setDeleteConfirmVisible(false);
      setMoreOptionsVisible(false);
      router.back();
    } catch (e: any) {
      showError(e?.message || t('post.deleteFailed', 'Failed to delete post'));
      throw e;
    }
  };

  const isOwnPost = !!post && !!userId && post.author?.id === userId;

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const replyCount = post.replyCount ?? 0;
  const quoteCount = post.quoteCount ?? 0;

  const hasHero = post.headerImageKey != null && post.headerImageKey !== '';

  return (
    <View style={styles.container}>
      {/* Overlay header: back + more over hero or at top (no home button) */}
      <View style={[styles.overlayHeader, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.overlayIconCircle} accessibilityLabel={t('common.back')}>
          <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setMoreOptionsVisible(true);
          }}
          style={styles.overlayIconCircle}
        >
          <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={HEADER.iconColor} />
        </Pressable>
      </View>

      <AnimatedScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // When no hero/title image, add top margin so back button doesn't overlay author line
          !hasHero && {
            paddingTop: insets.top + 40 + toDimension(HEADER.barPaddingBottom) + toDimension(SPACING.s),
          },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Cover: full width, edge-to-edge (overlay header sits on top); fades out on scroll */}
        {hasHero && (() => {
          const heroFadeDistance = SCREEN_WIDTH * 0.6;
          const heroOpacity = scrollY.interpolate({
            inputRange: [0, heroFadeDistance],
            outputRange: [1, 0],
            extrapolate: 'clamp',
          });
          return (
            <AnimatedView style={[styles.heroImageWrap, { height: SCREEN_WIDTH * (3 / 4), opacity: heroOpacity }]}>
              <Image
                source={{ uri: (post.headerImageKey ? getImageUrl(post.headerImageKey) : undefined) || (post as any).headerImageUrl }}
                style={[styles.heroImage, { width: SCREEN_WIDTH, height: SCREEN_WIDTH * (3 / 4) }]}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              {post.title ? (
                <View style={styles.heroTitleOverlay}>
                  <Text style={styles.heroTitleText} numberOfLines={2}>{post.title}</Text>
                </View>
              ) : null}
            </AnimatedView>
          );
        })()}

        <View style={styles.article}>
          {/* Author above title */}
          <Pressable
            style={styles.authorLine}
            onPress={() => post.author?.handle && router.push(`/user/${post.author.handle}`)}
          >
            {(post.author?.avatarKey || post.author?.avatarUrl) ? (
              <Image source={{ uri: post.author?.avatarKey ? getImageUrl(post.author.avatarKey) : post.author?.avatarUrl }} style={styles.authorAvatarImage} />
            ) : (
              <View style={styles.authorAvatar}>
                <Text style={styles.avatarText}>
                  {post.author?.displayName?.charAt(0) || post.author?.handle?.charAt(0) || '?'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle || t('post.unknownUser')}</Text>
              <Text style={styles.readTime}>
                {new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </Text>
            </View>
          </Pressable>

          {/* Title only when no hero overlay (hero already shows title) */}
          {(!hasHero && post.title != null && post.title !== '') ? (
            <Text style={styles.title}>{post.title}</Text>
          ) : null}

          <MarkdownText stripLeadingH1IfMatch={post.title ?? undefined} referenceMetadata={post.referenceMetadata}>{post.body}</MarkdownText>

          {/* Action row: subtle meta bar with smaller icons so it doesn't compete with the article */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                animateLike();
                handleLike();
              }}
            >
              <AnimatedView style={{ transform: [{ scale: scaleValue }] }}>
                <MaterialIcons
                  name={liked ? 'favorite' : 'favorite-border'}
                  size={ACTION_ICON_SIZE}
                  color={liked ? COLORS.like : COLORS.tertiary}
                />
              </AnimatedView>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/post/${postId}/comments`)}
            >
              <MaterialIcons name="chat-bubble-outline" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
              {replyCount > 0 && <Text style={styles.actionCount}>{replyCount}</Text>}
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: '/post/compose', params: { quote: postId } })}
            >
              <MaterialIcons name="format-quote" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
            </Pressable>

            <Pressable style={styles.actionBtn} onPress={handleKeep} accessibilityLabel={t('post.save')}>
              <MaterialIcons
                name={kept ? 'bookmark' : 'bookmark-border'}
                size={ACTION_ICON_SIZE}
                color={kept ? COLORS.primary : COLORS.tertiary}
              />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => collectionSheetRef.current?.open(postId)}
              accessibilityLabel={t('post.addToCollection')}
            >
              <MaterialIcons name="add-circle-outline" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => shareSheetRef.current?.open(postId)}
            >
              <MaterialIcons name="ios-share" size={ACTION_ICON_SIZE} color={COLORS.tertiary} />
            </Pressable>

            {offlineEnabled && (
              <Pressable
                style={styles.actionBtn}
                onPress={handleDownloadOffline}
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

        {/* Tabs: Sources (tagged content) | Quoted by (only when post has quotes) */}
        <View style={styles.section}>
          <View style={styles.tabsRow}>
            <Pressable
              style={[styles.tabBtn, sourcesTab === 'sources' && styles.tabBtnActive]}
              onPress={() => setSourcesTab('sources')}
            >
              <Text style={[styles.tabBtnText, sourcesTab === 'sources' && styles.tabBtnTextActive]}>
                {t('post.sources', 'Sources')}
              </Text>
            </Pressable>
            {quoteCount > 0 && (
              <Pressable
                style={[styles.tabBtn, sourcesTab === 'quoted' && styles.tabBtnActive]}
                onPress={() => setSourcesTab('quoted')}
              >
                <Text style={[styles.tabBtnText, sourcesTab === 'quoted' && styles.tabBtnTextActive]}>
                  {t('post.quotedBy', 'Quoted by')} ({quoteCount})
                </Text>
              </Pressable>
            )}
          </View>
          {sourcesTab === 'sources' ? (
            sources.length === 0 ? (
              <Text style={styles.emptyText}>{t('post.noSources', 'No tagged sources in this post.')}</Text>
            ) : (
              <View style={styles.sourcesList}>
                {sources.map((source: any, index: number) => {
                  const handleSourcePress = () => {
                    if (source.type === 'external' && source.url) Linking.openURL(source.url).catch(() => { });
                    else if (source.type === 'post' && source.id) router.push(`/post/${source.id}`);
                    else if (source.type === 'user' && source.handle) router.push(`/user/${source.handle}`);
                    else if (source.type === 'topic' && source.slug) router.push(`/topic/${encodeURIComponent(source.slug)}`);
                  };
                  const title = source.title || source.url || source.handle || source.slug || '';
                  const subtitle = source.type === 'external' && source.url
                    ? (() => { try { return new URL(source.url).hostname.replace('www.', ''); } catch { return ''; } })()
                    : source.type === 'user' ? `@${source.handle}` : source.type === 'topic' ? t('post.topic', 'Topic') : '';
                  return (
                    <Pressable key={source.id || index} style={styles.sourceCard} onPress={handleSourcePress}>
                      <View style={styles.sourceCardLeft}>
                        {source.type === 'user' ? (
                          <View style={styles.sourceAvatar}>
                            <Text style={styles.sourceAvatarText}>
                              {(source.title || source.handle || '?').charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        ) : (
                          <View style={styles.sourceIconWrap}>
                            <MaterialIcons
                              name={source.type === 'post' ? 'article' : source.type === 'topic' ? 'tag' : 'link'}
                              size={HEADER.iconSize}
                              color={COLORS.primary}
                            />
                          </View>
                        )}
                        <View style={styles.sourceCardText}>
                          <Text style={styles.sourceCardTitle} numberOfLines={1}>{title}</Text>
                          {subtitle ? <Text style={styles.sourceCardSubtitle} numberOfLines={1}>{subtitle}</Text> : null}
                        </View>
                      </View>
                      <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : quotedBy.length === 0 ? (
            <EmptyState icon="format-quote" headline={t('post.noQuotes', 'No one has quoted this post yet.')} compact />
          ) : (
            <View style={{ gap: 0 }}>
              {quotedBy.map((p: any) => (
                <PostPreviewRow key={p.id} post={p} />
              ))}
            </View>
          )}
        </View>
      </AnimatedScrollView>

      <AddToCollectionSheet ref={collectionSheetRef} />
      <ShareSheet ref={shareSheetRef} />
      <OptionsActionSheet
        visible={moreOptionsVisible}
        title={t('post.options', 'Post Options')}
        options={[
          ...(isOwnPost ? [{ label: t('post.delete', 'Delete Post'), onPress: () => { setMoreOptionsVisible(false); setDeleteConfirmVisible(true); }, destructive: true as const, icon: 'delete-outline' as const }] : []),
          { label: t('post.report', 'Report Post'), onPress: () => { setMoreOptionsVisible(false); setReportVisible(true); }, destructive: true, icon: 'flag' },
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => setMoreOptionsVisible(false)}
      />
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onReport={handleReportSubmit}
        targetType="POST"
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
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 80 },
  overlayHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    zIndex: 10,
  },
  overlayIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  iconButton: { padding: SPACING.xs },

  /* Full-width hero: 4:3 aspect, title overlay */
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
  actionCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  tabBtn: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginRight: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  tabBtnTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
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
  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sourceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  sourceAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  sourceAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  sourceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  sourceCardText: {
    flex: 1,
    minWidth: 0,
  },
  sourceCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  sourceCardSubtitle: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  errorText: { color: COLORS.error, fontSize: 16, fontFamily: FONTS.medium },
});
