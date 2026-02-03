import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Text, View, TextInput, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { PostItem } from '../components/PostItem';
import { TopicCard } from '../components/ExploreCards';
import { UserCard } from '../components/UserCard';
import { EmptyState, emptyStateCenterWrapStyle } from '../components/EmptyState';
import { SectionHeader } from '../components/SectionHeader';
import { ListFooterLoader } from '../components/ListFooterLoader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS } from '../constants/theme';

type SearchType = 'all' | 'posts' | 'people' | 'topics';

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ topicSlug?: string }>();
  const topicSlug = typeof params.topicSlug === 'string' ? params.topicSlug : undefined;
  const { t } = useTranslation();
  const SEARCH_PAGE_SIZE = 20;
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<SearchType>(topicSlug ? 'posts' : 'all');
  const [results, setResults] = useState<any[]>([]);
  const [allResults, setAllResults] = useState<{ posts: any[]; users: any[]; topics: any[] }>({ posts: [], users: [], topics: [] });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const onEndReachedFiredRef = useRef(false);

  useEffect(() => {
    if (topicSlug) setActiveType('posts');
  }, [topicSlug]);

  const handleSearch = useCallback(async (searchQuery: string, append = false) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setAllResults({ posts: [], users: [], topics: [] });
      setHasMore(true);
      return;
    }
    if (append) setLoadingMore(true);
    else setLoading(true);
    setHasMore(true);
    try {
      if (activeType === 'all' && !topicSlug) {
        const res = await api.get<{ posts: any[]; users: any[]; topics: any[] }>(`/search/all?q=${encodeURIComponent(searchQuery)}&limit=15`);
        setAllResults({
          posts: res.posts || [],
          users: res.users || [],
          topics: (res.topics || []).map((topic: any) => ({ ...topic, title: topic.title || topic.slug })),
        });
        setResults([]);
        setHasMore(false);
      } else if (activeType === 'posts') {
        const topicParam = topicSlug ? `&topicSlug=${encodeURIComponent(topicSlug)}` : '';
        const offset = append ? results.length : 0;
        const res = await api.get<{ hits: any[] }>(`/search/posts?q=${encodeURIComponent(searchQuery)}&limit=${SEARCH_PAGE_SIZE}&offset=${offset}${topicParam}`);
        const hits = res.hits || [];
        if (append) setResults((prev) => [...prev, ...hits]);
        else setResults(hits);
        setHasMore(hits.length >= SEARCH_PAGE_SIZE);
      } else if (activeType === 'people') {
        const offset = append ? results.length : 0;
        const res = await api.get<{ hits: any[] }>(`/search/users?q=${encodeURIComponent(searchQuery)}&limit=${SEARCH_PAGE_SIZE}&offset=${offset}`);
        const hits = res.hits || [];
        if (append) setResults((prev) => [...prev, ...hits]);
        else setResults(hits);
        setHasMore(hits.length >= SEARCH_PAGE_SIZE);
      } else if (activeType === 'topics') {
        const offset = append ? results.length : 0;
        const res = await api.get<{ hits: any[] }>(`/search/topics?q=${encodeURIComponent(searchQuery)}&limit=${SEARCH_PAGE_SIZE}&offset=${offset}`);
        const hits = (res.hits || []).map((topic: any) => ({ ...topic, title: topic.title || topic.slug }));
        if (append) setResults((prev) => [...prev, ...hits]);
        else setResults(hits);
        setHasMore(hits.length >= SEARCH_PAGE_SIZE);
      }
    } catch (error) {
      console.error('Failed to search', error);
      if (!append) {
        setResults([]);
        setAllResults({ posts: [], users: [], topics: [] });
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeType, topicSlug, results.length]);

  const handleLoadMore = useCallback(() => {
    if (!query.trim() || loading || loadingMore || !hasMore) return;
    if (activeType === 'all' && !topicSlug) return;
    if (onEndReachedFiredRef.current) return;
    onEndReachedFiredRef.current = true;
    handleSearch(query, true).finally(() => {
      onEndReachedFiredRef.current = false;
    });
  }, [query, loading, loadingMore, hasMore, activeType, topicSlug, handleSearch]);

  const debouncedSearch = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(searchQuery);
        }, 350);
      };
    },
    [handleSearch]
  );

  const flatListData = useMemo(() => {
    if (activeType === 'all' && !topicSlug) {
      const postsWithAuthor = allResults.posts.filter((p: any) => !!p?.author);
      return [
        ...(postsWithAuthor.length ? [{ type: 'section', key: 'posts', title: t('search.posts', 'Posts') }] : []),
        ...postsWithAuthor.map((p: any) => ({ type: 'post', ...p, key: p.id })),
        ...(allResults.users.length ? [{ type: 'section', key: 'people', title: t('search.people', 'People') }] : []),
        ...allResults.users.map((u: any) => ({ type: 'user', ...u, key: u.id })),
        ...(allResults.topics.length ? [{ type: 'section', key: 'topics', title: t('search.topics', 'Topics') }] : []),
        ...allResults.topics.map((tpc: any) => ({ type: 'topic', ...tpc, key: tpc.id })),
      ];
    }
    const list = activeType === 'posts' ? results.filter((r: any) => !!r?.author) : results;
    return list.map((r: any) => ({ ...r, type: activeType === 'posts' ? 'post' : activeType === 'people' ? 'user' : 'topic' }));
  }, [activeType, allResults, results, t, topicSlug]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'section') {
      return <SectionHeader title={item.title} />;
    }
    if (item.type === 'post') return <PostItem post={item} />;
    if (item.type === 'user') {
      return (
        <UserCard
          item={item}
          onPress={() => router.push(`/user/${item.handle}`)}
        />
      );
    }
    if (item.type === 'topic') {
      return (
        <TopicCard
          item={item}
          onPress={() => router.push(`/topic/${encodeURIComponent(item.slug || item.id)}`)}
        />
      );
    }
    return null;
  }, [router]);

  const keyExtractor = useCallback((item: any, index: number) => {
    if (item.type === 'section') return `search-section-${index}-${item.key}`;
    return `search-${item.type}-${index}-${item.id ?? item.slug ?? item.key ?? index}`;
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top, paddingHorizontal: HEADER.barPaddingHorizontal, paddingBottom: HEADER.barPaddingBottom }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack', 'Go back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={HEADER.iconSize} color={HEADER.iconColor} />
        </Pressable>
        <TextInput
          style={styles.searchInput}
          placeholder={t('home.search')}
          placeholderTextColor={COLORS.tertiary}
          value={query}
          onChangeText={(text: string) => {
            setQuery(text);
            debouncedSearch(text);
          }}
          autoFocus
          accessibilityLabel={t('home.search')}
          includeFontPadding={false}
        />
      </View>

      {!topicSlug && (
        <View style={styles.tabs}>
          {(['all', 'posts', 'people', 'topics'] as const).map((type) => (
            <Pressable
              key={type}
              style={[styles.tab, activeType === type && styles.tabActive]}
              onPress={() => {
                setActiveType(type);
                if (query) handleSearch(query, false);
              }}
              accessibilityLabel={t(`search.${type}`, type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1))}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeType === type }}
            >
              <Text style={[styles.tabText, activeType === type && styles.tabTextActive]}>
                {t(`search.${type}`, type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1))}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {topicSlug ? (
        <View style={styles.topicScopeBar}>
          <Text style={styles.topicScopeText} numberOfLines={1}>
            {t('search.withinTopic', 'Searching within this topic')}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={flatListData}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={emptyStateCenterWrapStyle}>
            {loading ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>{t('common.loading')}</Text>
              </View>
            ) : (
              <EmptyState
                icon="search"
                headline={query ? t('search.noResults', 'No results') : (topicSlug ? t('search.typeToSearchInTopic', 'Type to search in this topic') : t('search.startTyping', 'Search posts, people, topics'))}
                subtext={query ? t('search.noResultsHint', 'Try different keywords.') : undefined}
              />
            )}
          </View>
        }
        contentContainerStyle={flatListData.length === 0 ? { flexGrow: 1 } : undefined}
        ListFooterComponent={
          <ListFooterLoader
            visible={
              (activeType === 'posts' || activeType === 'people' || activeType === 'topics') && hasMore && loadingMore
            }
          />
        }
        {...FLATLIST_DEFAULTS}
      />
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    backgroundColor: COLORS.ink,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    paddingVertical: 0,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    textAlignVertical: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
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
  sectionHeader: {
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.s,
    backgroundColor: COLORS.ink,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicScopeBar: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.hover,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  topicScopeText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: 'center',
  },
});