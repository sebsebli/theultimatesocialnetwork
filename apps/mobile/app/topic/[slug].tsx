import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Share, Platform, ScrollView, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getWebAppBaseUrl } from '../../utils/api';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { PostItem } from '../../components/PostItem';
import { UserCard } from '../../components/UserCard';
import { TopicCard } from '../../components/ExploreCards';
import { EmptyState } from '../../components/EmptyState';
import { ListFooterLoader } from '../../components/ListFooterLoader';
import { TopicCollectionHeader, pickRandomHeaderImageKey } from '../../components/TopicCollectionHeader';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS } from '../../constants/theme';
import type { ViewProps } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/** Typed Animated.View for React 19 JSX compatibility */
const AnimatedView = Animated.View as (props: ViewProps & { style?: any }) => React.ReactElement | null;

const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const STICKY_FADE_RANGE = 80;

export default function TopicScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams();
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
  const [stickyHeaderImageKey, setStickyHeaderImageKey] = useState<string | null>(null);
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [moreTopics, setMoreTopics] = useState<any[]>([]);
  const [stickyVisible, setStickyVisible] = useState(false);
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

  // ... loadTopic ...

  const loadTopic = async (pageNum: number, reset = false) => {
    if (!slugStr) return;
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
        if (reset && data.startHere) {
          setPosts(data.startHere);
          updateStickyImage(data.startHere);
          setHasMore(false);
          return;
        }
        endpoint = `/topics/${slugEnc}/posts?sort=ranked`;
      }

      if (activeTab === 'people') endpoint = `/topics/${slugEnc}/people`;
      if (activeTab === 'source') endpoint = `/topics/${slugEnc}/sources`;

      const sep = endpoint.includes('?') ? '&' : '?';
      const postsData = await api.get(`${endpoint}${sep}page=${pageNum}&limit=20`);
      const items = Array.isArray(postsData.items || postsData) ? (postsData.items || postsData) : [];

      if (reset) {
        setPosts(items);
        if (activeTab === 'new' || activeTab === 'start-here') updateStickyImage(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      const hasMoreData = items.length === 20 && (postsData.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Failed to load topic', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const updateStickyImage = (items: any[]) => {
    setStickyHeaderImageKey(prev => {
      if (prev) return prev;
      return pickRandomHeaderImageKey(items, slugStr);
    });
  };

  useEffect(() => {
    setPage(1);
    loadTopic(1, true);
  }, [slugStr, activeTab]);

  useEffect(() => {
    api.get('/explore/topics?limit=10')
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.items ?? data ?? []);
        setMoreTopics(list.filter((t: any) => (t.slug || t.id) !== slugStr).slice(0, 10));
      })
      .catch(() => { });
  }, [slugStr]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTopic(1, true);
  };

  const handleLoadMore = useCallback(() => {
    if (!refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTopic(nextPage, false);
    }
  }, [refreshing, loadingMore, hasMore, page, slugStr]);

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
              if (item.isFollowing) {
                await api.delete(`/users/${item.id}/follow`);
              } else {
                await api.post(`/users/${item.id}/follow`);
              }
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
  }, [activeTab]);

  // ... rest of component ...

  // Styles needed for SourceItem (copied from PostContent to match)
  // Add these to styles object at bottom


  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListEmptyComponent = useMemo(() => {
    if (loading) return null;
    if (activeTab === 'people') {
      return (
        <EmptyState
          icon="people-outline"
          headline={t('topic.emptyPeople')}
          subtext={t('topic.emptyPeopleSubtext')}
        />
      );
    }
    if (activeTab === 'source') {
      return (
        <EmptyState
          icon="link"
          headline={t('topic.emptySources')}
          subtext={t('topic.emptySourcesSubtext')}
        />
      );
    }
    return (
      <EmptyState
        icon="article"
        headline={t('topic.emptyPosts')}
        subtext={t('topic.emptyPostsSubtext')}
      />
    );
  }, [loading, activeTab, t]);

  const handleFollow = async () => {
    if (!slugStr) return;
    try {
      const slugEnc = encodeURIComponent(slugStr);
      if (isFollowing) {
        await api.delete(`/topics/${slugEnc}/follow`);
      } else {
        await api.post(`/topics/${slugEnc}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  const handleShareTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    if (!slugStr) return;
    const url = `${getWebAppBaseUrl()}/topic/${encodeURIComponent(slugStr)}`;
    const message = t('topic.shareTopicMessage', { defaultValue: 'Check out this topic on Citewalk', slug: slugStr });
    const sharePayload = Platform.OS === 'android'
      ? { message: `${message}\n${url}`, title: t('topic.shareTopic', 'Share topic') }
      : { message: `${message}\n${url}`, url, title: t('topic.shareTopic', 'Share topic') };
    Share.share(sharePayload).catch(() => { });
  }, [slugStr, t]);

  const handleSearchInTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    router.push({ pathname: '/search', params: { topicSlug: slugStr } });
  }, [router, slugStr]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('topic.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!topic) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
          <Text style={styles.errorText}>{t('topic.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = useMemo(
    () => (
      <>
        <AnimatedView style={{ opacity: heroOpacity }}>
          <TopicCollectionHeader
            type="topic"
            title={topic.title}
            description={topic.description}
            headerImageKey={stickyHeaderImageKey}
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
                    {tab === 'start-here' ? t('topic.relevance', 'Relevance') :
                      tab === 'new' ? t('topic.latest', 'Latest') :
                        tab === 'source' ? t('topic.sources', 'Sources') :
                          t(`topic.${tab}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </TopicCollectionHeader>
        </AnimatedView>
        {moreTopics.length > 0 ? (
          <View style={styles.moreSection}>
            <Text style={styles.moreSectionTitle}>{t('topic.moreTopics', 'More topics')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moreScrollContent}
            >
              {moreTopics.map((t: any) => (
                <View key={t.id || t.slug} style={styles.moreCardWrap}>
                  <TopicCard
                    item={t}
                    onPress={() => router.push(`/topic/${encodeURIComponent(t.slug || t.id)}`)}
                    onFollow={async () => {
                      try {
                        if (t.isFollowing) {
                          await api.delete(`/topics/${encodeURIComponent(t.slug)}/follow`);
                        } else {
                          await api.post(`/topics/${encodeURIComponent(t.slug)}/follow`);
                        }
                        setMoreTopics(prev => prev.map(x => (x.id || x.slug) === (t.id || t.slug) ? { ...x, isFollowing: !t.isFollowing } : x));
                      } catch (e) { /* ignore */ }
                    }}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </>
    ),
    [topic, stickyHeaderImageKey, isFollowing, moreTopics, activeTab, heroOpacity, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AnimatedView
        style={[styles.stickyBar, { opacity: stickyOpacity, paddingTop: insets.top }]}
        pointerEvents={stickyVisible ? 'auto' : 'none'}
      >
        <View style={styles.stickyBarContent}>
          <Pressable onPress={() => router.back()} style={styles.stickyBackBtn} accessibilityLabel={t('common.back', 'Back')}>
            <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.stickyBarTitle} numberOfLines={1}>{topic.title}</Text>
          <View style={styles.stickyBarSpacer} />
        </View>
      </AnimatedView>
      <Animated.FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: (e: any) => setStickyVisible(e.nativeEvent.contentOffset.y > STICKY_HEADER_APPEAR) }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<ListFooterLoader visible={!!(hasMore && loadingMore)} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        {...FLATLIST_DEFAULTS}
      />
      <OptionsActionSheet
        visible={moreOptionsVisible}
        title={topic.title}
        options={[
          { label: t('topic.searchInTopic', 'Search in topic'), onPress: handleSearchInTopic, icon: 'search' },
          { label: t('topic.shareTopic', 'Share topic'), onPress: handleShareTopic, icon: 'share' },
        ]}
        cancelLabel={t('common.cancel', 'Cancel')}
        onCancel={() => setMoreOptionsVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  list: {
    flex: 1,
  },
  loadingText: {
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: FONTS.regular,
  },
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
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
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
  moreCardWrap: {
    width: 280,
    maxWidth: 280,
  },
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  stickyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  stickyBackBtn: {
    padding: SPACING.s,
    marginLeft: -SPACING.s,
  },
  stickyBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  stickyBarSpacer: {
    width: 40,
  },
});
