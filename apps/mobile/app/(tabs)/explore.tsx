import { Text, View, FlatList, Pressable, ScrollView, RefreshControl, ActivityIndicator, TextInput, PanResponder } from 'react-native';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { TopicCard } from '../../components/ExploreCards';
import { UserCard } from '../../components/UserCard';
import { COLORS, SPACING, SIZES, FONTS, HEADER, toDimension, createStyles, FLATLIST_DEFAULTS } from '../../constants/theme';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState, emptyStateCenterWrapStyle } from '../../components/EmptyState';
import { ListFooterLoader } from '../../components/ListFooterLoader';
import { useAuth } from '../../context/auth';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<'topics' | 'people' | 'quoted' | 'deep-dives' | 'newsroom'>('quoted');

  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const onEndReachedFiredRef = useRef(false);
  const MAX_PAGE = 50;

  const EXPLORE_TABS = ['quoted', 'deep-dives', 'newsroom', 'topics', 'people'] as const;
  const swipeThreshold = 60;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          return Math.abs(dx) > Math.abs(dy) * 1.2 && Math.abs(dx) > swipeThreshold;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx } = gestureState;
          const idx = EXPLORE_TABS.indexOf(activeTab);
          if (dx < -swipeThreshold && idx < EXPLORE_TABS.length - 1) {
            Haptics.selectionAsync();
            setActiveTab(EXPLORE_TABS[idx + 1]);
          } else if (dx > swipeThreshold && idx > 0) {
            Haptics.selectionAsync();
            setActiveTab(EXPLORE_TABS[idx - 1]);
          }
        },
      }),
    [activeTab],
  );

  useEffect(() => {
    if (params.tab) {
      const tabName = Array.isArray(params.tab) ? params.tab[0] : params.tab;
      if (['topics', 'people', 'quoted', 'deep-dives', 'newsroom'].includes(tabName)) {
        setActiveTab(tabName as any);
      }
    }
    if (params.q) {
      const query = Array.isArray(params.q) ? params.q[0] : params.q;
      setSearchQuery(query);
    }
  }, [params.tab, params.q]);

  // When tab changes: load content for current tab (always recommended)
  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      setData([]);
      loadContent(1, true, undefined);
    }
  }, [activeTab, isAuthenticated]);

  // When search query changes: debounce then run search for active tab; if cleared, load explore feed
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!isAuthenticated) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (searchQuery.trim() === '') {
      setPage(1);
      setData([]);
      loadContent(1, true, '');
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      setPage(1);
      setData([]);
      loadContent(1, true, undefined);
      searchDebounceRef.current = null;
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const loadContent = async (pageNum: number, reset = false, overrideSearchQuery?: string) => {
    if (!reset && (loading || loadingMore)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      onEndReachedFiredRef.current = false;
    } else {
      setLoadingMore(true);
    }
    setError(false);
    const queryTrimmed = (overrideSearchQuery !== undefined ? overrideSearchQuery : searchQuery).trim();
    const isSearchMode = queryTrimmed.length > 0;

    try {
      let items: any[] = [];
      let hasMoreData = false;

      if (isSearchMode) {
        // Search API for the active tab
        if (activeTab === 'topics') {
          const res = await api.get<{ hits: any[] }>(`/search/topics?q=${encodeURIComponent(queryTrimmed)}&limit=20`);
          items = (res.hits || []).map((t: any) => ({ ...t, title: t.title || t.slug }));
          hasMoreData = false;
        } else if (activeTab === 'people') {
          const res = await api.get<{ hits: any[] }>(`/search/users?q=${encodeURIComponent(queryTrimmed)}&limit=20`);
          items = res.hits || [];
          hasMoreData = false;
        } else {
          const offset = (pageNum - 1) * 20;
          const res = await api.get<{ hits: any[] }>(`/search/posts?q=${encodeURIComponent(queryTrimmed)}&limit=20&offset=${offset}`);
          const raw = res.hits || [];
          items = raw.map((item: any) => ({
            ...item,
            author: item.author || {
              id: item.authorId || '',
              handle: item.author?.handle || t('post.unknownUser', 'Unknown'),
              displayName: item.author?.displayName || t('post.unknownUser', 'Unknown'),
              avatarKey: item.author?.avatarKey,
              avatarUrl: item.author?.avatarUrl,
            },
          }));
          hasMoreData = items.length === 20;
        }
      } else {
        let endpoint = '/explore/topics';
        if (activeTab === 'people') endpoint = '/explore/people';
        else if (activeTab === 'quoted') endpoint = '/explore/quoted-now';
        else if (activeTab === 'deep-dives') endpoint = '/explore/deep-dives';
        else if (activeTab === 'newsroom') endpoint = '/explore/newsroom';
        const params: Record<string, string> = { page: pageNum.toString(), limit: '20', sort: 'recommended' };
        const qs = new URLSearchParams(params).toString();
        const res = await api.get(`${endpoint}?${qs}`);
        const rawItems = Array.isArray(res.items || res) ? (res.items || res) : [];
        const normalized = rawItems.map((item: any) => ({
          ...item,
          author: item.author || {
            id: item.authorId || '',
            handle: item.handle || t('post.unknownUser', 'Unknown'),
            displayName: item.displayName || t('post.unknownUser', 'Unknown'),
          },
        }));
        const seen = new Set<string>();
        items = normalized.filter((item: any) => {
          const k = item.id ?? item.slug ?? '';
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        hasMoreData = items.length === 20 && (res.hasMore !== false);
      }

      if (reset) {
        setData(items);
      } else {
        setData(prev => {
          const prevSeen = new Set(prev.map((p: any) => p.id ?? p.slug).filter(Boolean));
          const appended = items.filter((item: any) => !prevSeen.has(item.id ?? item.slug));
          return prev.concat(appended);
        });
      }
      setHasMore(hasMoreData);
    } catch (error: any) {
      if (error?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      console.error('Failed to load content', error);
      setError(true);
      // Stop pagination on any error (e.g. 503) so we don't retry infinitely when scrolling
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleFollow = async (topic: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Optimistic update
      setData(prev => prev.map(item =>
        item.id === topic.id ? { ...item, isFollowing: !item.isFollowing } : item
      ));

      if (topic.isFollowing) {
        await api.delete(`/topics/${encodeURIComponent(topic.slug)}/follow`);
      } else {
        await api.post(`/topics/${encodeURIComponent(topic.slug)}/follow`);
      }
    } catch (err) {
      console.error('Follow failed', err);
      // Revert on failure
      setData(prev => prev.map(item =>
        item.id === topic.id ? { ...item, isFollowing: topic.isFollowing } : item
      ));
    }
  };

  const handleFollowUser = async (user: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setData(prev => prev.map(item =>
        item.id === user.id ? { ...item, isFollowing: !item.isFollowing } : item
      ));
      if (user.isFollowing) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }
    } catch (err) {
      console.error('Follow user failed', err);
      setData(prev => prev.map(item =>
        item.id === user.id ? { ...item, isFollowing: user.isFollowing } : item
      ));
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore && page < MAX_PAGE) {
      if (onEndReachedFiredRef.current) return;
      onEndReachedFiredRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      loadContent(nextPage, false).finally(() => {
        onEndReachedFiredRef.current = false;
      });
    }
    if (page >= MAX_PAGE) setHasMore(false);
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true, undefined);
  }, [activeTab]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (activeTab === 'deep-dives') {
      if (!item || !item.id) return null;
      return <PostItem post={item} />;
    } else if (activeTab === 'people') {
      return (
        <UserCard
          item={item}
          onPress={() => router.push(`/user/${item.handle}`)}
          onFollow={() => handleFollowUser(item)}
        />
      );
    } else if (activeTab === 'quoted') {
      if (!item || !item.id) return null;
      return <PostItem post={item} />;
    } else if (activeTab === 'newsroom') {
      if (!item || !item.id) return null;
      return <PostItem post={item} />;
    } else {
      if (!item || !item.id) return null;
      return (
        <TopicCard
          item={item}
          onPress={() => router.push(`/topic/${encodeURIComponent(item.slug || item.id)}`)}
          onFollow={() => handleFollow(item)}
        />
      );
    }
  }, [activeTab, router, handleFollowUser]);

  const keyExtractor = useCallback((item: any, index: number) => `explore-${activeTab}-${String(item?.id ?? item?.slug ?? `i-${index}`)}`, [activeTab]);

  const listHeader = useMemo(() => (
    <View key="explore-list-header" style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View key="explore-search" style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={HEADER.iconSize} color={HEADER.iconColor} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={COLORS.tertiary}
            returnKeyType="search"
            accessibilityLabel={t('explore.searchPlaceholder')}
            includeFontPadding={false}
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={8}
              accessibilityLabel={t('common.clear')}
            >
              <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View key="explore-tabs" style={styles.tabsContainer}>
        <ScrollView horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent} style={styles.tabsScrollView}>
          {(['quoted', 'deep-dives', 'newsroom', 'topics', 'people'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'deep-dives' ? t('explore.deepDives') :
                  tab === 'quoted' ? t('explore.quoted') :
                    tab === 'newsroom' ? t('explore.newsroom') :
                      t(`explore.${tab}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View key="explore-spacer" style={{ height: SPACING.m }} />
    </View>
  ), [insets.top, activeTab, t, searchQuery]);

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {error && data.length === 0 ? (
        <ErrorState onRetry={() => loadContent(1, true)} onDismiss={() => setError(false)} />
      ) : (
        <FlatList
          data={['quoted', 'deep-dives', 'newsroom'].includes(activeTab) ? data.filter((item: any) => !!item?.author) : data}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={emptyStateCenterWrapStyle}>
              {loading ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{t('common.loading')}</Text>
                </View>
              ) : (
                <EmptyState
                  icon="explore"
                  headline={t('explore.noContent', 'No content yet')}
                  subtext={t('explore.noContentHint', 'Try another filter or check back later.')}
                />
              )}
            </View>
          }
          ListFooterComponent={<ListFooterLoader visible={!!(hasMore && loadingMore)} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          contentContainerStyle={[
            { paddingBottom: 80 },
            (['quoted', 'deep-dives', 'newsroom'].includes(activeTab) ? data.filter((item: any) => !!item?.author) : data).length === 0 && { flexGrow: 1 },
          ]}
          {...FLATLIST_DEFAULTS}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
        />
      )}

    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerContainer: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: toDimension(HEADER.barPaddingHorizontal),
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingVertical: SPACING.m,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    height: 48,
    paddingHorizontal: toDimension(SPACING.l),
    gap: SPACING.m,
  },
  searchInput: {
    flex: 1,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    gap: SPACING.xl,
    paddingRight: SPACING.l,
  },
  tab: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
