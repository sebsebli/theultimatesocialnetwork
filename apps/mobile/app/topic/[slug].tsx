import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function TopicScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const { t } = useTranslation();
  const [topic, setTopic] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'start-here' | 'new' | 'people' | 'source'>('start-here');

  const loadTopic = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get(`/topics/${slug}`);
      setTopic(data);
      setIsFollowing((data as any).isFollowing || false);
      
      // Load posts with pagination based on active tab
      let endpoint = `/topics/${slug}/posts`;
      if (activeTab === 'people') endpoint = `/topics/${slug}/people`;
      if (activeTab === 'source') endpoint = `/topics/${slug}/sources`;
      
      const postsData = await api.get(`${endpoint}?page=${pageNum}&limit=20`);
      const items = Array.isArray(postsData.items || postsData) ? (postsData.items || postsData) : [];
      
      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }
      
      const hasMoreData = items.length === 20 && (postsData.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Failed to load topic', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    setPosts([]);
    loadTopic(1, true);
  }, [slug, activeTab]);

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
  }, [refreshing, loadingMore, hasMore, page, slug]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <PostItem post={item} />
  ), []);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await api.delete(`/topics/${slug}/follow`);
      } else {
        await api.post(`/topics/${slug}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('topic.loading')}</Text>
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('topic.notFound')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Pressable 
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
            >
              <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
            </Pressable>
            <Text style={styles.headerTitle}>{topic.title}</Text>
            <View style={styles.headerRight}>
              <Pressable 
                style={styles.headerIconButton}
                onPress={() => router.push('/search')}
                accessibilityLabel={t('home.search')}
                accessibilityRole="button"
              >
                <MaterialIcons name="search" size={20} color={COLORS.tertiary} />
              </Pressable>
              <Pressable 
                style={[styles.followButton, isFollowing && styles.followButtonActive]}
                onPress={handleFollow}
                accessibilityLabel={isFollowing ? t('profile.following') : t('profile.follow')}
                accessibilityRole="button"
              >
                <Text style={[styles.followButtonText, isFollowing && styles.followButtonTextActive]}>
                  {isFollowing ? t('profile.following') : t('profile.follow')}
                </Text>
              </Pressable>
            </View>
          </View>

          {topic.description && (
            <View style={styles.topicDescription}>
              <View style={styles.descriptionBorder} />
              <Text style={styles.descriptionText}>{topic.description}</Text>
            </View>
          )}

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
                  {tab === 'start-here' ? t('topic.startHere') : 
                   tab === 'source' ? t('topic.source') :
                   t(`topic.${tab}`)}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      }
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  headerIconButton: {
    padding: SPACING.xs,
  },
  topicDescription: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  descriptionBorder: {
    width: 2,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.m,
  },
  descriptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.paper,
    lineHeight: 22,
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
  followButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'transparent',
  },
  followButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  followButtonTextActive: {
    color: '#FFFFFF',
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});