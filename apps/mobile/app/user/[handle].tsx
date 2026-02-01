import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Linking, Share, InteractionManager, Platform, useWindowDimensions, type DimensionValue } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getApiBaseUrl, getWebAppBaseUrl, getImageUrl } from '../../utils/api';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ReportModal } from '../../components/ReportModal';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { PostItem } from '../../components/PostItem';
import { ProfileSkeleton, PostSkeleton } from '../../components/LoadingSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, PROFILE_HEADER_ASPECT_RATIO, createStyles, FLATLIST_DEFAULTS } from '../../constants/theme';
import { ListFooterLoader } from '../../components/ListFooterLoader';
import { formatCompactNumber } from '../../utils/format';

const TAB_BAR_HEIGHT = 50;

export default function UserProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
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
  const [hasPendingFollowRequest, setHasPendingFollowRequest] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'saved' | 'collections'>('posts');
  const loadingMoreRef = React.useRef(false);

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
      loadingMoreRef.current = false;
      // Don't clear posts immediately to avoid flash, unless explicitly needed
      // setPosts([]);
    } else {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
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
        setFollowing(!!(userData as any).isFollowing);
        setHasPendingFollowRequest(!!(userData as any).hasPendingFollowRequest);
        const canViewContent = !(userData as any).isProtected || (userData as any).isFollowing;
        contentData = canViewContent ? await fetchContent(userData.id) : { items: [], hasMore: false };
      } else {
        const canViewContent = !user?.isProtected || following;
        contentData = canViewContent ? await fetchContent(user.id) : { items: [], hasMore: false };
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
      if (!reset) setPage(pageNum);
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
    const prevFollowing = following;
    const prevPending = hasPendingFollowRequest;
    const prevCount = user.followerCount;

    if (prevFollowing || prevPending) {
      setFollowing(false);
      setHasPendingFollowRequest(false);
      setUser((prev: any) => ({ ...prev, followerCount: prev.followerCount - 1 }));
    } else {
      setFollowing(true); // optimistic; may be overwritten if pending
      setUser((prev: any) => ({ ...prev, followerCount: prev.followerCount + 1 }));
    }

    try {
      if (prevFollowing || prevPending) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        const res = await api.post<{ pending?: boolean }>(`/users/${user.id}/follow`);
        if (res?.pending) {
          setFollowing(false);
          setHasPendingFollowRequest(true);
          setUser((prev: any) => ({ ...prev, followerCount: prev.followerCount - 1 }));
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
      setFollowing(prevFollowing);
      setHasPendingFollowRequest(prevPending);
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
      if (error?.status === 403) {
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

  const rssFeedUrl = `${getApiBaseUrl()}/rss/${encodeURIComponent(user?.handle ?? '')}`;

  const handleOpenRssFeed = useCallback(() => {
    if (!user?.handle) return;
    setOptionsModalVisible(false);
    Linking.openURL(rssFeedUrl);
  }, [user?.handle, rssFeedUrl]);

  const handleShareProfile = useCallback(() => {
    if (!user?.handle) return;
    setOptionsModalVisible(false);
    const profileUrl = `${getWebAppBaseUrl()}/user/${encodeURIComponent(user.handle)}`;
    const displayName = user.displayName || user.handle;
    const message = t('profile.shareProfileMessage', { defaultValue: 'Check out {{name}} (@{{handle}}) on Citewalk', name: displayName, handle: user.handle });
    const title = t('profile.shareProfileTitle', { defaultValue: 'Share profile', handle: user.handle });
    // Defer share until modal has fully closed (avoids share sheet not opening)
    InteractionManager.runAfterInteractions(() => {
      const sharePayload = Platform.OS === 'android'
        ? { message: `${message}\n${profileUrl}`, title }
        : { message: `${message}\n${profileUrl}`, url: profileUrl, title };
      setTimeout(() => Share.share(sharePayload).catch(() => { }), 350);
    });
  }, [user?.handle, user?.displayName, t]);

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

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !user || loadingMoreRef.current) return;
    const nextPage = page + 1;
    loadProfile(nextPage, false);
  }, [loading, loadingMore, hasMore, page, user]);

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

  if (user.isBlockedByMe) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: insets.top + SPACING.s }]}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
          </Pressable>
        </View>
        <View style={styles.blockedStateContent}>
          <MaterialIcons name="block" size={64} color={COLORS.tertiary} style={styles.blockedStateIcon} />
          <Text style={styles.blockedStateTitle}>{t('safety.youBlockedThisAccount', 'You have blocked this account')}</Text>
          <Text style={styles.blockedStateSubtext}>
            {t('safety.blockedAccountHint', 'You cannot view this profile while blocked. Unblock to see their posts and profile.')}
          </Text>
          <Pressable
            style={styles.blockedStateUnblockBtn}
            onPress={async () => {
              try {
                await api.delete(`/safety/block/${user.id}`);
                showSuccess(t('safety.unblockedMessage', 'This user has been unblocked.'));
                loadProfile(1, true);
              } catch (e: any) {
                showError(e?.message ?? t('safety.failedUnblock', 'Failed to unblock user.'));
              }
            }}
            accessibilityLabel={t('safety.unblock', 'Unblock')}
            accessibilityRole="button"
          >
            <Text style={styles.blockedStateUnblockBtnText}>{t('safety.unblock', 'Unblock')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const profileHeaderImageUrl = (user?.profileHeaderKey ? getImageUrl(user.profileHeaderKey) : null) || user?.profileHeaderUrl || null;

  return (
    <View style={styles.container}>
      <FlatList
        style={styles.list}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        data={(user?.isProtected && !following) ? [] : posts}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => <PostItem post={item} />}
        ListHeaderComponent={
          <>
            {/* Header: fixed aspect ratio so draw area matches on every profile */}
            <View style={[styles.profileTopSection, { width: screenWidth, height: Math.round(screenWidth / PROFILE_HEADER_ASPECT_RATIO) }]}>
              {profileHeaderImageUrl ? (
                <Image
                  source={{ uri: profileHeaderImageUrl }}
                  style={styles.profileTopBackground}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={styles.profileTopBackgroundBlack} />
              )}
              <View style={styles.profileTopOverlay} />
              <View style={[styles.headerBarOverlay, { paddingTop: insets.top + 10 }]}>
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
            </View>
            <View style={styles.profileInfoBlock}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      {(user.avatarKey || user.avatarUrl) ? (
                        <Image
                          source={{ uri: user.avatarUrl || (user.avatarKey ? getImageUrl(user.avatarKey) : null) }}
                          style={styles.avatarImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
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

                  {user.bio ? (
                    <Text style={styles.bio}>{user.bio}</Text>
                  ) : null}

                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.actionButtonOutline, (following || hasPendingFollowRequest) && styles.actionButtonActive]}
                      onPress={handleFollow}
                      accessibilityLabel={hasPendingFollowRequest ? t('profile.requested', 'Requested') : following ? t('profile.following') : t('profile.follow')}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.actionButtonText, (following || hasPendingFollowRequest) && styles.actionButtonTextActive]}>
                        {hasPendingFollowRequest ? t('profile.requested', 'Requested') : following ? t('profile.following') : t('profile.follow')}
                      </Text>
                    </Pressable>

                    {user.followsMe ? (
                      <Pressable
                        style={styles.messageButton}
                        onPress={handleMessage}
                        accessibilityLabel={t('profile.message')}
                        accessibilityRole="button"
                      >
                        <MaterialIcons name="mail-outline" size={HEADER.iconSize} color={HEADER.iconColor} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>

                <View style={styles.followersFollowingRow}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/user/connections', params: { tab: 'followers', handle: user.handle } })}
                    style={({ pressed }: { pressed: boolean }) => pressed && styles.followersFollowingPressable}
                  >
                    <Text style={styles.followersFollowingText}>
                      {formatCompactNumber(user.followerCount)} {t('profile.followers').toLowerCase()}
                    </Text>
                  </Pressable>
                  <Text style={styles.followersFollowingText}> · </Text>
                  <Pressable
                    onPress={() => router.push({ pathname: '/user/connections', params: { tab: 'following', handle: user.handle } })}
                    style={({ pressed }: { pressed: boolean }) => pressed && styles.followersFollowingPressable}
                  >
                    <Text style={styles.followersFollowingText}>
                      {formatCompactNumber(user.followingCount)} {t('profile.following').toLowerCase()}
                    </Text>
                  </Pressable>
                </View>
              </View>

            {user.isProtected && !following ? (
              <View style={styles.privateProfileGate}>
                <View style={styles.privateProfileIconWrap}>
                  <MaterialIcons name="lock" size={32} color={COLORS.tertiary} />
                </View>
                <Text style={styles.privateProfileTitle}>{t('profile.privateProfile', 'Private profile')}</Text>
                <Text style={styles.privateProfileSubtext}>
                  {t('profile.privateProfileHint', 'Follow this account to see their posts, replies, and quotes.')}
                </Text>
              </View>
            ) : (
              <View style={styles.tabsContainer}>
                {(isOwnProfile
                  ? (['posts', 'replies', 'quotes', 'saved', 'collections'] as const)
                  : (['posts', 'replies', 'quotes', 'collections'] as const)
                ).map((tab) => {
                  const count = tab === 'posts' ? (user.postCount ?? 0)
                    : tab === 'replies' ? (user.replyCount ?? 0)
                    : tab === 'quotes' ? (user.quoteReceivedCount ?? 0)
                    : tab === 'saved' ? (user.keepsCount ?? 0)
                    : (user.collectionCount ?? 0);
                  return (
                    <Pressable
                      key={tab}
                      style={[styles.tab, activeTab === tab && styles.tabActive]}
                      onPress={() => setActiveTab(tab)}
                      accessibilityLabel={count > 0 ? `${t(`profile.${tab}`)} ${count}` : t(`profile.${tab}`)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: activeTab === tab }}
                    >
                      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                        {t(`profile.${tab}`)}{count > 0 ? ` (${formatCompactNumber(count)})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon={
              activeTab === 'saved' ? 'bookmark-outline'
                : activeTab === 'collections' ? 'folder-open'
                  : activeTab === 'replies' ? 'chat-bubble-outline'
                    : activeTab === 'quotes' ? 'format-quote'
                      : 'article'
            }
            headline={
              activeTab === 'saved' ? t('profile.noSaved', 'No saved posts')
                : activeTab === 'collections' ? t('profile.noCollections', 'No public collections')
                  : activeTab === 'replies' ? t('profile.noReplies', 'No replies yet')
                    : activeTab === 'quotes' ? t('profile.noQuotes', 'No quotes yet')
                      : t('profile.noPosts', 'No posts yet')
            }
            subtext={
              activeTab === 'saved' ? t('profile.noSavedHint', 'Bookmark posts from the reading view to see them here.')
                : activeTab === 'collections' ? t('profile.noCollectionsHint', 'Public collections will appear here.')
                  : activeTab === 'replies' ? t('profile.noRepliesHint', 'Replies will show here.')
                    : activeTab === 'quotes' ? t('profile.noQuotesHint', 'Quotes will show here.')
                      : t('profile.noPostsHintView', 'Posts will appear here.')
            }
          />
        }
        ListFooterComponent={<ListFooterLoader visible={!!(hasMore && loadingMore)} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadProfile(1, true);
            }}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        {...FLATLIST_DEFAULTS}
      />

      <ConfirmModal
        visible={blockConfirmVisible}
        title={t('safety.blockUser', 'Block User')}
        message={t('safety.blockConfirm', `Are you sure you want to block @${user?.handle ?? ''}? You won't see their posts or messages.`)}
        confirmLabel={t('safety.block', 'Block')}
        cancelLabel={t('common.cancel')}
        destructive
        icon="warning"
        onConfirm={confirmBlock}
        onCancel={() => setBlockConfirmVisible(false)}
      />
      <ConfirmModal
        visible={muteConfirmVisible}
        title={t('safety.muteUser', 'Mute User')}
        message={t('safety.muteConfirm', `Are you sure you want to mute @${user?.handle ?? ''}? You won't see their posts in your feed.`)}
        confirmLabel={t('safety.mute', 'Mute')}
        cancelLabel={t('common.cancel')}
        icon="volume-off"
        onConfirm={confirmMute}
        onCancel={() => setMuteConfirmVisible(false)}
      />
      <OptionsActionSheet
        visible={optionsModalVisible}
        title={t('profile.options', 'Options for @' + (user?.handle ?? ''))}
        cancelLabel={t('common.cancel')}
        options={[
          { label: t('safety.mute', 'Mute User'), onPress: handleMute, icon: 'volume-off' },
          { label: t('safety.block', 'Block User'), onPress: handleBlock, destructive: true, icon: 'block' },
          { label: t('safety.report', 'Report User'), onPress: () => openReportModal(user.id, 'USER'), destructive: true, icon: 'flag' },
          { label: t('profile.shareProfile', 'Share profile'), onPress: handleShareProfile, icon: 'share' },
          { label: t('profile.rssFeed', 'RSS Feed'), onPress: handleOpenRssFeed, icon: 'rss-feed' },
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

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER.barPaddingHorizontal as DimensionValue,
    paddingBottom: HEADER.barPaddingBottom as DimensionValue,
    backgroundColor: COLORS.ink,
  },
  headerBarOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER.barPaddingHorizontal as DimensionValue,
    paddingBottom: HEADER.barPaddingBottom as DimensionValue,
    zIndex: 10,
    position: 'relative',
  },
  profileTopSection: {
    position: 'relative',
    overflow: 'hidden',
  },
  profileInfoBlock: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.l,
  },
  profileTopBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  profileTopOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '70%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  profileTopContent: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.l,
    position: 'relative',
    zIndex: 5,
  },
  profileTopBackgroundBlack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
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
    paddingBottom: SPACING.l,
    gap: SPACING.l,
  },
  avatarContainer: {
    position: 'relative',
    width: 96,
    height: 96,
    marginBottom: SPACING.xs,
  },
  avatar: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.divider,
    overflow: 'hidden',
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
  followersFollowingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
    gap: 2,
  },
  followersFollowingPressable: {
    opacity: 0.7,
  },
  followersFollowingText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  statsRowContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.l,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  statLabel: {
    fontSize: 13,
    color: COLORS.paper,
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
    opacity: 0.95,
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
  privateProfileGate: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
    paddingHorizontal: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  privateProfileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
  },
  privateProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  privateProfileSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    maxWidth: 280,
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
  blockedStateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  blockedStateIcon: {
    marginBottom: SPACING.l,
  },
  blockedStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    textAlign: 'center',
    marginBottom: SPACING.s,
  },
  blockedStateSubtext: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  blockedStateUnblockBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
  },
  blockedStateUnblockBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});
