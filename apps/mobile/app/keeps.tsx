import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, FlatList, TextInput, Pressable, Modal, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { PostItem } from '../components/PostItem';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export default function KeepsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [keeps, setKeeps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unsorted' | 'in-collections'>('all');

  useEffect(() => {
    setPage(1);
    setKeeps([]);
    loadKeeps(1, true);
  }, [search, filter]);

  useEffect(() => {
    if (showPicker) {
      loadCollections();
    }
  }, [showPicker]);

  const loadKeeps = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setKeeps([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (filter === 'in-collections') params.append('inCollection', 'true');
      if (filter === 'unsorted') params.append('inCollection', 'false');

      const data = await api.get(`/keeps?${params.toString()}`);
      const items = Array.isArray(data.items || data) ? (data.items || data) : [];

      if (reset) {
        setKeeps(items);
      } else {
        setKeeps(prev => [...prev, ...items]);
      }

      const hasMoreData = items.length === 20 && (data.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error) {
      console.error('Failed to load keeps', error);
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
      loadKeeps(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, search, filter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadKeeps(1, true);
  }, [search, filter]);

  const renderItem = useCallback(({ item }: { item: any }) => (
    <View style={styles.keepContainer}>
      <PostItem post={item.post} />
      <Pressable
        style={styles.addButton}
        onPress={() => {
          setSelectedPostId(item.post.id);
          setShowPicker(true);
        }}
        accessibilityLabel={t('keeps.addToCollection')}
        accessibilityRole="button"
      >
        <Text style={styles.addButtonText}>{t('keeps.addToCollection')}</Text>
      </Pressable>
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

  const loadCollections = async () => {
    try {
      const data = await api.get('/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load collections', error);
    }
  };

  const addToCollection = async (collectionId: string) => {
    if (!selectedPostId) return;
    try {
      await api.post(`/collections/${collectionId}/items`, { postId: selectedPostId });
      setShowPicker(false);
      setSelectedPostId(null);
      Alert.alert(t('keeps.success'), t('keeps.addedToCollection'));
    } catch (error) {
      console.error('Failed to add to collection', error);
      Alert.alert(t('common.error'), t('keeps.failedAddToCollection'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('keeps.title')}</Text>
        <Pressable onPress={() => router.push('/search')}>
          <MaterialIcons name="search" size={24} color={COLORS.paper} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('keeps.searchPlaceholder')}
          placeholderTextColor={COLORS.tertiary}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterPills}>
          <Pressable
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
              {t('keeps.all')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, filter === 'unsorted' && styles.filterPillActive]}
            onPress={() => setFilter('unsorted')}
          >
            <Text style={[styles.filterPillText, filter === 'unsorted' && styles.filterPillTextActive]}>
              {t('keeps.unsorted')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.filterPill, filter === 'in-collections' && styles.filterPillActive]}
            onPress={() => setFilter('in-collections')}
          >
            <Text style={[styles.filterPillText, filter === 'in-collections' && styles.filterPillTextActive]}>
              {t('keeps.inCollections')}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={keeps}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? t('common.loading') : t('keeps.empty')}
            </Text>
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('keeps.chooseCollection')}</Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={styles.closeButton}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
            <FlatList
              data={collections}
              keyExtractor={(item: any) => item.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }: { item: any }) => (
                <Pressable
                  style={styles.collectionItem}
                  onPress={() => addToCollection(item.id)}
                >
                  <Text style={styles.collectionTitle}>{item.title}</Text>
                  <Text style={styles.addIcon}>+</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyTextModal}>{t('collections.empty')}</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  filters: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  searchInput: {
    height: 44,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.pressed,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  filterPills: {
    flexDirection: 'row',
    gap: SPACING.s,
  },
  filterPill: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  keepContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    position: 'relative',
  },
  addButton: {
    position: 'absolute',
    top: SPACING.l,
    right: SPACING.l,
    backgroundColor: 'rgba(110, 122, 138, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    maxHeight: '50%',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.l,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  closeButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  collectionItem: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  collectionTitle: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  addIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  emptyTextModal: {
    color: COLORS.secondary,
    textAlign: 'center',
    padding: SPACING.l,
    fontFamily: FONTS.regular,
  },
});
