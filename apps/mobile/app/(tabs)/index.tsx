import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { ErrorState } from '../../components/ErrorState';
import { ComposeEditor } from '../../components/ComposeEditor';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Only load feed if authenticated
    // Let auth context handle redirects to avoid navigation before mount
    if (isAuthenticated) {
      loadFeed(1, true);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadFeed = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setPosts([]);
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      const data = await api.get(`/feed?page=${pageNum}&limit=20`);
      // Handle feed items (can be posts or saved_by events)
      const feedItems = Array.isArray(data.items || data) ? (data.items || data) : [];
      const processedPosts = feedItems.map((item: any) => {
        if (item.type === 'saved_by') {
          const post = item.data.post || item.data;
          return {
            ...post,
            author: post.author || { 
              id: post.authorId || '', 
              handle: 'unknown', 
              displayName: 'Unknown User' 
            },
            _isSavedBy: true,
            _savedBy: item.data,
          };
        }
        const post = item.data || item;
        return {
          ...post,
          author: post.author || { 
            id: post.authorId || '', 
            handle: 'unknown', 
            displayName: 'Unknown User' 
          },
        };
      });
      
      if (reset) {
        setPosts(processedPosts);
      } else {
        setPosts(prev => [...prev, ...processedPosts]);
      }
      
      // Check if there's more data
      const hasMoreData = processedPosts.length === 20 && (data.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error: any) {
      // If 401, auth handler will redirect - don't set error state
      if (error?.status === 401) {
        // Auth handler will redirect, just stop loading
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      console.error('Failed to load feed', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadFeed(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(1, true);
  }, []);


  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item._isSavedBy) {
      return (
        <View style={styles.savedByItem}>
          <View style={styles.savedByHeader}>
            <MaterialIcons name="bookmark" size={14} color={COLORS.tertiary} />
            <Text style={styles.savedByText}>
              {t('home.savedByPrefix')} <Text style={styles.savedByHighlight}>{item._savedBy.userName}</Text> {t('home.savedBySuffix')} {item._savedBy.collectionName}
            </Text>
          </View>
          <PostItem post={item} />
        </View>
      );
    }
    return <PostItem post={item} />;
  }, [t]);

  const keyExtractor = useCallback((item: any) => item.id || `saved-${item._savedBy?.userId}-${item.id}`, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  return (
    <View style={[styles.container, { paddingBottom: 56 + insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logo}>
            <MaterialIcons name="all-inclusive" size={24} color={COLORS.paper} />
          </View>
          <Text style={styles.headerTitle}>{t('home.title')}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable 
            onPress={() => router.push('/search')} 
            style={styles.headerActionButton}
            accessibilityLabel={t('home.search')}
            accessibilityRole="button"
          >
            <MaterialIcons name="search" size={20} color={COLORS.tertiary} />
          </Pressable>
          <Pressable 
            onPress={() => router.push('/settings')} 
            style={styles.headerActionButton}
            accessibilityLabel={t('settings.title')}
            accessibilityRole="button"
          >
            <MaterialIcons name="more-horiz" size={20} color={COLORS.tertiary} />
          </Pressable>
        </View>
      </View>

      {error && posts.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          ListHeaderComponent={<ComposeEditor />}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('home.empty')}
              </Text>
              {!loading && (
                <View style={styles.emptyButtons}>
                  <Pressable
                    style={styles.emptyButton}
                    onPress={() => router.push('/explore')}
                    accessibilityLabel={t('home.exploreTopics')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.emptyButtonText}>{t('home.exploreTopics')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.emptyButton}
                    onPress={() => router.push('/search')}
                    accessibilityLabel={t('home.findPeople')}
                    accessibilityRole="button"
                  >
                    <Text style={styles.emptyButtonText}>{t('home.findPeople')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
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
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
    paddingBottom: 0, // Will be set dynamically
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  logo: {
    width: 40, // w-10
    height: 40, // h-10
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16, // text-base
    fontWeight: '700', // font-bold
    color: COLORS.paper, // text-paper
    letterSpacing: -0.5, // tracking-tight
    fontFamily: FONTS.semiBold,
    marginLeft: SPACING.m, // gap-3
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m, // gap-3
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s, // gap-2
  },
  headerActionButton: {
    padding: SPACING.s, // p-2
  },
  savedByItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  savedByHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    gap: 6,
  },
  savedByText: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  savedByHighlight: {
    color: COLORS.paper,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondary,
    marginBottom: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
  },
  emptyButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.borderRadiusPill,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
