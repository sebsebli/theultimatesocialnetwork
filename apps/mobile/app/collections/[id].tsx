import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Share, ScrollView, Animated, Modal, TextInput, Switch, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, getWebAppBaseUrl, getImageUrl } from '../../utils/api';
import { useAuth } from '../../context/auth';
import { useToast } from '../../context/ToastContext';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PostItem } from '../../components/PostItem';
import { TopicCollectionHeader, pickRandomHeaderImageKey } from '../../components/TopicCollectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { ListFooterLoader } from '../../components/ListFooterLoader';
import { Collection, CollectionItem } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS } from '../../constants/theme';
import type { ViewProps } from 'react-native';

const ITEMS_PAGE_SIZE = 20;
const HERO_FADE_HEIGHT = 200;
const STICKY_HEADER_APPEAR = 100;
const STICKY_FADE_RANGE = 80;

/** Typed Animated.View for React 19 compatibility (JSX element return type). */
const AnimatedView = Animated.View as (props: ViewProps & { style?: any }) => React.ReactElement | null;

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { userId } = useAuth();
  const { showToast, showSuccess, showError } = useToast();
  const [collection, setCollection] = useState<Collection | null>(null);
  const isOwner = !!collection?.ownerId && !!userId && collection.ownerId === userId;
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [headerImageKey, setHeaderImageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [moreCollections, setMoreCollections] = useState<{ id: string; title: string; description?: string; itemCount?: number; previewImageKey?: string | null }[]>([]);
  const [shareSaves, setShareSaves] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editShareSaves, setEditShareSaves] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, HERO_FADE_HEIGHT],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );
  const stickyOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [STICKY_HEADER_APPEAR, STICKY_HEADER_APPEAR + STICKY_FADE_RANGE],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [scrollY]
  );

  const collectionId = typeof id === 'string' ? id : (id?.[0] ?? '');
  const handleShare = async () => {
    if (!collectionId) return;
    Haptics.selectionAsync();
    const url = `${getWebAppBaseUrl()}/collections/${collectionId}`;
    try {
      await Share.share({
        message: `Check out this collection: ${url}`,
        url, // iOS
      });
    } catch (error) {
      // console.error(error);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await api.delete(`/collections/${collectionId}`);
      showSuccess(t('collections.deleted', 'Collection deleted'));
      setDeleteConfirmVisible(false);
      setMoreOptionsVisible(false);
      router.back();
    } catch (error) {
      showError(t('collections.deleteFailed', 'Failed to delete collection'));
      throw error;
    }
  };

  const handleShareSavesToggle = async () => {
    try {
      await api.patch(`/collections/${collectionId}`, { shareSaves: !shareSaves });
      setShareSaves(!shareSaves);
    } catch (error) {
      showError(t('collections.updateFailed', 'Failed to update collection'));
    }
  };

  const openEditModal = useCallback(() => {
    setMoreOptionsVisible(false);
    if (!collection) return;
    setEditTitle(collection.title);
    setEditDescription(collection.description ?? '');
    setEditIsPublic(collection.isPublic !== false);
    setEditShareSaves(!!(collection as any).shareSaves);
    setEditModalVisible(true);
  }, [collection]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.patch(`/collections/${collectionId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        isPublic: editIsPublic,
        shareSaves: editShareSaves,
      });
      setCollection((prev) => (prev ? { ...prev, ...updated, title: updated.title ?? prev.title, description: updated.description ?? prev.description, isPublic: updated.isPublic ?? prev.isPublic } : null));
      setShareSaves(!!(updated as any).shareSaves);
      setEditModalVisible(false);
      showSuccess(t('common.saved', 'Saved'));
    } catch (error) {
      showError(t('collections.updateFailed', 'Failed to update collection'));
    }
  };

  useEffect(() => {
    if (collectionId) {
      setNextOffset(0);
      setItems([]);
      loadCollection(0, true);
    }
  }, [collectionId]);

  const loadCollection = async (offset: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setNextOffset(0);
      setItems([]);
    } else {
      setLoadingMore(true);
    }
    try {
      if (reset) {
        const collectionData = await api.get(`/collections/${collectionId}?limit=${ITEMS_PAGE_SIZE}&offset=0`);
        setCollection(collectionData);
        setShareSaves(!!(collectionData as any).shareSaves);
        const itemsList = Array.isArray(collectionData?.items) ? collectionData.items : [];
        setItems(itemsList);
        const hasMoreData = collectionData?.hasMore === true;
        setHasMore(hasMoreData);
        setNextOffset(itemsList.length);
      } else {
        const itemsData = await api.get(`/collections/${collectionId}/items?limit=${ITEMS_PAGE_SIZE}&offset=${offset}`);
        const itemsList = Array.isArray(itemsData?.items) ? itemsData.items : [];
        setItems(prev => [...prev, ...itemsList]);
        setHasMore(itemsData?.hasMore === true);
        setNextOffset(offset + itemsList.length);
      }
    } catch (error) {
      if (reset) setCollection(null);
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    api.get('/collections')
      .then((list: any[]) => {
        const arr = Array.isArray(list) ? list : [];
        setMoreCollections(arr.filter((c: any) => c.id !== collectionId).slice(0, 8));
      })
      .catch(() => { });
  }, [userId, collectionId]);

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      loadCollection(nextOffset, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, nextOffset, collectionId]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollection(0, true);
  }, [collectionId]);

  useEffect(() => {
    if (items.length === 0) return;
    const key = pickRandomHeaderImageKey(
      items.map(i => i.post).filter(Boolean),
      collectionId
    );
    setHeaderImageKey(prev => prev ?? key);
  }, [items, collectionId]);

  const renderItem = useCallback(({ item }: { item: CollectionItem }) => {
    if (!item?.post) return null;
    return (
      <View style={styles.itemContainer}>
        <PostItem post={item.post} />
        {item.curatorNote && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>{t('collections.curatorNote', 'CURATOR NOTE')}</Text>
            <Text style={styles.noteText}>{item.curatorNote}</Text>
          </View>
        )}
      </View>
    );
  }, [t]);

  const keyExtractor = useCallback((item: CollectionItem) => item.id, []);

  const handleAddCitationStable = useCallback(() => {
    showToast(t('collections.addCitationHint', "To add items, browse posts and tap 'Keep' or 'Add to Collection'."));
  }, [showToast, t]);

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyWrapper}>
      <EmptyState
        icon="folder-open"
        headline={t('collections.emptyDetail', 'No items in this collection')}
        subtext={t('collections.emptyDetailHint', 'Add posts from the reading screen.')}
      />
      <Pressable
        style={styles.addCitationButton}
        onPress={handleAddCitationStable}
        accessibilityLabel={t('collections.addCitation')}
        accessibilityRole="button"
      >
        <MaterialIcons name="add" size={HEADER.iconSize} color={COLORS.primary} />
        <Text style={styles.addCitationText}>{t('collections.addCitation')}</Text>
      </Pressable>
    </View>
  ), [t, handleAddCitationStable]);

  const headerBar = (
    <View style={[styles.headerBar, { paddingTop: insets.top }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }: { pressed: boolean }) => [styles.backButtonBar, pressed && { opacity: 0.7 }]}
        accessibilityLabel={t('common.back', 'Go back')}
        accessibilityRole="button"
      >
        <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={COLORS.paper} />
      </Pressable>
      <Text style={styles.headerBarTitle} numberOfLines={1}>{collection?.title ?? t('collections.title', 'Collection')}</Text>
      <View style={styles.headerBarSpacer} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {headerBar}
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!collection) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {headerBar}
        <View style={styles.centered}>
          <MaterialIcons name="error-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
          <Text style={styles.errorText}>{t('collections.notFound', 'Collection not found')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const listHeader = useMemo(
    () => (
      <>
        <AnimatedView style={{ opacity: heroOpacity }}>
          <TopicCollectionHeader
            type="collection"
            title={collection.title}
            description={collection.description}
            headerImageKey={headerImageKey}
            onBack={() => router.back()}
            onAction={handleShare}
            actionLabel={t('common.share')}
            rightAction={isOwner ? 'more' : undefined}
            onRightAction={isOwner ? () => setMoreOptionsVisible(true) : undefined}
            metrics={{ itemCount: items.length }}
          />
        </AnimatedView>
        {moreCollections.length > 0 ? (
          <View style={styles.moreSection}>
            <Text style={styles.moreSectionTitle}>{t('collections.moreCollections', 'More collections')}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moreScrollContent}
            >
              {moreCollections.map((c: any) => (
                <Pressable
                  key={c.id}
                  style={styles.moreCollectionCard}
                  onPress={() => router.push(`/collections/${c.id}`)}
                >
                  {c.previewImageKey ? (
                    <Image source={{ uri: getImageUrl(c.previewImageKey) }} style={styles.moreCollectionImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.moreCollectionImagePlaceholder}>
                      <MaterialIcons name="folder" size={32} color={COLORS.tertiary} />
                    </View>
                  )}
                  <View style={styles.moreCollectionCardText}>
                    <Text style={styles.moreCollectionTitle} numberOfLines={2}>{c.title}</Text>
                    {c.itemCount != null && (
                      <Text style={styles.moreCollectionCount}>{c.itemCount} {t('collections.items', 'items')}</Text>
                    )}
                    <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </>
    ),
    [collection, headerImageKey, isOwner, moreCollections, items.length, shareSaves, heroOpacity, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <AnimatedView
        style={[styles.stickyBar, { opacity: stickyOpacity, paddingTop: insets.top }]}
        pointerEvents={stickyVisible ? 'auto' : 'none'}
      >
        <View style={styles.stickyBarContent}>
          <Pressable onPress={() => router.back()} style={styles.stickyBackBtn} accessibilityLabel={t('common.back', 'Back')}>
            <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={COLORS.paper} />
          </Pressable>
          <Text style={styles.stickyBarTitle} numberOfLines={1}>{collection.title}</Text>
          <View style={styles.stickyBarSpacer} />
        </View>
      </AnimatedView>

      {isOwner && (
        <OptionsActionSheet
          visible={moreOptionsVisible}
          title={t('collections.options', 'Collection Options')}
          options={[
            { label: t('collections.edit', 'Edit'), onPress: openEditModal, icon: 'edit' },
            { label: t('collections.delete', 'Delete Collection'), onPress: () => { setMoreOptionsVisible(false); setDeleteConfirmVisible(true); }, destructive: true },
          ]}
          cancelLabel={t('common.cancel')}
          onCancel={() => setMoreOptionsVisible(false)}
        />
      )}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title={t('collections.delete', 'Delete Collection')}
        message={t('collections.deleteConfirm', 'Are you sure you want to delete this collection? All items will be removed. This cannot be undone.')}
        confirmLabel={t('collections.delete', 'Delete Collection')}
        cancelLabel={t('common.cancel')}
        destructive
        onConfirm={handleDeleteCollection}
        onCancel={() => setDeleteConfirmVisible(false)}
      />

      <Modal visible={editModalVisible} transparent animationType="slide">
        <Pressable style={styles.editModalOverlay} onPress={() => setEditModalVisible(false)}>
          <View style={[styles.editModalContent, { paddingBottom: insets.bottom + SPACING.l }]} onStartShouldSetResponder={() => true}>
            <View style={styles.editModalHandle} />
            <Text style={styles.editModalTitle}>{t('collections.edit', 'Edit collection')}</Text>
            <TextInput
              style={styles.editModalInput}
              placeholder={t('collections.titlePlaceholder', 'Title')}
              placeholderTextColor={COLORS.tertiary}
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              style={[styles.editModalInput, styles.editModalInputMultiline]}
              placeholder={t('collections.descPlaceholder', 'Description (optional)')}
              placeholderTextColor={COLORS.tertiary}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
              numberOfLines={2}
            />
            <View style={styles.editModalSwitchRow}>
              <Text style={styles.editModalSwitchLabel}>{t('collections.visibility', 'Visibility')}</Text>
              <Switch
                value={editIsPublic}
                onValueChange={setEditIsPublic}
                trackColor={{ false: COLORS.tertiary + '40', true: COLORS.primary + '99' }}
                thumbColor={editIsPublic ? COLORS.primary : COLORS.secondary}
              />
            </View>
            <View style={styles.editModalSwitchRow}>
              <Text style={styles.editModalSwitchLabel}>{t('collections.shareSaves', 'Share saves')}</Text>
              <Switch
                value={editShareSaves}
                onValueChange={setEditShareSaves}
                trackColor={{ false: COLORS.tertiary + '40', true: COLORS.primary + '99' }}
                thumbColor={editShareSaves ? COLORS.primary : COLORS.secondary}
              />
            </View>
            <View style={styles.editModalButtons}>
              <Pressable style={styles.editModalButtonCancel} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.editModalButtonTextCancel}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable style={[styles.editModalButtonSave, !editTitle.trim() && styles.editModalButtonDisabled]} onPress={handleSaveEdit} disabled={!editTitle.trim()}>
                <Text style={styles.editModalButtonTextSave}>{t('common.save', 'Save')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      <Animated.FlatList
        style={styles.list}
        data={items}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true, listener: (e: any) => setStickyVisible(e.nativeEvent.contentOffset.y > STICKY_HEADER_APPEAR) }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={<ListFooterLoader visible={!!(hasMore && loadingMore)} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        {...FLATLIST_DEFAULTS}
      />
    </SafeAreaView>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  backButtonBar: {
    padding: SPACING.s,
    marginLeft: -SPACING.s,
  },
  headerBarTitle: {
    flex: 1,
    fontSize: HEADER.titleSize,
    fontWeight: '600',
    color: COLORS.paper,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  headerBarSpacer: {
    width: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  list: {
    flex: 1,
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
  emptyWrapper: {
    paddingVertical: SPACING.xxxl,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  noteContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
    marginLeft: SPACING.l,
    marginTop: SPACING.s,
  },
  noteLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  addCitationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    gap: SPACING.m,
  },
  addCitationText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
  moreSection: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  moreSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  moreScrollContent: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
    paddingRight: SPACING.xl,
  },
  moreCollectionCard: {
    width: 200,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
  },
  moreCollectionImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.divider,
  },
  moreCollectionImagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreCollectionCardText: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    gap: SPACING.s,
  },
  moreCollectionTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  moreCollectionCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  stickyBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  stickyBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
  },
  stickyBackBtn: {
    padding: SPACING.s,
    marginLeft: -SPACING.s,
  },
  stickyBarTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginLeft: SPACING.s,
    fontFamily: FONTS.semiBold,
  },
  stickyBarSpacer: {
    width: 40,
  },
  shareSavesRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  shareSavesBtn: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  shareSavesBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shareSavesBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
  },
  shareSavesBtnTextActive: {
    color: COLORS.ink,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  editModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: 'center',
    marginBottom: SPACING.l,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.m,
  },
  editModalInput: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
  },
  editModalInputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editModalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.m,
  },
  editModalSwitchLabel: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  editModalButtons: {
    flexDirection: 'row',
    gap: SPACING.m,
    marginTop: SPACING.l,
  },
  editModalButtonCancel: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
  },
  editModalButtonSave: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  editModalButtonDisabled: {
    opacity: 0.5,
  },
  editModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  editModalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
});