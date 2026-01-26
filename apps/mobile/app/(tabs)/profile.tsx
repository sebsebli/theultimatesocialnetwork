import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { handle } = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSelf, setIsSelf] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'collections'>('posts');

  const loadProfile = async (pageNum: number, reset = false) => {
    try {
      let data;
      if (handle) {
        data = await api.get(`/users/${handle}`);
        setIsSelf(false);
      } else {
        data = await api.get('/users/me');
        setIsSelf(true);
      }

      setUser(data);
      if (data.isFollowing !== undefined) {
        setIsFollowing(data.isFollowing);
      }

      // Load posts/replies/quotes with pagination
      let postsData;
      if (activeTab === 'replies') {
        postsData = await api.get(`/users/${data.id || 'me'}/replies?page=${pageNum}&limit=20`);
      } else if (activeTab === 'quotes') {
        postsData = await api.get(`/users/${data.id || 'me'}/quotes?page=${pageNum}&limit=20`);
      } else if (activeTab === 'collections') {
        postsData = await api.get(`/users/${data.id || 'me'}/collections?page=${pageNum}&limit=20`);
      } else {
        postsData = await api.get(`/users/${data.id || 'me'}/posts?page=${pageNum}&limit=20&type=${activeTab}`);
      }
      const items = Array.isArray(postsData.items || postsData) ? (postsData.items || postsData) : [];

      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      const hasMoreData = items.length === 20 && (postsData.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error: any) {
      // If 401, auth handler will redirect - don't log error
      if (error?.status === 401) {
        return;
      }
      console.error('Failed to load profile', error);
      // Show user-friendly error if no data exists
      if (reset && posts.length === 0 && !loadingMore) {
        showError(t('profile.loadError', 'Failed to load profile. Please try again.'));
      }
    }
  };

  useEffect(() => {
    // Only load profile if authenticated (or viewing someone else's profile)
    // Let auth context handle redirects to avoid navigation before mount
    if (handle || isAuthenticated) {
      setPage(1);
      setPosts([]);
      loadProfile(1, true);
    }
  }, [handle, activeTab, isAuthenticated]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile(1, true);
    setRefreshing(false);
  };

  const handleLoadMore = useCallback(() => {
    if (!refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      setLoadingMore(true);
      loadProfile(nextPage, false).finally(() => setLoadingMore(false));
    }
  }, [refreshing, loadingMore, hasMore, page, handle, activeTab]);

  const handleFollow = async () => {
    if (isSelf) {
      router.push('/settings');
      return;
    }

    const previousState = isFollowing;
    setIsFollowing(!previousState); // Optimistic

    try {
      if (previousState) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }
    } catch (error) {
      console.error('Failed to update follow status', error);
      setIsFollowing(previousState); // Revert
    }
  };

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

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
        {!isSelf && (
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <MaterialIcons name="arrow-back-ios" size={24} color={COLORS.paper} />
          </Pressable>
        )}
        {isSelf && <View style={{ width: 40 }} />}

        <Pressable
          style={styles.iconButton}
          onPress={() => router.push('/settings')}
          accessibilityLabel={t('settings.title')}
          accessibilityRole="button"
        >
          <MaterialIcons name="settings" size={24} color={COLORS.paper} />
        </Pressable>
      </View>

      {!user ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              {/* Profile Info - Centered */}
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {user.displayName?.charAt(0) || user.handle?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.identityBlock}>
                  <Text style={styles.name}>{user.displayName}</Text>
                  <Text style={styles.handle}>@{user.handle}</Text>
                </View>

                {user.bio && (
                  <Text style={styles.bio}>{user.bio}</Text>
                )}

                <Pressable
                  style={[
                    styles.actionButtonOutline,
                    !isSelf && isFollowing && styles.actionButtonFilled
                  ]}
                  onPress={handleFollow}
                  accessibilityLabel={isSelf ? t('profile.editProfile') : (isFollowing ? t('profile.unfollow') : t('profile.follow'))}
                  accessibilityRole="button"
                >
                  <Text style={[
                    styles.actionButtonText,
                    !isSelf && isFollowing && styles.actionButtonTextFilled
                  ]}>
                    {isSelf ? t('profile.editProfile') : (isFollowing ? t('profile.following') : t('profile.follow'))}
                  </Text>
                </Pressable>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.followerCount}</Text>
                  <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{user.followingCount}</Text>
                  <Text style={styles.statLabel}>{t('profile.following')}</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="verified" size={16} color={COLORS.tertiary} />
                  </View>
                  <Text style={styles.statNumber}>{user.quoteReceivedCount}</Text>
                  <Text style={[styles.statLabel, { color: COLORS.primary }]}>{t('profile.quotes')}</Text>
                </View>
              </View>

              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {(['posts', 'replies', 'quotes', 'collections'] as const).map((tab) => (
                  <Pressable
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                    accessibilityLabel={t(`profile.${tab}`)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab }}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {t(`profile.${tab}`)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{t('profile.noPosts')}</Text>
            </View>
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
          contentContainerStyle={styles.scrollContent}
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
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingTop: 0, // Handled dynamically
    paddingBottom: SPACING.s,
  },
  iconButton: {
    padding: SPACING.s,
    borderRadius: 20,
    backgroundColor: COLORS.hover,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.l,
    gap: SPACING.l,
  },
  avatarContainer: {
    marginBottom: SPACING.xs,
  },
  avatar: {
    width: 96, // h-24
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  identityBlock: {
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 24, // text-2xl
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  handle: {
    fontSize: 14, // text-sm
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  bio: {
    fontSize: 15,
    color: 'rgba(242, 242, 242, 0.9)', // text-main/90
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: FONTS.regular,
  },
  actionButtonOutline: {
    height: 38,
    minWidth: 120,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  actionButtonFilled: {
    backgroundColor: COLORS.tertiary,
    borderColor: COLORS.tertiary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.2,
  },
  actionButtonTextFilled: {
    color: COLORS.ink,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 53, 56, 0.2)', // cite-border/20
    marginBottom: 0,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -12,
    right: -12,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 53, 56, 0.3)',
    backgroundColor: 'rgba(11, 11, 12, 0.95)', // backdrop blur simul
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.tertiary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  tabTextActive: {
    color: COLORS.paper,
    fontWeight: '600',
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
