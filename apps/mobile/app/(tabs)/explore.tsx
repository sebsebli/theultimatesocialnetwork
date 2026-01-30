import { StyleSheet, Text, View, FlatList, Pressable, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { TopicCard } from '../../components/ExploreCards';
import { UserCard } from '../../components/UserCard';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
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

  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      setData([]);
      loadContent(1, true);

    }
  }, [activeTab, isAuthenticated]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (!reset && (loading || loadingMore)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      let endpoint = '/explore/topics';

      if (activeTab === 'people') endpoint = '/explore/people';
      else if (activeTab === 'quoted') endpoint = '/explore/quoted-now';
      else if (activeTab === 'deep-dives') endpoint = '/explore/deep-dives';
      else if (activeTab === 'newsroom') endpoint = '/explore/newsroom';

      // Always recommended; language follows user preferences from settings
      const params: Record<string, string> = { page: pageNum.toString(), limit: '20', sort: 'recommended' };
      const query = new URLSearchParams(params).toString();
      const res = await api.get(`${endpoint}?${query}`);
      const rawItems = Array.isArray(res.items || res) ? (res.items || res) : [];
      const normalized = rawItems.map((item: any) => ({
        ...item,
        author: item.author || {
          id: item.authorId || '',
          handle: item.handle || t('post.unknownUser', 'Unknown'),
          displayName: item.displayName || t('post.unknownUser', 'Unknown')
        },
      }));
      const seen = new Set<string>();
      const items = normalized.filter((item: any) => {
        const k = item.id ?? item.slug ?? '';
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      if (reset) {
        setData(items);
      } else {
        setData(prev => {
          const prevSeen = new Set(prev.map((p: any) => p.id ?? p.slug).filter(Boolean));
          const appended = items.filter((item: any) => !prevSeen.has(item.id ?? item.slug));
          return prev.concat(appended);
        });
      }

      const hasMoreData = items.length === 20 && (res.hasMore !== false);
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
    if (!loading && !refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadContent(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
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

  const keyExtractor = useCallback((item: any, index: number) => `explore-${activeTab}-${index}-${String(item?.id ?? item?.slug ?? index)}`, [activeTab]);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  const listHeader = useMemo(() => (
    <View key="explore-list-header" style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View key="explore-search" style={styles.searchWrapper}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel={t('explore.searchPlaceholder')}
        >
          <MaterialIcons name="search" size={HEADER.iconSize} color={HEADER.iconColor} />
          <Text style={styles.searchInputPlaceholder}>
            {t('explore.searchPlaceholder')}
          </Text>
        </Pressable>
      </View>

      <View key="explore-tabs" style={styles.tabsContainer}>
        <ScrollView horizontal showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
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
  ), [insets.top, activeTab, t]);

  return (
    <View style={styles.container}>
      {error && data.length === 0 ? (
        <ErrorState onRetry={() => loadContent(1, true)} onDismiss={() => setError(false)} />
      ) : (
        <FlatList
          data={data}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          ListHeaderComponent={listHeader}
          renderItem={renderItem}
          ListEmptyComponent={
            loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('common.loading')}</Text>
              </View>
            ) : (
              <EmptyState
                icon="explore"
                headline={t('explore.noContent', 'No content yet')}
                subtext={t('explore.noContentHint', 'Try another filter or check back later.')}
              />
            )
          }
          ListFooterComponent={ListFooterComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerContainer: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: HEADER.barPaddingHorizontal,
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
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  searchInputPlaceholder: {
    flex: 1,
    color: COLORS.tertiary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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
