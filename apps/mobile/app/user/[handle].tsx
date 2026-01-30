import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../utils/api';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ReportModal } from '../../components/ReportModal';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { PostItem } from '../../components/PostItem';
import { ProfileSkeleton, PostSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';

const TAB_BAR_HEIGHT = 50;

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handle } = useLocalSearchParams();
  const { t } = useTranslation();
  const { userId: authUserId } = useAuth();
  const { showError, showSuccess } = useToast();
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [muteConfirmVisible, setMuteConfirmVisible] = useState(false);
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [reportTargetType, setReportTargetType] = useState<'POST' | 'REPLY' | 'USER' | 'DM'>('USER');
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const isOwnProfile = !!user && !!authUserId && user.id === authUserId;
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'saved' | 'collections'>('posts');

  useEffect(() => {
    const h = typeof handle === 'string' ? handle : handle?.[0];
    if (h) loadProfile(1, true);
  }, [handle]);

  // Refetch list when tab changes (posts / replies / quotes / collections), not on initial mount
  const isFirstTabMount = React.useRef(true);
  useEffect(() => {
    if (!user) return;
    if (isFirstTabMount.current) {
      isFirstTabMount.current = false;
      return;
    }
    setPosts([]);
    setPage(1);
    loadProfile(1, true);
  }, [activeTab]);

  const loadProfile = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      // Don't clear posts immediately to avoid flash, unless explicitly needed
      // setPosts([]); 
    } else {
      setLoadingMore(true);
    }

    try {
      // Parallelize user fetch and content fetch for first load
      const handleStr = typeof handle === 'string' ? handle : handle?.[0] ?? '';
      const userPromise = reset ? api.get(`/users/${handleStr}`) : Promise.resolve(user);

      let endpoint = '';
      if (activeTab === 'replies') endpoint = `/users/${user?.id || handle}/replies`; // Use handle if user not yet loaded (API supports handle lookup?) 
      // Actually, API usually needs ID for relations. 
      // Strategy: If resetting, we MUST wait for user ID from first call if we don't have it.
      // But if we have 'user' state, we can run parallel.

      const fetchContent = async (userId: string) => {
        let path;
        if (activeTab === 'saved') path = `/keeps?page=${pageNum}&limit=20`;
        else if (activeTab === 'replies') path = `/users/${userId}/replies?page=${pageNum}&limit=20`;
        else if (activeTab === 'quotes') path = `/users/${userId}/quotes?page=${pageNum}&limit=20`;
        else if (activeTab === 'collections') path = `/users/${userId}/collections?page=${pageNum}&limit=20`;
        else path = `/users/${userId}/posts?page=${pageNum}&limit=20&type=posts`;
        return api.get(path);
      };

      let userData = user;
      let contentData;

      if (reset) {
        userData = await userPromise;
        setUser(userData);
        setFollowing((userData as any).isFollowing || false);
        contentData = await fetchContent(userData.id);
      } else {
        contentData = await fetchContent(user.id);
      }

      // API may return { items, hasMore } or plain array for replies/quotes
      let rawItems = Array.isArray(contentData) ? contentData : (Array.isArray(contentData?.items) ? contentData.items : contentData?.items ?? []);
      // Saved tab: items are keeps with .post; normalize to posts for list
      const items = activeTab === 'saved'
        ? (rawItems as any[]).map((k: any) => k.post).filter(Boolean)
        : rawItems;

      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      const hasMoreData = items.length >= 20 && (contentData?.hasMore !== false);
      // Saved tab: use raw keeps length for hasMore
      const hasMoreSaved = activeTab === 'saved' ? (contentData?.hasMore === true) : hasMoreData;
      setHasMore(activeTab === 'saved' ? hasMoreSaved : hasMoreData);
    } catch (error: any) {
      console.error('Failed to load profile', error);
      if (reset && activeTab === 'posts') setUser(null);
      if (reset) setPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // ... (inside handleFollow)
  const handleFollow = async () => {
    // Optimistic update
    const prevFollowing = following;
    const prevCount = user.followerCount;

    setFollowing(!prevFollowing);
    setUser((prev: any) => ({
      ...prev,
      followerCount: prevFollowing ? prev.followerCount - 1 : prev.followerCount + 1
    }));

    try {
      if (prevFollowing) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
      // Revert
      setFollowing(prevFollowing);
      setUser((prev: any) => ({ ...prev, followerCount: prevCount }));
    }
  };

  const handleMessage = async () => {
    try {
      const thread = await api.post('/messages/threads', { userId: user.id });
      if (thread && thread.id) {
        router.push(`/(tabs)/messages/${thread.id}`);
      }
    } catch (error: any) {
      console.error('Failed to create thread', error);
      const msg = error?.message ?? '';
      if (error?.status === 403 && /follow each other|prior interaction/i.test(msg)) {
        showError(t('messages.mustFollowOrPrior', 'You can only message people who follow you back or who you\'ve messaged before.'));
      } else {
        showError(t('messages.createThreadFailed', 'Could not start conversation. Try again.'));
      }
    }
  };

  const handleBlock = () => setBlockConfirmVisible(true);

  const confirmBlock = async () => {
    try {
      await api.post(`/safety/block/${user.id}`);
      showSuccess(t('safety.blockedMessage', 'This user has been blocked.'));
      router.back();
    } catch (error) {
      console.error('Failed to block user', error);
      showError(t('safety.failedBlock', 'Failed to block user.'));
      throw error;
    }
  };

  const handleMute = () => setMuteConfirmVisible(true);

  const confirmMute = async () => {
    try {
      await api.post(`/safety/mute/${user.id}`);
      showSuccess(t('safety.mutedMessage', 'This user has been muted.'));
    } catch (error) {
      console.error('Failed to mute user', error);
      showError(t('safety.failedMute', 'Failed to mute user.'));
      throw error;
    }
  };

  const handleUserMenu = () => setOptionsModalVisible(true);

  const openReportModal = (targetId: string, type: 'POST' | 'REPLY' | 'USER') => {
    setReportTargetId(targetId);
    setReportTargetType(type);
    setReportModalVisible(true);
  };

  const handleReportSubmit = async (reason: string, comment?: string) => {
    if (!reportTargetId) return;
    await api.post('/safety/report', {
      targetId: reportTargetId,
      targetType: reportTargetType,
      reason,
      comment,
    });
    showSuccess(t('safety.reportSuccess', 'Report submitted successfully'));
  };

  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + 24;

  if (loading && !user) {
    return (
      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
        <View style={styles.headerBar} />
        <ProfileSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('profile.userNotFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky header: back + more – stays on top while content scrolls */}
      <View style={[styles.headerBar, { paddingTop: insets.top + SPACING.s }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => handleUserMenu()}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={HEADER.iconColor} />
        </Pressable>
      </View>

      <FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        data={posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => <PostItem post={item} />}
        ListHeaderComponent={
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.displayName?.charAt(0) || user.handle?.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.identityBlock}>
                <Text style={styles.name}>{user.displayName}</Text>
                <Text style={styles.handle}>@{user.handle}</Text>
              </View>

              {user.bio && (
                <Text style={styles.bio}>{user.bio}</Text>
              )}

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButtonOutline, following && styles.actionButtonActive]}
                  onPress={handleFollow}
                  accessibilityLabel={following ? t('profile.following') : t('profile.follow')}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionButtonText, following && styles.actionButtonTextActive]}>
                    {following ? t('profile.following') : t('profile.follow')}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.messageButton}
                  onPress={handleMessage}
                  accessibilityLabel={t('profile.message')}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="mail-outline" size={HEADER.iconSize} color={HEADER.iconColor} />
                </Pressable>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Pressable
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/user/connections', params: { tab: 'followers', handle: user.handle } })}
              >
                <Text style={styles.statNumber}>{user.followerCount}</Text>
                <Text style={styles.statLabel}>{t('profile.followers')}</Text>
              </Pressable>
              <Pressable
                style={styles.statItem}
                onPress={() => router.push({ pathname: '/user/connections', params: { tab: 'following', handle: user.handle } })}
              >
                <Text style={styles.statNumber}>{user.followingCount}</Text>
                <Text style={styles.statLabel}>{t('profile.following')}</Text>
              </Pressable>
              <View style={styles.statItem}>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="verified" size={HEADER.iconSize} color={COLORS.tertiary} />
                </View>
                <Text style={styles.statNumber}>{user.quoteReceivedCount}</Text>
                <Text style={[styles.statLabel, { color: COLORS.primary }]}>{t('profile.quotes')}</Text>
              </View>
            </View>

            <View style={styles.tabsContainer}>
              {(isOwnProfile
                ? (['posts', 'replies', 'quotes', 'saved', 'collections'] as const)
                : (['posts', 'replies', 'quotes', 'collections'] as const)
              ).map((tab) => (
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
          <EmptyState
            icon="inbox"
            headline={
              activeTab === 'saved' ? t('profile.noSaved', 'No saved posts')
                : activeTab === 'collections' ? t('profile.noCollections', 'No public collections')
                  : activeTab === 'replies' ? t('profile.noReplies', 'No replies yet')
                    : activeTab === 'quotes' ? t('profile.noQuotes', 'No quotes yet')
                      : t('profile.noPosts', 'No posts yet')
            }
            subtext={
              activeTab === 'posts' ? t('profile.noPostsHint', 'Posts will appear here.') : undefined
            }
          />
        }
        ListFooterComponent={loadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        ) : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile(1, true);
              setRefreshing(false);
            }}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={() => loadProfile(page + 1, false).finally(() => setLoadingMore(false))}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />

      <ConfirmModal
        visible={blockConfirmVisible}
        title={t('safety.blockUser', 'Block User')}
        message={t('safety.blockConfirm', `Are you sure you want to block @${user?.handle ?? ''}? You won't see their posts or messages.`)}
        confirmLabel={t('safety.block', 'Block')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={confirmBlock}
        onCancel={() => setBlockConfirmVisible(false)}
      />
      <ConfirmModal
        visible={muteConfirmVisible}
        title={t('safety.muteUser', 'Mute User')}
        message={t('safety.muteConfirm', `Are you sure you want to mute @${user?.handle ?? ''}? You won't see their posts in your feed.`)}
        confirmLabel={t('safety.mute', 'Mute')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmMute}
        onCancel={() => setMuteConfirmVisible(false)}
      />
      <OptionsActionSheet
        visible={optionsModalVisible}
        title={t('profile.options', 'Options for @' + (user?.handle ?? ''))}
        cancelLabel={t('common.cancel')}
        options={[
          { label: t('profile.message'), onPress: handleMessage },
          { label: t('safety.mute', 'Mute User'), onPress: handleMute },
          { label: t('safety.block', 'Block User'), onPress: handleBlock, destructive: true },
          { label: t('safety.report', 'Report User'), onPress: () => openReportModal(user.id, 'USER'), destructive: true },
        ]}
        onCancel={() => setOptionsModalVisible(false)}
      />
      <ReportModal
        visible={reportModalVisible}
        targetType={reportTargetType}
        onClose={() => { setReportModalVisible(false); setReportTargetId(null); }}
        onReport={handleReportSubmit}
        title={t('safety.reportTitle', 'Report')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingBottom: HEADER.barPaddingBottom,
    backgroundColor: COLORS.ink,
  },
  list: {
    flex: 1,
  },
  iconButton: {
    padding: SPACING.s,
    margin: -SPACING.s,
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
    borderRadius: 48, // rounded-full
    backgroundColor: 'rgba(110, 122, 138, 0.2)', // bg-primary/20
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.divider,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.primary,
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
    color: COLORS.paper,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    fontFamily: FONTS.regular,
    opacity: 0.9,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginTop: SPACING.xs,
  },
  actionButtonOutline: {
    height: 38,
    minWidth: 120,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonTextActive: {
    color: COLORS.paper,
  },
  messageButton: {
    height: 38,
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
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
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
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
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
    fontFamily: FONTS.medium,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
