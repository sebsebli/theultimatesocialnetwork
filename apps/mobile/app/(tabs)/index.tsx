import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, LayoutAnimation, UIManager, Platform, AppState } from 'react-native';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { COLORS, FONTS, SIZES, SPACING } from '../../constants/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { PostItem } from '../../components/PostItem';
import { useRouter } from 'expo-router';
import { api } from '../../utils/api';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorState } from '../../components/ErrorState';
import { Avatar } from '../../components/Avatar';
import { useSocket } from '../../context/SocketContext';
import { PersonCard } from '../../components/ExploreCards';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { showError } = useToast();
  const { unreadNotifications } = useSocket();
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Only load feed if authenticated
    if (isAuthenticated) {
      loadFeed(1, true);
    } else {
      setLoading(false);
    }
    // ... rest of useEffect
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        if (isAuthenticated) loadFeed(1, true);
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && posts.length === 0) {
      api.get('/users/suggested?limit=3').then(res => setSuggestions(Array.isArray(res) ? res : [])).catch(() => {});
    }
  }, [loading, posts.length]);

  const loadFeed = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      const limit = 20;
      const offset = (pageNum - 1) * limit;
      const data = await api.get(`/feed?limit=${limit}&offset=${offset}`);
      // Handle feed items...
      const feedItems = Array.isArray(data.items || data) ? (data.items || data) : [];
      const processedPosts = feedItems.map((item: any) => {
        if (item.type === 'saved_by') {
          const post = item.data.post || item.data;
          return {
            ...post,
            author: post.author || {
              id: post.authorId || '',
              handle: t('post.unknownUser', 'Unknown'),
              displayName: t('post.unknownUser', 'Unknown')
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
            handle: t('post.unknownUser', 'Unknown'),
            displayName: t('post.unknownUser', 'Unknown')
          },
        };
      });

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      if (reset) {
        setPosts(processedPosts);
      } else {
        setPosts(prev => [...prev, ...processedPosts]);
      }

      const hasMoreData = processedPosts.length === 20 && (data.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error: any) {
      if (error?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      console.error('Failed to load feed', error);
      setError(true);
      if (posts.length === 0 && !loading) {
        showError(t('feed.loadError', 'Failed to load feed. Please check your connection and try again.'));
      }
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

  const BetaNudge = () => (
    <View style={styles.betaNudge}>
      <View style={styles.betaContent}>
        <Text style={styles.betaTitle}>{t('beta.inviteTitle', 'Invite Friends')}</Text>
        <Text style={styles.betaDesc}>{t('beta.inviteDesc', 'Help us grow the community during beta.')}</Text>
      </View>
      <Pressable style={styles.betaButton} onPress={() => router.push('/invites')}>
        <Text style={styles.betaButtonText}>{t('beta.inviteAction', 'Invite')}</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: 56 + insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          {/* Logo or nothing */}
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={styles.headerActionButton}
            accessibilityLabel={t('home.notifications')}
            accessibilityRole="button"
          >
            <View>
              <MaterialIcons name="notifications-none" size={24} color={COLORS.tertiary} />
              {unreadNotifications > 0 && <View style={styles.badge} />}
            </View>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.headerActionButton}
            accessibilityLabel={t('settings.title')}
            accessibilityRole="button"
          >
            <MaterialIcons name="settings" size={24} color={COLORS.tertiary} />
          </Pressable>
        </View>
      </View>

      {error && posts.length === 0 ? (
        <ErrorState onRetry={handleRefresh} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          ListHeaderComponent={posts.length > 0 ? <BetaNudge /> : null}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('home.empty', 'Your feed is quiet.')}
              </Text>
              {!loading && (
                <>
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionsBox}>
                        <Text style={styles.suggestionsTitle}>{t('home.suggestedPeople', 'People to follow')}</Text>
                        {suggestions.map(u => (
                            <View key={u.id} style={{ marginBottom: 12 }}>
                                <PersonCard item={u} onPress={() => router.push(`/user/${u.handle}`)} showWhy={false} />
                            </View>
                        ))}
                    </View>
                  )}
                  <View style={{ marginTop: 24, width: '100%' }}>
                    <BetaNudge />
                  </View>
                  <View style={styles.emptyButtons}>
                    <Pressable
                        style={styles.emptyButton}
                        onPress={() => router.push('/explore')}
                    >
                        <Text style={styles.emptyButtonText}>{t('home.exploreTopics')}</Text>
                    </Pressable>
                  </View>
                </>
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
    paddingBottom: 0,
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
  profileButton: {
    marginRight: SPACING.s,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    letterSpacing: -0.5,
    fontFamily: FONTS.semiBold,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  headerActionButton: {
    padding: SPACING.s,
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
    marginTop: SPACING.l,
  },
  suggestionsBox: {
    width: '100%',
    marginVertical: SPACING.l,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
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
  betaNudge: {
    margin: SPACING.l,
    padding: SPACING.l,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  betaContent: {
    flex: 1,
    marginRight: SPACING.m,
  },
  betaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  betaDesc: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  betaButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
  },
  betaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
    fontFamily: FONTS.semiBold,
  },
});