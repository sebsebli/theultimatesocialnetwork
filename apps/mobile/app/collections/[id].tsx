import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
      const collectionData = await api.get(`/collections/${id}`);
      setCollection(collectionData);
      const itemsList = Array.isArray(collectionData?.items) ? collectionData.items : [];
      if (reset) {
        setItems(itemsList);
      } else {
        setItems(prev => [...prev, ...itemsList]);
      }
      setHasMore(false); // API returns all items in one response; no pagination for items
    } catch (error) {
      // console.error('Failed to load collection', error);
      setCollection(null);
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
      loadCollection(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, id]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCollection(1, true);
  }, [id]);

  useEffect(() => {
    if (items.length === 0) return;
    const key = pickRandomHeaderImageKey(
      items.map(i => i.post).filter(Boolean),
      typeof id === 'string' ? id : (id?.[0] ?? '')
    );
    setHeaderImageKey(prev => prev ?? key);
  }, [items, id]);

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

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
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

      <FlatList
        style={styles.list}
        data={items}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});