import { StyleSheet, Text, View, FlatList, Pressable, TextInput, ScrollView, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { DeepDiveCard, PersonCard, QuoteCard, TopicCard } from '../../components/ExploreCards';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/auth';
import * as Haptics from 'expo-haptics';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [activeTab, setActiveTab] = useState<'topics' | 'people' | 'quoted' | 'deep-dives' | 'newsroom'>('topics');
  const [sort, setSort] = useState<'recommended' | 'newest' | 'cited'>('recommended');
  const [filter, setFilter] = useState<'all' | 'languages'>('languages'); // Default to my languages
  const [showWhy, setShowWhy] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  useEffect(() => {
    if (params.tab) {
      const tabName = Array.isArray(params.tab) ? params.tab[0] : params.tab;
      if (['topics', 'people', 'quoted', 'deep-dives', 'newsroom'].includes(tabName)) {
        setActiveTab(tabName as any);
      }
    }
    if (params.q) {
      const query = Array.isArray(params.q) ? params.q[0] : params.q;
      setSearchQuery(query);
    }
  }, [params.tab, params.q]);

  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      setData([]);
      loadContent(1, true);

      // Fetch preferences
      api.get('/users/me').then((user: any) => {
        if (user.preferences?.explore?.showWhy !== undefined) {
          setShowWhy(user.preferences.explore.showWhy);
        }
      }).catch(console.error);
    }
  }, [activeTab, sort, filter, isAuthenticated]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (!reset && (loading || loadingMore)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      let endpoint = '/explore/topics';

      if (activeTab === 'people') endpoint = '/explore/people';
      else if (activeTab === 'quoted') endpoint = '/explore/quoted-now';
      else if (activeTab === 'deep-dives') endpoint = '/explore/deep-dives';
      else if (activeTab === 'newsroom') endpoint = '/explore/newsroom';

      // Append sort/filter params
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sort: sort,
        filter: filter,
      });

      const res = await api.get(`${endpoint}?${queryParams.toString()}`);
      const rawItems = Array.isArray(res.items || res) ? (res.items || res) : [];
      const items = rawItems.map((item: any) => ({
        ...item,
        author: item.author || {
          id: item.authorId || '',
          handle: item.handle || t('post.unknownUser', 'Unknown'),
          displayName: item.displayName || t('post.unknownUser', 'Unknown')
        },
      }));

      if (reset) {
        setData(items);
      } else {
        setData(prev => [...prev, ...items]);
      }

      const hasMoreData = items.length === 20 && (res.hasMore !== false);
      setHasMore(hasMoreData);
    } catch (error: any) {
      if (error?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      console.error('Failed to load content', error);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleFollow = async (topic: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Optimistic update
      setData(prev => prev.map(item => 
        item.id === topic.id ? { ...item, isFollowing: !item.isFollowing } : item
      ));

      if (topic.isFollowing) {
        await api.delete(`/topics/${topic.slug}/follow`);
      } else {
        await api.post(`/topics/${topic.slug}/follow`);
      }
    } catch (err) {
      console.error('Follow failed', err);
      // Revert on failure
      setData(prev => prev.map(item => 
        item.id === topic.id ? { ...item, isFollowing: !item.isFollowing } : item
      ));
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadContent(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab, sort, filter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, [activeTab, sort, filter]);

  const applyFilter = (newFilter: 'all' | 'languages') => {
    setFilter(newFilter);
    setFilterModalVisible(false);
  };

  const applySort = (newSort: 'recommended' | 'newest' | 'cited') => {
    setSort(newSort);
    setSortModalVisible(false);
  };

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (activeTab === 'deep-dives') {
      return <DeepDiveCard item={item} onPress={() => router.push(`/post/${item.id}`)} showWhy={showWhy} />;
    } else if (activeTab === 'people') {
      return <PersonCard item={item} onPress={() => router.push(`/user/${item.handle}`)} showWhy={showWhy} />;
    } else if (activeTab === 'quoted') {
      return <QuoteCard item={item} onPress={() => router.push(`/post/${item.id}`)} showWhy={showWhy} />;
    } else if (activeTab === 'newsroom') {
      if (!item || !item.id) return null;
      // PostItem doesn't support showWhy yet, but maybe irrelevant for newsroom
      return <PostItem post={item} />;
    } else {
      if (!item || !item.id) return null;
      return (
        <TopicCard 
          item={item} 
          onPress={() => router.push(`/topic/${item.slug || item.id}`)} 
          onFollow={() => handleFollow(item)}
          showWhy={showWhy}
        />
      );
    }
  }, [activeTab, router, showWhy]);

  const keyExtractor = useCallback((item: any) => item.id, []);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  const renderHeader = () => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="compass-outline" size={24} color={COLORS.paper} />
        <Text style={styles.headerTitle}>{t('explore.title', 'Discover')}</Text>
      </View>

      <View style={styles.searchWrapper}>
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push('/search')}
          accessibilityRole="button"
          accessibilityLabel={t('explore.searchPlaceholder')}
        >
          <MaterialIcons name="search" size={24} color={COLORS.tertiary} />
          <Text style={styles.searchInputPlaceholder}>
            {t('explore.searchPlaceholder')}
          </Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => setSortModalVisible(true)}
          >
            <MaterialIcons name="sort" size={24} color={sort !== 'recommended' ? COLORS.primary : COLORS.tertiary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {(['topics', 'people', 'quoted', 'deep-dives', 'newsroom'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'deep-dives' ? t('explore.deepDives') :
                  tab === 'quoted' ? t('explore.quoted') :
                    tab === 'newsroom' ? t('explore.newsroom') :
                      t(`explore.${tab}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      {/* Spacer */}
      <View style={{ height: SPACING.l }} />
    </View>
  );

  return (
    <View style={styles.container}>
      {error && data.length === 0 ? (
        <ErrorState onRetry={() => loadContent(1, true)} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          ListHeaderComponent={renderHeader}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('explore.noContent')}
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
          onEndReachedThreshold={0.2}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFilterModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('explore.filter', 'Filter Content')}</Text>
            
            <Pressable style={styles.filterOption} onPress={() => applyFilter('languages')}>
              <Text style={[styles.filterOptionText, filter === 'languages' && styles.optionSelected]}>
                {t('explore.filterByLanguage', 'My Languages')}
              </Text>
              {filter === 'languages' && <MaterialIcons name="check" size={20} color={COLORS.primary} />}
            </Pressable>
            
            <Pressable style={styles.filterOption} onPress={() => applyFilter('all')}>
              <Text style={[styles.filterOptionText, filter === 'all' && styles.optionSelected]}>
                {t('explore.filterAll', 'All Languages')}
              </Text>
              {filter === 'all' && <MaterialIcons name="check" size={20} color={COLORS.primary} />}
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Sort Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={sortModalVisible}
        onRequestClose={() => setSortModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSortModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('explore.sortOptions', 'Sort By')}</Text>
            
            <Pressable style={styles.filterOption} onPress={() => applySort('recommended')}>
              <Text style={[styles.filterOptionText, sort === 'recommended' && styles.optionSelected]}>
                {t('explore.sortRecommended', 'Recommended')}
              </Text>
              {sort === 'recommended' && <MaterialIcons name="check" size={20} color={COLORS.primary} />}
            </Pressable>
            
            <Pressable style={styles.filterOption} onPress={() => applySort('newest')}>
              <Text style={[styles.filterOptionText, sort === 'newest' && styles.optionSelected]}>
                {t('explore.sortNewest', 'Newest')}
              </Text>
              {sort === 'newest' && <MaterialIcons name="check" size={20} color={COLORS.primary} />}
            </Pressable>

            <Pressable style={styles.filterOption} onPress={() => applySort('cited')}>
              <Text style={[styles.filterOptionText, sort === 'cited' && styles.optionSelected]}>
                {t('explore.sortMostCited', 'Most Cited')}
              </Text>
              {sort === 'cited' && <MaterialIcons name="check" size={20} color={COLORS.primary} />}
            </Pressable>

            <Pressable style={styles.closeButton} onPress={() => setSortModalVisible(false)}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  headerContainer: {
    backgroundColor: COLORS.ink,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.s,
    paddingTop: SPACING.s,
    gap: SPACING.m,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  searchWrapper: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: COLORS.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    height: 48,
    paddingHorizontal: SPACING.l,
    gap: SPACING.m,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  iconButton: {
    padding: SPACING.s,
    borderRadius: 8,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  searchInputPlaceholder: {
    flex: 1,
    color: COLORS.tertiary,
    fontSize: 16,
    fontFamily: FONTS.regular,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsContent: {
    paddingHorizontal: SPACING.l,
    gap: SPACING.xl,
  },
  tab: {
    paddingBottom: SPACING.m,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  tabTextActive: {
    color: COLORS.paper,
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
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end', // Bottom sheet style
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius,
    borderTopRightRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    borderTopWidth: 1,
    borderColor: COLORS.divider,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.hover,
  },
  filterOptionText: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  optionSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  closeButton: {
    marginTop: SPACING.l,
    alignItems: 'center',
    padding: SPACING.m,
  },
  closeButtonText: {
    color: COLORS.secondary,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
});
