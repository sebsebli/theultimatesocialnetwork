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
  const { isAuthenticated, resetOnboarding } = useAuth();
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
      api.get('/users/suggested?limit=5').then(res => setSuggestions(Array.isArray(res) ? res : [])).catch(() => { });
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

    const startTime = Date.now();
    try {
      const limit = 20;
      const offset = (pageNum - 1) * limit;

      // Add rudimentary request ID tracking if API supports it or generates it
      // const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const data = await api.get(`/feed?limit=${limit}&offset=${offset}`);

      // Validate payload shape
      if (!data || (!Array.isArray(data) && !Array.isArray(data.items))) {
        throw new Error('Invalid feed payload');
      }

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
      const duration = Date.now() - startTime;
      console.error('[Feed] Load failed', {
        status: error?.status,
        message: error?.message,
        duration,
        user: isAuthenticated ? 'auth' : 'guest',
      });

      if (error?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      // Server says profile/onboarding incomplete — send user back to onboarding (never show feed without full onboarding)
      if (error?.status === 403) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        await resetOnboarding();
        return;
      }
      setError(true);
      if (posts.length === 0 && !loading) {
        showError(t('feed.loadError', 'Failed to load feed. Please check your connection.'));
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


  const renderItem = useCallback(({ item }: { item: Post }) => {
    if (item._isSavedBy && item._savedBy) {
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

  const keyExtractor = useCallback((item: Post) => item.id || `saved-${item._savedBy?.userId}-${item.id}`, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  // Updated Empty State Components
  const InviteNudge = () => (
    <Pressable
      style={styles.inviteNudgeContainer}
      onPress={() => router.push('/invites')}
    >
      <View style={styles.inviteIconCircle}>
        <MaterialIcons name="person-add" size={24} color={COLORS.ink} />
      </View>
      <View style={styles.inviteTextContainer}>
        <Text style={styles.inviteTitle}>{t('home.inviteFriends', 'Invite Friends')}</Text>
        <Text style={styles.inviteDesc}>{t('home.inviteDesc', 'Build your network. CITE is better with friends.')}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.tertiary} />
    </Pressable>
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
          contentContainerStyle={{ paddingBottom: 56 + insets.bottom }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyHeadline}>{t('home.emptyHeadline', 'Your timeline is quiet.')}</Text>
              <Text style={styles.emptySubtext}>{t('home.emptySubtext', 'Follow people and topics to see posts here.')}</Text>

              {!loading && (
                <View style={styles.emptyActions}>
                  <InviteNudge />
                  {suggestions.length > 0 && (
                    <View style={styles.suggestionsBlock}>
                      <Text style={styles.suggestionsHeader}>{t('home.suggestedPeople', 'People to follow')}</Text>
                      {suggestions.map((item: any) => (
                        <View key={item.id} style={styles.suggestionRow}>
                          <PersonCard item={item} onPress={() => router.push(`/user/${item.handle}`)} showWhy={false} fullWidth />
                        </View>
                      ))}
                    </View>
                  )}
                  <Pressable
                    style={styles.secondaryButton}
                    onPress={() => router.push('/(tabs)/explore')}
                  >
                    <Text style={styles.secondaryButtonText}>{t('home.exploreTopics', 'Explore Topics')}</Text>
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
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.error,
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
    marginTop: SPACING.xxl,
  },
  emptyHeadline: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  emptyActions: {
    width: '100%',
    gap: SPACING.l,
    alignItems: 'center',
  },
  suggestionsBlock: {
    width: '100%',
    marginBottom: SPACING.m,
  },
  suggestionsHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  suggestionRow: {
    marginBottom: SPACING.s,
  },
  inviteNudgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    padding: SPACING.l,
    borderRadius: SIZES.borderRadius,
    width: '100%',
  },
  inviteIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
  },
  inviteTextContainer: {
    flex: 1,
  },
  inviteTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 2,
    fontFamily: FONTS.semiBold,
  },
  inviteDesc: {
    fontSize: 13,
    color: COLORS.ink,
    opacity: 0.8,
    fontFamily: FONTS.medium,
  },
  secondaryButton: {
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});