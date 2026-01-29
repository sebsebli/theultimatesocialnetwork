import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { PersonCard } from '../../components/ExploreCards';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
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
    if (reset) {
      setLoading(true);
      setPage(1);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get(`/topics/${slugStr}`);
      setTopic(data);
      setIsFollowing((data as any).isFollowing || false);

      let endpoint = `/topics/${slugStr}/posts`;
      if (activeTab === 'start-here') {
        if (reset && data.startHere) {
          setPosts(data.startHere);
          updateStickyImage(data.startHere);
          setHasMore(false);
          return;
        }
        endpoint = `/topics/${slugStr}/posts?sort=ranked`;
      }

      if (activeTab === 'people') endpoint = `/topics/${slugStr}/people`;
      if (activeTab === 'source') endpoint = `/topics/${slugStr}/sources`;

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
    // Only set if not already set to ensure stability (deterministic per session)
    setStickyHeaderImageKey(prev => {
      if (prev) return prev;
      const found = items.find(p => p.headerImageKey)?.headerImageKey;
      return found || null;
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
        <PersonCard
          item={item}
          onPress={() => router.push(`/user/${item.handle}`)}
          showWhy={false}
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
          <MaterialIcons name="open-in-new" size={16} color={COLORS.tertiary} />
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

  const handleFollow = async () => {
    if (!slugStr) return;
    try {
      if (isFollowing) {
        await api.delete(`/topics/${slugStr}/follow`);
      } else {
        await api.post(`/topics/${slugStr}/follow`);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to toggle follow', error);
    }
  };

  // Find a header image from the posts if available
  // const headerImageKey = useMemo(() => {
  //   return posts.find(p => p.headerImageKey)?.headerImageKey;
  // }, [posts]);

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
            {stickyHeaderImageKey ? (
              <Image
                source={{ uri: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/images/${stickyHeaderImageKey}` }}
                style={styles.topicHeaderImage}
                contentFit="cover"
                transition={300}
              />
            ) : (
              <View style={styles.topicHeaderPlaceholder} />
            )}

            <Pressable
              onPress={() => router.back()}
              accessibilityLabel="Go back"
              accessibilityRole="button"
              style={styles.backButtonAbsolute}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name="arrow-back" size={24} color="#FFF" />
              </View>
            </Pressable>

            <View style={styles.headerRightAbsolute}>
              <Pressable
                style={styles.iconCircle}
                onPress={() => router.push('/search')}
              >
                <MaterialIcons name="search" size={20} color="#FFF" />
              </Pressable>
            </View>

            <View style={styles.headerOverlay}>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>{topic.title}</Text>
                <View style={styles.metricsRow}>
                  <Text style={styles.metricText}>{(topic.postCount || 0).toLocaleString()} posts</Text>
                  <Text style={styles.metricText}>•</Text>
                  <Text style={styles.metricText}>{(topic.contributorCount || 0).toLocaleString()} contributors</Text>
                </View>
              </View>
              <Pressable
                style={[styles.followButton, isFollowing && styles.followButtonActive]}
                onPress={handleFollow}
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
    height: 200,
    backgroundColor: COLORS.ink,
    position: 'relative',
    marginBottom: SPACING.m,
  },
  topicHeaderImage: {
    width: '100%',
    height: '100%',
    opacity: 0.6,
  },
  topicHeaderPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.hover,
  },
  headerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.l,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)', // Simple scrim
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
    flex: 1,
    marginRight: SPACING.m,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  metricText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontFamily: FONTS.regular,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButtonAbsolute: {
    position: 'absolute',
    top: SPACING.header,
    left: SPACING.l,
    zIndex: 10,
  },
  headerRightAbsolute: {
    position: 'absolute',
    top: SPACING.header,
    right: SPACING.l,
    zIndex: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
    color: '#FFFFFF', // White text for overlay
    fontFamily: FONTS.semiBold,
  },
  followButtonTextActive: {
    color: '#FFFFFF',
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
