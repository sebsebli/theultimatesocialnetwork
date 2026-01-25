import { StyleSheet, Text, View, FlatList, Pressable, TextInput, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../utils/api';
import { PostItem } from '../../components/PostItem';
import { DeepDiveCard, PersonCard, QuoteCard } from '../../components/ExploreCards';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';
import { ErrorState } from '../../components/ErrorState';
import { useAuth } from '../../context/auth';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'topics' | 'people' | 'quoted' | 'deep-dives'>('topics');
  const [sort, setSort] = useState<'recommended' | 'newest'>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Only load content if authenticated
    // Let auth context handle redirects to avoid navigation before mount
    if (isAuthenticated) {
      setPage(1);
      setData([]);
      loadContent(1, true);
    }
  }, [activeTab, sort, isAuthenticated]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (!reset && (loading || loadingMore)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
      // Don't clear data immediately to prevent flash, unless switching tabs
      if (data.length === 0) setData([]); 
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      let endpoint = '/explore/topics';
      if (activeTab === 'people') endpoint = '/explore/people';
      if (activeTab === 'quoted') endpoint = '/explore/quoted-now';
      if (activeTab === 'deep-dives') endpoint = '/explore/deep-dives';

      const res = await api.get(`${endpoint}?page=${pageNum}&limit=20`);
      const rawItems = Array.isArray(res.items || res) ? (res.items || res) : [];
      const items = rawItems.map((item: any) => ({
        ...item,
        author: item.author || { 
          id: item.authorId || '', 
          handle: 'unknown', 
          displayName: 'Unknown User' 
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
      // If 401, auth handler will redirect - don't set error state
      if (error?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      console.error('Failed to load content', error);
      setError(true);
      if (data.length > 0) {
         // Alert needs to be imported from 'react-native'
         // I will assume it is or add it if possible, but replace tool handles string replacement.
         // I'll just change the render logic first.
      }
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
      loadContent(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab, sort]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, [activeTab, sort]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (activeTab === 'deep-dives') {
      return <DeepDiveCard item={item} onPress={() => {}} />;
    } else if (activeTab === 'people') {
      return <PersonCard item={item} onPress={() => router.push(`/user/${item.handle}`)} />;
    } else if (activeTab === 'quoted') {
      return <QuoteCard item={item} onPress={() => router.push(`/post/${item.id}`)} />;
    } else {
      // Ensure item has required structure
      if (!item || !item.id) {
        return null;
      }
      return <PostItem post={item} />;
    }
  }, [activeTab, router]);

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
      {/* Title Row - Matching Home Screen */}
      <View style={styles.titleRow}>
         <MaterialCommunityIcons name="compass-outline" size={24} color={COLORS.paper} />
         <Text style={styles.headerTitle}>{t('explore.title') || 'Discover'}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={24} color={COLORS.tertiary} accessibilityLabel={t('home.search')} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('explore.searchPlaceholder')}
            placeholderTextColor={COLORS.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel={t('explore.searchPlaceholder')}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContent}>
          {(['topics', 'people', 'quoted', 'deep-dives'] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              accessibilityLabel={tab === 'deep-dives' ? t('explore.deepDives') : tab === 'quoted' ? t('explore.quoted') : t(`explore.${tab}`)}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === 'deep-dives' ? t('explore.deepDives') : 
                 tab === 'quoted' ? t('explore.quoted') : 
                 t(`explore.${tab}`)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable 
          style={styles.filterButton}
          accessibilityLabel="Filter"
          accessibilityRole="button"
        >
          <MaterialIcons name="tune" size={24} color={COLORS.tertiary} />
        </Pressable>
        <Pressable 
          style={styles.sortButton}
          accessibilityLabel={t('explore.sortOptions')}
          accessibilityRole="button"
        >
          <MaterialIcons name="sort" size={18} color={COLORS.secondary} />
          <Text style={styles.sortText}>{t('explore.sortOptions')}</Text>
        </Pressable>
      </View>

      {/* Headline */}
      <Text style={styles.sectionHeadline}>{t('explore.recommended')}</Text>
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
                {loading ? t('common.loading') : 
                 activeTab === 'topics' ? t('explore.noTopics') :
                 activeTab === 'people' ? t('explore.noPeople') :
                 activeTab === 'quoted' ? t('explore.noQuoted') :
                 activeTab === 'deep-dives' ? t('explore.noDeepDives') :
                 t('common.loading')}
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={10}
        />
      )}
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
    paddingTop: SPACING.s, // Add some top padding
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
  },
  searchBar: {
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
  searchInput: {
    flex: 1,
    color: COLORS.paper,
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
    paddingBottom: SPACING.m, // pb-3
    borderBottomWidth: 3, // border-b-[3px]
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary, // border-b-primary
  },
  tabText: {
    fontSize: 14, // text-sm
    fontWeight: '700', // font-bold
    color: COLORS.tertiary, // text-tertiary
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5, // tracking-tight
  },
  tabTextActive: {
    color: COLORS.paper, // text-paper
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.l,
  },
  filterButton: {
    padding: SPACING.s,
    borderRadius: 8,
    // hover effect handled by Pressable usually
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadiusPill,
    height: 36,
    paddingHorizontal: SPACING.l,
    overflow: 'hidden',
  },
  sortText: {
    fontSize: 12, // text-xs
    fontWeight: '700', // font-bold
    color: COLORS.secondary, // text-secondary
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5, // tracking-tight
  },
  sectionHeadline: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: COLORS.paper, // text-paper
    paddingHorizontal: SPACING.l, // px-4
    marginBottom: SPACING.l,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5, // tracking-tight
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
});
