import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Text, View, Pressable, Share, Platform, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api, getWebAppBaseUrl } from '../../utils/api';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { PostItem } from '../../components/PostItem';
import { UserCard } from '../../components/UserCard';
import { TopicCard } from '../../components/ExploreCards';
import { EmptyState, emptyStateCenterWrapStyle } from '../../components/EmptyState';
import { TopicCollectionHeader } from '../../components/TopicCollectionHeader';
import { TopicOrCollectionLayout } from '../../components/TopicOrCollectionLayout';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../../constants/theme';
import * as WebBrowser from 'expo-web-browser';

const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const STICKY_FADE_RANGE = 80;

/**
 * Topic detail – same layout as collection detail; only the data source (topic by slug) differs.
 * Route: /topic/[slug]. Not in the tab bar.
 */
export default function TopicScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const slugStr = (Array.isArray(slug) ? slug?.[0] : slug) ?? '';
  const { t } = useTranslation();

  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'start-here' | 'new' | 'people' | 'source'>('new');
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [moreTopics, setMoreTopics] = useState<any[]>([]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, HERO_FADE_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [STICKY_HEADER_APPEAR, STICKY_HEADER_APPEAR + STICKY_FADE_RANGE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const loadTopic = useCallback(async (pageNum: number, reset = false) => {
    if (!slugStr) {
      setLoading(false);
      setRefreshing(false);
      setTopic(null);
      return;
    }
    const slugEnc = encodeURIComponent(slugStr);
    if (reset) {
      setLoading(true);
      setPage(1);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get(`/topics/${slugEnc}`);
      setTopic(data);
      setIsFollowing((data as any).isFollowing || false);

      let endpoint = `/topics/${slugEnc}/posts`;
      if (activeTab === 'start-here') {
        if (reset && data.startHere && data.startHere.length > 0) {
          setPosts(data.startHere);
          setHasMore(false);
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          return;
        }
        endpoint = `/topics/${slugEnc}/posts?sort=ranked`;
      } else if (activeTab === 'new') {
        endpoint = `/topics/${slugEnc}/posts?sort=recent`;
      }
      if (activeTab === 'people') endpoint = `/topics/${slugEnc}/people`;
      if (activeTab === 'source') endpoint = `/topics/${slugEnc}/sources`;

      const sep = endpoint.includes('?') ? '&' : '?';
      const postsData = await api.get(`${endpoint}${sep}page=${pageNum}&limit=20`);
      const items = Array.isArray(postsData.items || postsData) ? (postsData.items || postsData) : [];

      if (reset) setPosts(items);
      else setPosts(prev => [...prev, ...items]);

      setHasMore(items.length === 20 && (postsData.hasMore !== false));
    } catch (error) {
      console.error('Failed to load topic', error);
      setTopic(null);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [slugStr, activeTab]);

  useEffect(() => {
    setPage(1);
    loadTopic(1, true);
  }, [slugStr, activeTab, loadTopic]);

  useEffect(() => {
    api.get('/explore/topics?limit=10')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.items ?? data ?? []);
        setMoreTopics(list.filter((t: any) => (t.slug || t.id) !== slugStr).slice(0, 10));
      })
      .catch(() => { });
  }, [slugStr]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTopic(1, true);
  }, [loadTopic]);

  const handleLoadMore = useCallback(() => {
    if (!refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTopic(nextPage, false);
    }
  }, [refreshing, loadingMore, hasMore, page, loadTopic]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (activeTab === 'people') {
      return (
        <UserCard
          item={{
            id: item.id,
            handle: item.handle,
            displayName: item.displayName,
            bio: item.bio,
            avatarKey: item.avatarKey,
            avatarUrl: item.avatarUrl,
            isFollowing: item.isFollowing,
          }}
          onPress={() => router.push(`/user/${item.handle}`)}
          onFollow={async () => {
            try {
              if (item.isFollowing) await api.delete(`/users/${item.id}/follow`);
              else await api.post(`/users/${item.id}/follow`);
              loadTopic(1, true);
            } catch (e) {
              console.error('Follow failed', e);
            }
          }}
        />
      );
    }
    if (activeTab === 'source') {
      return (
        <Pressable
          style={styles.sourceItem}
          onPress={async () => {
            if (item.url) await WebBrowser.openBrowserAsync(item.url);
          }}
        >
          <View style={styles.sourceIcon}>
            <Text style={styles.sourceIconText}>{(item.title || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.sourceContent}>
            <Text style={styles.sourceDomain}>{item.url ? new URL(item.url).hostname : 'External'}</Text>
            <Text style={styles.sourceText} numberOfLines={1}>{item.title || item.url}</Text>
          </View>
          <MaterialIcons name="open-in-new" size={HEADER.iconSize} color={COLORS.tertiary} />
        </Pressable>
      );
    }
    return <PostItem post={item} />;
  }, [activeTab, router]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const listData = activeTab === 'people' ? posts : posts.filter((p: any) => !!p?.author);

  const ListEmptyComponent = useMemo(() => {
    if (loading) return null;
    const emptyContent =
      activeTab === 'people' ? (
        <EmptyState icon="people-outline" headline={t('topic.emptyPeople')} subtext={t('topic.emptyPeopleSubtext')} />
      ) : activeTab === 'source' ? (
        <EmptyState icon="link" headline={t('topic.emptySources')} subtext={t('topic.emptySourcesSubtext')} />
      ) : (
        <EmptyState icon="article" headline={t('topic.emptyPosts')} subtext={t('topic.emptyPostsSubtext')} />
      );
    return <View style={emptyStateCenterWrapStyle}>{emptyContent}</View>;
  }, [loading, activeTab, t]);

  const handleFollow = useCallback(async () => {
    if (!slugStr) return;
    try {
      const slugEnc = encodeURIComponent(slugStr);
      if (isFollowing) await api.delete(`/topics/${slugEnc}/follow`);
      else await api.post(`/topics/${slugEnc}/follow`);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  }, [slugStr, isFollowing]);

  const handleShareTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    if (!slugStr) return;
    const url = `${getWebAppBaseUrl()}/topic/${encodeURIComponent(slugStr)}`;
    const message = t('topic.shareTopicMessage', { defaultValue: 'Check out this topic on Citewalk', slug: slugStr });
    const sharePayload =
      Platform.OS === 'android'
        ? { message: `${message}\n${url}`, title: t('topic.shareTopic', 'Share topic') }
        : { message: `${message}\n${url}`, url, title: t('topic.shareTopic', 'Share topic') };
    Share.share(sharePayload).catch(() => { });
  }, [slugStr, t]);

  const handleSearchInTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    router.push({ pathname: '/search', params: { topicSlug: slugStr } });
  }, [router, slugStr]);

  const headerComponent = useMemo(() => {
    if (!topic) return null;
    return (
      <>
        <TopicCollectionHeader
          type="topic"
          title={topic.title}
          description={topic.description}
          onBack={() => router.back()}
          onAction={handleFollow}
          actionLabel={isFollowing ? t('profile.following') : t('profile.follow')}
          isActionActive={isFollowing}
          metrics={{ postCount: topic.postCount, contributorCount: topic.contributorCount }}
          rightAction="more"
          onRightAction={() => setMoreOptionsVisible(true)}
        >
          <View style={styles.tabsContainer}>
            {(['start-here', 'new', 'people', 'source'] as const).map((tab) => (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                accessibilityLabel={t(`topic.${tab}`)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'start-here' ? t('topic.relevance', 'Relevance') : tab === 'new' ? t('topic.latest', 'Latest') : tab === 'source' ? t('topic.sources', 'Sources') : t(`topic.${tab}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </TopicCollectionHeader>
        {moreTopics.length > 0 ? (
          <View style={styles.moreSection}>
            <Text style={styles.moreSectionTitle}>{t('topic.moreTopics', 'More topics')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.moreScrollContent}>
              {moreTopics.map((tpc: any) => (
                <View key={tpc.id || tpc.slug} style={styles.moreCardWrap}>
                  <TopicCard
                    item={tpc}
                    onPress={() => router.push(`/topic/${encodeURIComponent(tpc.slug || tpc.id)}`)}
                    onFollow={async () => {
                      try {
                        if (tpc.isFollowing) await api.delete(`/topics/${encodeURIComponent(tpc.slug)}/follow`);
                        else await api.post(`/topics/${encodeURIComponent(tpc.slug)}/follow`);
                        setMoreTopics(prev => prev.map(x => ((x.id || x.slug) === (tpc.id || tpc.slug) ? { ...x, isFollowing: !tpc.isFollowing } : x)));
                      } catch (e) {
                        /* ignore */
                      }
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </>
    );
  }, [topic, isFollowing, moreTopics, activeTab, t, handleFollow, router]);

  return (
    <TopicOrCollectionLayout
      title={topic?.title ?? t('topic.title', 'Topic')}
      loading={loading}
      notFound={!loading && !topic}
      notFoundMessage={t('topic.notFound')}
      onBack={() => router.back()}
      headerComponent={headerComponent}
      heroOpacity={heroOpacity}
      stickyOpacity={stickyOpacity}
      onScroll={() => { }}
      scrollY={scrollY}
      data={listData}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListEmptyComponent={ListEmptyComponent}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={handleLoadMore}
      hasMore={hasMore}
      loadingMore={loadingMore}
      children={
        <OptionsActionSheet
          visible={moreOptionsVisible}
          title={topic?.title ?? ''}
          options={[
            { label: t('topic.searchInTopic', 'Search in topic'), onPress: handleSearchInTopic, icon: 'search' },
            { label: t('topic.shareTopic', 'Share topic'), onPress: handleShareTopic, icon: 'share' },
          ]}
          cancelLabel={t('common.cancel', 'Cancel')}
          onCancel={() => setMoreOptionsVisible(false)}
        />
      }
    />
  );
}

const styles = createStyles({
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
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
  sourceContent: { flex: 1, gap: 2 },
  sourceDomain: { fontSize: 12, color: COLORS.secondary, fontFamily: FONTS.regular },
  sourceText: { fontSize: 14, color: COLORS.paper, fontFamily: FONTS.medium },
  moreSection: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  moreSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  moreScrollContent: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    paddingRight: SPACING.xl,
  },
  moreCardWrap: { width: 280, maxWidth: 280 },
});
