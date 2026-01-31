import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Modal, TextInput, Linking, Share, InteractionManager, Platform, Switch } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api, getImageUrl, getApiBaseUrl, getWebAppBaseUrl } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { CollectionCard } from '../../components/CollectionCard';
import { EmptyState } from '../../components/EmptyState';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, MODAL, PROFILE_TOP_HEIGHT } from '../../constants/theme';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DrawBackgroundModal } from '../../components/DrawBackgroundModal';

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
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'quotes' | 'saved' | 'collections'>('posts');
  const [profileLoading, setProfileLoading] = useState(true);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarActionModalVisible, setAvatarActionModalVisible] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [headerEditModalVisible, setHeaderEditModalVisible] = useState(false);
  const [drawModalVisible, setDrawModalVisible] = useState(false);
  // Collections tab: options sheet, edit modal, delete confirm
  const [collectionOptionsVisible, setCollectionOptionsVisible] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [editCollectionModalVisible, setEditCollectionModalVisible] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editCollectionTitle, setEditCollectionTitle] = useState('');
  const [editCollectionDescription, setEditCollectionDescription] = useState('');
  const [editCollectionIsPublic, setEditCollectionIsPublic] = useState(true);
  const [deleteCollectionConfirmVisible, setDeleteCollectionConfirmVisible] = useState(false);
  const [profileOptionsVisible, setProfileOptionsVisible] = useState(false);

  const userIdRef = useRef<string | null>(null);

  /** Load only the list for the current tab (posts/replies/quotes/saved/collections). Uses existing uid. No GET /users/me. */
  const loadTabContent = useCallback(async (uid: string, pageNum: number, reset: boolean) => {
    try {
      let postsData: any;
      if (activeTab === 'saved') {
        postsData = await api.get(`/keeps?page=${pageNum}&limit=20`);
        const rawItems = Array.isArray(postsData?.items) ? postsData.items : [];
        const items = rawItems.map((k: any) => k.post).filter(Boolean);
        if (reset) {
          setPosts(items);
        } else {
          setPosts(prev => [...prev, ...items]);
        }
        setHasMore(items.length === 20 && (postsData?.hasMore !== false));
        return;
      }
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
      console.error('Failed to load tab content', error);
      setHasMore(false);
      if (reset && !loadingMore) {
        showError(t('profile.loadError', 'Failed to load profile. Please try again.'));
      }
    }
  }, [activeTab]);

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
      await loadTabContent(uid, pageNum, reset);
    } catch (error: any) {
      if (error?.status === 401) return;
      console.error('Failed to load profile', error);
      setHasMore(false);
      if (reset && !loadingMore) {
        showError(t('profile.loadError', 'Failed to load profile. Please try again.'));
      }
    }
  }, [handle, activeTab, isAuthenticated, loadTabContent]);

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

  // When only tab changes: load list for new tab only (no GET /users/me — avoids 401 on quotes/replies tabs)
  useEffect(() => {
    if (activeTab === prevTabRef.current) return;
    prevTabRef.current = activeTab;
    const uid = user?.id ?? userIdRef.current;
    if (!uid) return;
    setPage(1);
    setPosts([]);
    setHasMore(true);
    loadTabContent(uid, 1, true);
  }, [activeTab, user?.id, loadTabContent]);

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

  const openCollectionOptions = useCallback((collection: any) => {
    Haptics.selectionAsync();
    setSelectedCollection(collection);
    setCollectionOptionsVisible(true);
  }, []);

  const handleOpenCollection = useCallback(() => {
    if (selectedCollection) router.push(`/collections/${selectedCollection.id}`);
    setCollectionOptionsVisible(false);
    setSelectedCollection(null);
  }, [selectedCollection, router]);

  const handleEditCollectionPress = useCallback(() => {
    if (!selectedCollection) return;
    setEditingCollection(selectedCollection);
    setEditCollectionTitle(selectedCollection.title);
    setEditCollectionDescription(selectedCollection.description ?? '');
    setEditCollectionIsPublic(selectedCollection.isPublic !== false);
    setEditCollectionModalVisible(true);
    setCollectionOptionsVisible(false);
    setSelectedCollection(null);
  }, [selectedCollection]);

  const handleSaveEditCollection = useCallback(async () => {
    const c = editingCollection;
    if (!c?.id || !editCollectionTitle.trim()) return;
    try {
      await api.patch(`/collections/${c.id}`, {
        title: editCollectionTitle.trim(),
        description: editCollectionDescription.trim() || undefined,
        isPublic: editCollectionIsPublic,
      });
      setPosts((prev) => prev.map((p: any) => (p.id === c.id ? { ...p, title: editCollectionTitle.trim(), description: editCollectionDescription.trim() || undefined, isPublic: editCollectionIsPublic } : p)));
      setEditCollectionModalVisible(false);
      setEditingCollection(null);
      setEditCollectionTitle('');
      setEditCollectionDescription('');
    } catch (e) {
      showError(t('collections.updateFailed', 'Failed to update collection'));
    }
  }, [editingCollection, editCollectionTitle, editCollectionDescription, editCollectionIsPublic, showError, t]);

  const handleDeleteCollectionPress = useCallback(() => {
    setDeleteCollectionConfirmVisible(true);
    setCollectionOptionsVisible(false);
  }, []);

  const handleDeleteCollectionConfirm = useCallback(async () => {
    const c = selectedCollection;
    if (!c) return;
    try {
      await api.delete(`/collections/${c.id}`);
      setPosts((prev) => prev.filter((p: any) => p.id !== c.id));
      setDeleteCollectionConfirmVisible(false);
      setSelectedCollection(null);
    } catch (e) {
      showError(t('collections.deleteFailed', 'Failed to delete collection'));
    }
  }, [selectedCollection, showError, t]);

  const renderCollectionItem = useCallback(({ item }: { item: any }) => (
    <CollectionCard
      item={{
        id: item.id,
        title: item.title,
        description: item.description,
        itemCount: item.itemCount ?? 0,
        previewImageKey: item.previewImageKey,
      }}
      onPress={() => {
        Haptics.selectionAsync();
        router.push(`/collections/${item.id}`);
      }}
      onLongPress={isSelf ? () => openCollectionOptions(item) : undefined}
      onMenuPress={isSelf ? () => openCollectionOptions(item) : undefined}
      showMenu={isSelf}
    />
  ), [isSelf, router, openCollectionOptions]);

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
        setUser((prev: any) => (prev ? { ...prev, avatarUrl: uploadRes?.url ?? getImageUrl(key), avatarKey: key } : prev));
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

  const hasAvatar = !!(user?.avatarKey || user?.avatarUrl);
  const closeAvatarAction = useCallback(() => setAvatarActionModalVisible(false), []);

  const rssFeedUrl = user?.handle ? `${getApiBaseUrl()}/rss/${encodeURIComponent(user.handle)}` : '';
  const handleOpenRssFeed = useCallback(() => {
    setProfileOptionsVisible(false);
    if (rssFeedUrl) Linking.openURL(rssFeedUrl);
  }, [rssFeedUrl]);

  const handleShareProfile = useCallback(() => {
    if (!user?.handle) return;
    setProfileOptionsVisible(false);
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

  const removeHeaderImage = useCallback(async () => {
    if (!isSelf || !user) return;
    try {
      await api.patch('/users/me', { profileHeaderKey: null });
      setUser((prev: any) => (prev ? { ...prev, profileHeaderUrl: null, profileHeaderKey: null } : prev));
    } catch (e) {
      console.error(e);
      showError(t('profile.photoUpdateFailed', 'Failed to remove header.'));
    }
    setHeaderEditModalVisible(false);
  }, [isSelf, user, showError, t]);

  const hasHeaderImage = !!(user?.profileHeaderKey || user?.profileHeaderUrl);
  const profileHeaderImageUrl = (user?.profileHeaderKey ? getImageUrl(user.profileHeaderKey) : null) || user?.profileHeaderUrl || null;

  const openDrawModal = useCallback(() => {
    setHeaderEditModalVisible(false);
    setDrawModalVisible(true);
  }, []);

  const handleDrawSaved = useCallback((key: string, url?: string) => {
    setUser((prev: any) =>
      prev
        ? {
          ...prev,
          profileHeaderKey: key,
          profileHeaderUrl: url || (prev.profileHeaderUrl ?? undefined),
        }
        : prev,
    );
    // Refetch to stay in sync; merge so we keep new key/url if server lags
    api.get('/users/me').then((data: any) => {
      setUser((prev: any) =>
        prev
          ? {
            ...data,
            profileHeaderKey: data?.profileHeaderKey ?? prev.profileHeaderKey,
            profileHeaderUrl: data?.profileHeaderUrl ?? prev.profileHeaderUrl,
          }
          : data,
      );
    }).catch(() => { });
  }, []);

  return (
    <View style={styles.container}>
      {profileLoading && !user ? (
        <View style={[styles.loading, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      ) : !user ? (
        <View style={[styles.loading, styles.errorStateContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <MaterialIcons name="cloud-off" size={72} color={COLORS.error} style={styles.errorStateIcon} />
          <Text style={styles.errorText}>{t('profile.loadError', 'Failed to load profile.')}</Text>
          {!handle && (
            <Pressable
              style={({ pressed }) => [styles.errorStateButton, pressed && styles.errorStateButtonPressed]}
              onPress={() => router.push('/settings')}
            >
              <MaterialIcons name="settings" size={SIZES.iconMedium} color={COLORS.primary} />
              <Text style={styles.errorStateButtonLabel}>{t('settings.title', 'Settings')}</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={posts}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          keyExtractor={keyExtractor}
          renderItem={activeTab === 'collections' ? renderCollectionItem : renderItem}
          ListHeaderComponent={
            <>
              {/* Single profile top area: hand-drawing or dark black background behind avatar, name, stats. No separate header strip. */}
              <View style={[styles.profileTopSection, { height: PROFILE_TOP_HEIGHT }]}>
                {/* Full-area background: saved drawing image or dark black */}
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
                    onPress={() => setProfileOptionsVisible(true)}
                    style={styles.iconButton}
                    accessibilityLabel={t('profile.options', 'Options')}
                    accessibilityRole="button"
                  >
                    <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={HEADER.iconColor} />
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
                      ) : (user.avatarKey || user.avatarUrl) ? (
                        <Image
                          source={{ uri: user.avatarKey ? getImageUrl(user.avatarKey) : user.avatarUrl }}
                          style={styles.avatarImage}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <Text style={styles.avatarText}>
                          {user.displayName?.charAt(0) || user.handle?.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </Pressable>
                    {isSelf && !avatarUploading && (
                      <Pressable
                        onPress={onAvatarPress}
                        style={styles.avatarEditBadge}
                        accessibilityLabel={t('profile.editHeader', 'Edit profile photo')}
                      >
                        <MaterialIcons name="edit" size={14} color={COLORS.ink} />
                      </Pressable>
                    )}
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

              {/* Tabs: Posts, Replies, Quotes, Saved (own only), Collections */}
              <View style={styles.tabsContainer}>
                {(isSelf
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
              {isSelf && activeTab === 'saved' && (
                <Pressable
                  style={styles.keepsLibraryRow}
                  onPress={() => router.push('/keeps')}
                  accessibilityLabel={t('profile.keepsLibraryDesc', 'Open Keeps library to search and add to collections')}
                >
                  <MaterialIcons name="library-books" size={SIZES.iconMedium} color={COLORS.primary} />
                  <Text style={styles.keepsLibraryText}>{t('profile.keepsLibrary', 'Keeps library')}</Text>
                  <Text style={styles.keepsLibrarySubtext}>{t('profile.keepsLibraryDesc', 'Search & add to collections')}</Text>
                  <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                </Pressable>
              )}
              {isSelf && activeTab === 'collections' && (
                <Pressable
                  style={styles.keepsLibraryRow}
                  onPress={() => router.push('/collections')}
                  accessibilityLabel={t('collections.create', 'Create or manage collections')}
                >
                  <MaterialIcons name="add-circle-outline" size={SIZES.iconMedium} color={COLORS.primary} />
                  <Text style={styles.keepsLibraryText}>{t('collections.createManage', 'Create & manage collections')}</Text>
                  <Text style={styles.keepsLibrarySubtext}>{t('collections.createManageDesc', 'Add new collection or open full list')}</Text>
                  <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                </Pressable>
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
                  : activeTab === 'collections' ? (isSelf ? t('profile.noCollectionsOwn', 'No collections') : t('profile.noCollections', 'No public collections'))
                    : activeTab === 'replies' ? t('profile.noReplies', 'No replies yet')
                      : activeTab === 'quotes' ? t('profile.noQuotes', 'No quotes yet')
                        : t('profile.noPosts', 'No posts yet')
              }
              subtext={
                activeTab === 'saved' ? t('profile.noSavedHint', 'Bookmark posts from the reading view to see them here.')
                  : activeTab === 'posts' ? t('profile.noPostsHint', 'Share your first post or quote someone.')
                    : activeTab === 'collections' ? (isSelf ? t('profile.noCollectionsOwnHint', 'Create a collection to organize your posts.') : t('profile.noCollectionsHint', 'Public collections will appear here.'))
                      : activeTab === 'replies' ? t('profile.noRepliesHint', 'Replies will show here.')
                        : activeTab === 'quotes' ? t('profile.noQuotesHint', 'Quotes will show here.')
                          : undefined
              }
              secondaryLabel={
                activeTab === 'saved' ? t('profile.keepsLibrary', 'Keeps library')
                  : isSelf && activeTab === 'collections' ? t('collections.create', 'Create collection')
                    : undefined
              }
              onSecondary={
                activeTab === 'saved' ? () => router.push('/keeps')
                  : isSelf && activeTab === 'collections' ? () => router.push('/collections')
                    : undefined
              }
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
            {(user?.avatarKey || user?.avatarUrl) ? (
              <Image
                source={{ uri: user.avatarKey ? getImageUrl(user.avatarKey) : user.avatarUrl }}
                style={styles.avatarModalImage}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            ) : null}
            <Pressable style={styles.avatarModalClose} onPress={() => setAvatarModalVisible(false)}>
              <Text style={styles.avatarModalCloseText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={avatarActionModalVisible} transparent animationType="slide">
        <View style={styles.actionModalOverlay}>
          <Pressable style={styles.actionModalBackdrop} onPress={closeAvatarAction} />
          <View style={[styles.actionModalCard, { paddingBottom: insets.bottom + SPACING.xl }]} onStartShouldSetResponder={() => true}>
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
        </View>
      </Modal>

      <OptionsActionSheet
        visible={collectionOptionsVisible}
        title={selectedCollection?.title ?? t('collections.options', 'Collection')}
        options={[
          { label: t('collections.open', 'Open'), onPress: handleOpenCollection, icon: 'folder-open' },
          { label: t('collections.edit', 'Edit'), onPress: handleEditCollectionPress, icon: 'edit' },
          { label: t('collections.delete', 'Delete Collection'), onPress: handleDeleteCollectionPress, destructive: true, icon: 'delete-outline' },
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => { setCollectionOptionsVisible(false); setSelectedCollection(null); }}
      />

      <Modal visible={editCollectionModalVisible} transparent animationType="slide">
        <Pressable style={styles.editCollectionModalOverlay} onPress={() => setEditCollectionModalVisible(false)}>
          <View style={[styles.editCollectionModalContent, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
            <View style={styles.editCollectionModalHandle} />
            <View style={styles.editCollectionModalTitleRow}>
              <MaterialIcons name="edit" size={HEADER.iconSize} color={COLORS.primary} style={styles.editCollectionModalTitleIcon} />
              <Text style={styles.editCollectionModalTitle}>{t('collections.edit', 'Edit collection')}</Text>
            </View>
            <TextInput
              style={styles.editCollectionInput}
              placeholder={t('collections.titlePlaceholder', 'Title')}
              placeholderTextColor={COLORS.tertiary}
              value={editCollectionTitle}
              onChangeText={setEditCollectionTitle}
            />
            <TextInput
              style={[styles.editCollectionInput, styles.editCollectionInputMultiline]}
              placeholder={t('collections.descPlaceholder', 'Description (optional)')}
              placeholderTextColor={COLORS.tertiary}
              value={editCollectionDescription}
              onChangeText={setEditCollectionDescription}
              multiline
              numberOfLines={2}
            />
            <View style={styles.editCollectionVisibilityRow}>
              <View style={styles.editCollectionVisibilityLabel}>
                <Text style={styles.editCollectionVisibilityTitle}>{t('collections.visibility', 'Visibility')}</Text>
                <Text style={styles.editCollectionVisibilityHint}>
                  {editCollectionIsPublic ? t('collections.visibilityPublic', 'Public — anyone can see this collection') : t('collections.visibilityPrivate', 'Private — only your followers can see it')}
                </Text>
              </View>
              <Switch
                value={editCollectionIsPublic}
                onValueChange={setEditCollectionIsPublic}
                trackColor={{ false: COLORS.tertiary + '40', true: COLORS.primary + '99' }}
                thumbColor={editCollectionIsPublic ? COLORS.primary : COLORS.secondary}
              />
            </View>
            <View style={styles.editCollectionModalButtons}>
              <Pressable style={styles.editCollectionModalButtonCancel} onPress={() => { setEditCollectionModalVisible(false); setEditingCollection(null); setEditCollectionTitle(''); setEditCollectionDescription(''); setEditCollectionIsPublic(true); }}>
                <Text style={styles.editCollectionModalButtonTextCancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.editCollectionModalButtonSave, !editCollectionTitle.trim() && styles.editCollectionModalButtonDisabled]} onPress={handleSaveEditCollection} disabled={!editCollectionTitle.trim()}>
                <Text style={styles.editCollectionModalButtonTextSave}>{t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={deleteCollectionConfirmVisible}
        title={t('collections.delete', 'Delete Collection')}
        message={t('collections.deleteConfirm', 'Are you sure you want to delete this collection? All items will be removed. This cannot be undone.')}
        confirmLabel={t('collections.delete', 'Delete Collection')}
        cancelLabel={t('common.cancel')}
        destructive
        icon="warning"
        onConfirm={handleDeleteCollectionConfirm}
        onCancel={() => { setDeleteCollectionConfirmVisible(false); setSelectedCollection(null); }}
      />

      <OptionsActionSheet
        visible={headerEditModalVisible}
        title={t('profile.backgroundDraw', 'Background')}
        options={[
          { label: t('profile.drawHeader', 'Draw background'), onPress: openDrawModal, icon: 'brush' },
          ...(hasHeaderImage ? [{ label: t('profile.removePhoto', 'Remove'), onPress: removeHeaderImage, destructive: true as const, icon: 'delete-outline' as const }] : []),
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => setHeaderEditModalVisible(false)}
      />

      <OptionsActionSheet
        visible={profileOptionsVisible}
        title={t('profile.options', 'Options')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setProfileOptionsVisible(false)}
        options={[
          { label: t('profile.shareProfile', 'Share profile'), onPress: handleShareProfile, icon: 'share' },
          { label: t('profile.rssFeed', 'RSS Feed'), onPress: handleOpenRssFeed, icon: 'rss-feed' },
          ...(isSelf ? [{ label: t('settings.title', 'Settings'), onPress: () => { setProfileOptionsVisible(false); router.push('/settings'); }, icon: 'settings' as const }] : []),
        ]}
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  errorStateContainer: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    gap: SPACING.xl,
  },
  errorStateIcon: {
    marginBottom: SPACING.s,
  },
  errorStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  errorStateButtonPressed: {
    opacity: 0.8,
  },
  errorStateButtonLabel: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.primary,
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
    justifyContent: 'flex-end',
  },
  actionModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: MODAL.backdropBackgroundColor,
  },
  actionModalCard: {
    backgroundColor: MODAL.sheetBackgroundColor,
    borderTopLeftRadius: MODAL.sheetBorderRadius,
    borderTopRightRadius: MODAL.sheetBorderRadius,
    paddingHorizontal: MODAL.sheetPaddingHorizontal,
    paddingTop: MODAL.sheetPaddingTop,
    borderWidth: MODAL.sheetBorderWidth,
    borderBottomWidth: MODAL.sheetBorderBottomWidth,
    borderColor: MODAL.sheetBorderColor,
  },
  actionModalHandle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: 'center',
    marginTop: MODAL.handleMarginTop,
    marginBottom: MODAL.handleMarginBottom,
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
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    gap: SPACING.m,
    borderRadius: SIZES.borderRadius,
    marginBottom: 2,
  },
  actionModalOptionPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  actionModalOptionDestructive: {},
  actionModalOptionText: {
    fontSize: MODAL.buttonFontSize,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  actionModalOptionTextDestructive: {
    color: COLORS.error,
  },
  actionModalCancel: {
    marginTop: SPACING.m,
    minHeight: MODAL.buttonMinHeight,
    paddingVertical: MODAL.buttonPaddingVertical,
    paddingHorizontal: MODAL.buttonPaddingHorizontal,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: MODAL.buttonBorderRadius,
    backgroundColor: MODAL.secondaryButtonBackgroundColor,
    borderWidth: MODAL.secondaryButtonBorderWidth,
    borderColor: MODAL.secondaryButtonBorderColor,
  },
  actionModalCancelText: {
    fontSize: MODAL.buttonFontSize,
    fontWeight: MODAL.buttonFontWeight,
    color: MODAL.secondaryButtonTextColor,
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
    borderBottomColor: COLORS.divider, // Citewalk-border/20
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
  keepsLibraryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    gap: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  keepsLibraryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  keepsLibrarySubtext: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  editCollectionModalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  editCollectionModalContent: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
  },
  editCollectionModalHandle: {
    width: MODAL.handleWidth,
    height: MODAL.handleHeight,
    borderRadius: MODAL.handleBorderRadius,
    backgroundColor: MODAL.handleBackgroundColor,
    alignSelf: 'center',
    marginBottom: SPACING.m,
  },
  editCollectionModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.l,
  },
  editCollectionModalTitleIcon: {
    marginRight: SPACING.s,
  },
  editCollectionModalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  editCollectionInput: {
    backgroundColor: COLORS.hover,
    color: COLORS.paper,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    marginBottom: SPACING.m,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.divider,
    fontFamily: FONTS.regular,
  },
  editCollectionInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  editCollectionVisibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    paddingVertical: SPACING.s,
  },
  editCollectionVisibilityLabel: {
    flex: 1,
    marginRight: SPACING.m,
  },
  editCollectionVisibilityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  editCollectionVisibilityHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
    fontFamily: FONTS.regular,
  },
  editCollectionModalButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.s,
  },
  editCollectionModalButtonCancel: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
  },
  editCollectionModalButtonSave: {
    flex: 1,
    padding: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editCollectionModalButtonDisabled: {
    opacity: 0.5,
  },
  editCollectionModalButtonTextCancel: {
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  editCollectionModalButtonTextSave: {
    color: COLORS.ink,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
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
