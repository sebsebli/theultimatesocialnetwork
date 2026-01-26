import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, Share, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { PostItem } from '../../components/PostItem';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [collection, setCollection] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
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
      console.error(error);
    }
  };

  const handleTogglePublic = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newValue = !collection.isPublic;
    setCollection((prev: any) => ({ ...prev, isPublic: newValue }));
    try {
      await api.patch(`/collections/${id}`, { isPublic: newValue });
    } catch (error) {
      setCollection((prev: any) => ({ ...prev, isPublic: !newValue }));
      console.error(error);
    }
  };

  const handleAddCitation = () => {
    showToast("To add items, browse posts and tap the 'Keep' or 'Add to Collection' button.");
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
      console.error('Failed to load collection', error);
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

  const renderItem = useCallback(({ item }: { item: any }) => (
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

  const keyExtractor = useCallback((item: any) => item.id, []);

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
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
        </Pressable>
        <View style={styles.placeholder} />
        <Pressable
          onPress={handleShare}
          accessibilityLabel={t('common.share')}
          accessibilityRole="button"
        >
          <Text style={styles.shareButton}>{t('common.share')}</Text>
        </Pressable>
      </View>

      <View style={styles.info}>
        <Text style={styles.collectionLabel}>COLLECTION</Text>
        <Text style={styles.collectionTitle}>{collection.title}</Text>
        {collection.description && (
          <Text style={styles.description}>{collection.description}</Text>
        )}
        <View style={styles.metaRow}>
          <View style={styles.avatarStack}>
            {/* Mock avatars - in real app, load from collection.contributors */}
            <View style={styles.avatarSmall} />
            <View style={[styles.avatarSmall, styles.avatarOverlay]}>
              <Text style={styles.avatarOverlayText}>+3</Text>
            </View>
          </View>
          <Text style={styles.count}>
            {items.length} {items.length === 1 ? t('collections.post') : t('collections.posts')}
          </Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.updated}>
            {t('collections.updated')} 2h {t('common.ago')}
          </Text>
        </View>
      </View>

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
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{t('collections.emptyDetail')}</Text>
          </View>
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
              <MaterialIcons name="add" size={24} color={COLORS.primary} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  placeholder: {
    flex: 1,
  },
  shareButton: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
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
  info: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  collectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  collectionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: COLORS.secondary,
    marginBottom: SPACING.m,
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.divider,
    borderWidth: 2,
    borderColor: COLORS.ink,
  },
  avatarOverlay: {
    marginLeft: -8,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlayText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
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
  count: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  separator: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginHorizontal: SPACING.xs,
  },
  updated: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
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