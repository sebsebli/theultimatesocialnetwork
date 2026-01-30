import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { DrawBackgroundModal } from '../../components/DrawBackgroundModal';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PROFILE_TOP_HEIGHT } from '../../constants/theme';

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
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarActionModalVisible, setAvatarActionModalVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [headerEditModalVisible, setHeaderEditModalVisible] = useState(false);
  const [drawModalVisible, setDrawModalVisible] = useState(false);

  const userIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (pageNum: number, reset = false) => {
    try {
      let data: any;
      if (handle) {
        data = await api.get(`/users/${handle}`);
        setIsSelf(false);
      } else {
        data = await api.get('/users/me');
        setIsSelf(true);
      }

      userIdRef.current = data?.id ?? null;
      setUser(data);
      if (data?.isFollowing !== undefined) {
        setIsFollowing(data.isFollowing);
      }

      const uid = data?.id ?? 'me';
      let postsData: any;
      if (activeTab === 'replies') {
        postsData = await api.get(`/users/${uid}/replies?page=${pageNum}&limit=20`);
      } else if (activeTab === 'quotes') {
        postsData = await api.get(`/users/${uid}/quotes?page=${pageNum}&limit=20`);
      } else if (activeTab === 'collections') {
        postsData = await api.get(`/users/${uid}/collections?page=${pageNum}&limit=20`);
      } else {
        postsData = await api.get(`/users/${uid}/posts?page=${pageNum}&limit=20&type=${activeTab}`);
      }
      const items = Array.isArray(postsData?.items ?? postsData) ? (postsData?.items ?? postsData) : [];

      if (reset) {
        setPosts(items);
      } else {
        setPosts(prev => [...prev, ...items]);
      }

      setHasMore(items.length === 20 && (postsData?.hasMore !== false));
    } catch (error: any) {
      if (error?.status === 401) return;
      console.error('Failed to load profile', error);
      setHasMore(false);
      if (reset && !loadingMore) {
        showError(t('profile.loadError', 'Failed to load profile. Please try again.'));
      }
    }
  }, [handle, activeTab, isAuthenticated]);

  const prevTabRef = useRef(activeTab);

  // Initial load and when handle/auth changes: load user + first tab content
  useEffect(() => {
    if (!handle && !isAuthenticated) {
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setUser(null);
    setPage(1);
    setPosts([]);
    prevTabRef.current = activeTab;
    loadProfile(1, true).finally(() => setProfileLoading(false));
  }, [handle, isAuthenticated]);

  // When only tab changes: refetch list for new tab (do not clear user or show full-screen loading)
  useEffect(() => {
    if (activeTab === prevTabRef.current) return;
    prevTabRef.current = activeTab;
    if (!user?.id && !userIdRef.current) return;
    setPage(1);
    setPosts([]);
    setHasMore(true);
    loadProfile(1, true);
  }, [activeTab]);

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
      router.push('/settings/profile');
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
    <PostItem
      post={item}
      onDeleted={isSelf ? () => setPosts((prev) => prev.filter((p) => p.id !== item.id)) : undefined}
    />
  ), [isSelf]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const removeAvatar = useCallback(async () => {
    if (!isSelf || !user) return;
    try {
      await api.patch('/users/me', { avatarKey: null });
      setUser((prev: any) => (prev ? { ...prev, avatarUrl: null, avatarKey: null } : prev));
    } catch (e) {
      console.error(e);
      showError(t('profile.photoUpdateFailed', 'Failed to remove photo.'));
    }
  }, [isSelf, user, showError, t]);

  const changeAvatar = useCallback(async () => {
    if (!isSelf || !user) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showError(t('profile.photoPermissionDenied', 'Permission to access photos is required.'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled) return;
      setAvatarUploading(true);
      const uploadRes = await api.upload('/upload/profile-picture', result.assets[0]);
      const key = uploadRes?.key;
      if (key) {
        await api.patch('/users/me', { avatarKey: key });
        setUser((prev: any) => (prev ? { ...prev, avatarUrl: uploadRes?.url ?? `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/images/${key}` } : prev));
      }
    } catch (e) {
      console.error(e);
      showError(t('profile.photoUpdateFailed', 'Failed to update photo.'));
    } finally {
      setAvatarUploading(false);
    }
  }, [isSelf, user, t, showError]);

  const onAvatarPress = useCallback(() => {
    if (!isSelf) return;
    setAvatarActionModalVisible(true);
  }, [isSelf]);

  const hasAvatar = !!user?.avatarUrl;
  const closeAvatarAction = useCallback(() => setAvatarActionModalVisible(false), []);

  const removeHeaderImage = useCallback(async () => {
    if (!isSelf || !user) return;
    try {
      await api.patch('/users/me', { profileHeaderKey: null });
      setUser((prev: any) => (prev ? { ...prev, profileHeaderUrl: null } : prev));
    } catch (e) {
      console.error(e);
      showError(t('profile.photoUpdateFailed', 'Failed to remove header.'));
    }
    setHeaderEditModalVisible(false);
  }, [isSelf, user, showError, t]);

  const hasHeaderImage = !!user?.profileHeaderUrl;

  const openDrawModal = useCallback(() => {
    setHeaderEditModalVisible(false);
    setDrawModalVisible(true);
  }, []);

  const handleDrawSaved = useCallback(() => {
    api.get('/users/me').then((data) => setUser(data)).catch(() => { });
  }, []);

  return (
    <View style={styles.container}>
      {profileLoading && !user ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : !user ? (
        <View style={styles.loading}>
          <Text style={styles.errorText}>{t('profile.loadError', 'Failed to load profile.')}</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={
            <>
              {/* Single profile top area: hand-drawing or dark black background behind avatar, name, stats. No separate header strip. */}
              <View style={[styles.profileTopSection, { minHeight: PROFILE_TOP_HEIGHT }]}>
                {/* Full-area background: saved drawing image or dark black */}
                {user.profileHeaderUrl ? (
                  <Image source={{ uri: user.profileHeaderUrl }} style={styles.profileTopBackground} resizeMode="cover" />
                ) : (
                  <View style={styles.profileTopBackgroundBlack} />
                )}
                {/* Top bar: back (or edit background) + settings */}
                <View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
                  {!isSelf ? (
                    <Pressable onPress={() => router.back()} style={styles.iconButton}>
                      <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
                    </Pressable>
                  ) : (
                    <Pressable
                      onPress={() => setHeaderEditModalVisible(true)}
                      style={styles.iconButton}
                      accessibilityLabel={t('profile.editHeader', 'Edit background')}
                    >
                      <MaterialIcons name="edit" size={HEADER.iconSize} color={HEADER.iconColor} />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => router.push('/settings')}
                    style={styles.iconButton}
                    accessibilityLabel={t('settings.title')}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="settings" size={HEADER.iconSize} color={HEADER.iconColor} />
                  </Pressable>
                </View>
                {/* Profile Info - Centered (avatar, name, button, stats) */}
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    <Pressable
                      onPress={onAvatarPress}
                      style={styles.avatar}
                      disabled={!isSelf || avatarUploading}
                    >
                      {avatarUploading ? (
                        <ActivityIndicator color={COLORS.primary} />
                      ) : user.avatarUrl ? (
                        <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
                      ) : (
                        <Text style={styles.avatarText}>
                          {user.displayName?.charAt(0) || user.handle?.charAt(0).toUpperCase()}
                        </Text>
                      )}
                      {isSelf && !avatarUploading && (
                        <View style={styles.avatarEditBadge}>
                          <MaterialIcons name="edit" size={HEADER.iconSize} color={COLORS.ink} />
                        </View>
                      )}
                    </Pressable>
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
                  <Pressable
                    style={styles.statItem}
                    onPress={() => isSelf && router.push('/user/connections?tab=followers')}
                  >
                    <Text style={styles.statNumber}>{user.followerCount}</Text>
                    <Text style={styles.statLabel}>{t('profile.followers')}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.statItem}
                    onPress={() => isSelf && router.push('/user/connections?tab=following')}
                  >
                    <Text style={styles.statNumber}>{user.followingCount}</Text>
                    <Text style={styles.statLabel}>{t('profile.following')}</Text>
                  </Pressable>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{user.quoteReceivedCount}</Text>
                    <Text style={[styles.statLabel, { color: COLORS.primary }]}>{t('profile.quotes')}</Text>
                  </View>
                </View>
              </View>
              {/* End profile top section (full-area background) */}

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
            <EmptyState
              icon="article"
              headline={t('profile.noPosts', 'No posts yet')}
              subtext={t('profile.noPostsHint', 'Share your first post or quote someone.')}
            />
          }
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

      <Modal visible={avatarModalVisible} transparent animationType="fade">
        <Pressable style={styles.avatarModalOverlay} onPress={() => setAvatarModalVisible(false)}>
          <View style={styles.avatarModalContent}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarModalImage} resizeMode="contain" />
            ) : null}
            <Pressable style={styles.avatarModalClose} onPress={() => setAvatarModalVisible(false)}>
              <Text style={styles.avatarModalCloseText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={avatarActionModalVisible} transparent animationType="fade">
        <Pressable style={styles.actionModalOverlay} onPress={closeAvatarAction}>
          <View style={[styles.actionModalCard, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
            <View style={styles.actionModalHandle} />
            <Text style={styles.actionModalTitle}>{t('profile.avatar', 'Profile photo')}</Text>
            {hasAvatar && (
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.actionModalOption, pressed && styles.actionModalOptionPressed]}
                onPress={() => { closeAvatarAction(); setAvatarModalVisible(true); }}
              >
                <MaterialIcons name="visibility" size={HEADER.iconSize} color={HEADER.iconColor} />
                <Text style={styles.actionModalOptionText}>{t('profile.viewFullSize', 'View full size')}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.actionModalOption, pressed && styles.actionModalOptionPressed]}
              onPress={() => { closeAvatarAction(); changeAvatar(); }}
            >
              <MaterialIcons name="photo-camera" size={HEADER.iconSize} color={HEADER.iconColor} />
              <Text style={styles.actionModalOptionText}>{hasAvatar ? t('profile.changePhoto', 'Change photo') : t('profile.changePhoto', 'Add photo')}</Text>
            </Pressable>
            {hasAvatar && (
              <Pressable
                style={({ pressed }: { pressed: boolean }) => [styles.actionModalOption, styles.actionModalOptionDestructive, pressed && styles.actionModalOptionPressed]}
                onPress={() => { closeAvatarAction(); removeAvatar(); }}
              >
                <MaterialIcons name="delete-outline" size={HEADER.iconSize} color={COLORS.error} />
                <Text style={[styles.actionModalOptionText, styles.actionModalOptionTextDestructive]}>{t('profile.removePhoto', 'Remove photo')}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }: { pressed: boolean }) => [styles.actionModalCancel, pressed && styles.actionModalOptionPressed]}
              onPress={closeAvatarAction}
            >
              <Text style={styles.actionModalCancelText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <OptionsActionSheet
        visible={headerEditModalVisible}
        title={t('profile.backgroundDraw', 'Background')}
        options={[
          { label: t('profile.drawHeader', 'Draw background'), onPress: openDrawModal },
          ...(hasHeaderImage ? [{ label: t('profile.removePhoto', 'Remove'), onPress: removeHeaderImage, destructive: true as const }] : []),
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => setHeaderEditModalVisible(false)}
      />

      <DrawBackgroundModal
        visible={drawModalVisible}
        onClose={() => setDrawModalVisible(false)}
        onSaved={handleDrawSaved}
      />
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
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileTopSection: {
    width: '100%',
    position: 'relative',
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
  profileTopBackgroundBlack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: HEADER.barPaddingHorizontal,
    paddingTop: 0, // Handled dynamically
    paddingBottom: HEADER.barPaddingBottom,
    zIndex: 10,
    position: 'relative',
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
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionModalCard: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.s,
    paddingBottom: SPACING.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.divider,
  },
  actionModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.tertiary,
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  actionModalTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  actionModalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    borderRadius: SIZES.borderRadius,
    marginBottom: 2,
  },
  actionModalOptionPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionModalOptionDestructive: {},
  actionModalOptionText: {
    fontSize: 17,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  actionModalOptionTextDestructive: {
    color: COLORS.error,
  },
  actionModalCancel: {
    marginTop: SPACING.m,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderRadius: SIZES.borderRadius,
  },
  actionModalCancelText: {
    fontSize: 17,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalImage: {
    width: '100%',
    height: '80%',
  },
  avatarModalClose: {
    position: 'absolute',
    bottom: 48,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
  },
  avatarModalCloseText: {
    color: COLORS.paper,
    fontSize: 16,
    fontWeight: '600',
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
    color: COLORS.paper, // text-main/90 - using paper as base
    opacity: 0.9,
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
    borderBottomColor: COLORS.divider, // cite-border/20
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
    borderBottomColor: COLORS.divider, // consistent with other borders
    backgroundColor: COLORS.ink, // backdrop blur simul - using ink base
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
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.tertiary,
    fontSize: 15,
    fontFamily: FONTS.regular,
  },
});
