import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { OptionsActionSheet } from '../../components/OptionsActionSheet';
import { ConfirmModal } from '../../components/ConfirmModal';
import { PostItem } from '../../components/PostItem';
import { TopicCollectionHeader, pickRandomHeaderImageKey } from '../../components/TopicCollectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { Collection, CollectionItem } from '../../types';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../constants/theme';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { showToast, showSuccess, showError } = useToast();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [headerImageKey, setHeaderImageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out this collection: https://cite.app/collections/${id}`,
      });
    } catch (error) {
      // console.error(error);
    }
  };

  const handleTogglePublic = async () => {
    if (!collection) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !collection.isPublic;
    setCollection((prev) => prev ? ({ ...prev, isPublic: newValue }) : null);
    try {
      await api.patch(`/collections/${id}`, { isPublic: newValue });
    } catch (error) {
      setCollection((prev) => prev ? ({ ...prev, isPublic: !newValue }) : null);
      // console.error(error);
    }
  };

  const handleAddCitation = () => {
    showToast("To add items, browse posts and tap the 'Keep' or 'Add to Collection' button.");
  };

  const handleDeleteCollection = async () => {
    try {
      await api.delete(`/collections/${id}`);
      showSuccess(t('collections.deleted', 'Collection deleted'));
      setDeleteConfirmVisible(false);
      setMoreOptionsVisible(false);
      router.back();
    } catch (error) {
      showError(t('collections.deleteFailed', 'Failed to delete collection'));
      throw error;
    }
  };

  useEffect(() => {
    if (id) {
      setPage(1);
      setItems([]);
      loadCollection(1, true);
    }
  }, [id]);

  const loadCollection = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setItems([]);
    } else {
      setLoadingMore(true);
    }
    try {
      // Step 1: Load collection metadata first
      const collectionData = await api.get(`/collections/${id}`);
      setCollection(collectionData);
      setLoading(false); // Show metadata instantly

      // Step 2: Load items in background
      const itemsData = await api.get(`/collections/${id}/items?page=${pageNum}&limit=20`);
      const itemsList = Array.isArray(itemsData.items || itemsData) ? (itemsData.items || itemsData) : [];

      if (reset) {
        setItems(itemsList);
      } else {
        setItems(prev => [...prev, ...itemsList]);
      }

      const hasMoreData = itemsList.length === 20 && (itemsData.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error) {
      // console.error('Failed to load collection', error);
      setLoading(false);
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadCollection(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollection(1, true);
  }, [id]);

  const contributors = useMemo(() => {
    const authors = new Map();
    items.forEach(item => {
      if (item.post?.author) {
        authors.set(item.post.author.id, item.post.author);
      }
    });
    return Array.from(authors.values());
  }, [items]);

  useEffect(() => {
    if (items.length === 0) return;
    const key = pickRandomHeaderImageKey(
      items.map(i => i.post).filter(Boolean),
      typeof id === 'string' ? id : (id?.[0] ?? '')
    );
    setHeaderImageKey(prev => prev ?? key);
  }, [items, id]);

  const renderItem = useCallback(({ item }: { item: CollectionItem }) => (
    <View style={styles.itemContainer}>
      <PostItem post={item.post} />
      {item.curatorNote && (
        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>CURATOR NOTE</Text>
          <Text style={styles.noteText}>{item.curatorNote}</Text>
        </View>
      )}
    </View>
  ), [t]);

  const keyExtractor = useCallback((item: CollectionItem) => item.id, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('collections.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopicCollectionHeader
        type="collection"
        title={collection.title}
        description={collection.description}
        headerImageKey={headerImageKey}
        onBack={() => router.back()}
        onAction={handleShare}
        actionLabel={t('common.share')}
        rightAction="more"
        onRightAction={() => setMoreOptionsVisible(true)}
        metrics={{ itemCount: items.length }}
      />

      <OptionsActionSheet
        visible={moreOptionsVisible}
        title={t('collections.options', 'Collection Options')}
        options={[
          { label: t('collections.delete', 'Delete Collection'), onPress: () => { setMoreOptionsVisible(false); setDeleteConfirmVisible(true); }, destructive: true },
        ]}
        cancelLabel={t('common.cancel')}
        onCancel={() => setMoreOptionsVisible(false)}
      />
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

      <View style={styles.shareSavesSection}>
        <View style={styles.shareSavesContent}>
          <View>
            <Text style={styles.shareSavesLabel}>{t('collections.shareSaves')}</Text>
            <Text style={styles.shareSavesDesc}>{t('collections.shareSavesDesc')}</Text>
          </View>
          <View style={styles.toggleContainer}>
            {/* Toggle switch - using a simple Pressable for now */}
            <Pressable
              style={[styles.toggle, collection.isPublic && styles.toggleActive]}
              onPress={handleTogglePublic}
              accessibilityRole="switch"
              accessibilityState={{ checked: collection.isPublic }}
            >
              <View style={[styles.toggleThumb, collection.isPublic && styles.toggleThumbActive]} />
            </Pressable>
          </View>
        </View>
      </View>

      <FlatList
        data={items}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="folder-open"
            headline={t('collections.emptyDetail', 'No items in this collection')}
            subtext={t('collections.emptyDetailHint', 'Add posts from the reading screen.')}
          />
        }
        ListFooterComponent={
          <View>
            {ListFooterComponent}
            <Pressable
              style={styles.addCitationButton}
              onPress={handleAddCitation}
              accessibilityLabel={t('collections.addCitation')}
              accessibilityRole="button"
            >
              <MaterialIcons name="add" size={HEADER.iconSize} color={COLORS.primary} />
              <Text style={styles.addCitationText}>{t('collections.addCitation')}</Text>
            </Pressable>
          </View>
        }
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
    </View>
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
  badge: {
    backgroundColor: COLORS.hover,
    paddingHorizontal: SPACING.m,
    paddingVertical: 4,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.pressed,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  shareSavesSection: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  shareSavesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shareSavesLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  shareSavesDesc: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  toggleContainer: {
    marginLeft: SPACING.l,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.tertiary,
  },
  toggleThumbActive: {
    backgroundColor: '#FFFFFF',
    marginLeft: 'auto',
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
});