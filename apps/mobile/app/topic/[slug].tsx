import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { UserCard } from '../../components/UserCard';
import { EmptyState } from '../../components/EmptyState';
import { TopicCollectionHeader, pickRandomHeaderImageKey } from '../../components/TopicCollectionHeader';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';
import * as WebBrowser from 'expo-web-browser';

export default function TopicScreen() {
  const router = useRouter();
  // ... existing hooks ...
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

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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
        rightAction="search"
        onRightAction={() => router.push({ pathname: '/search', params: { topicSlug: slugStr } })}
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
                  tab === 'source' ? t('topic.sources', 'Sources') :
                    t(`topic.${tab}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </TopicCollectionHeader>
      <FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        data={posts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
