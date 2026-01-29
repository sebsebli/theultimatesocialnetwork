import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { PostItem } from '../components/PostItem';
import { PersonCard, TopicCard } from '../components/ExploreCards';
import { COLORS, SPACING, SIZES, FONTS } from '../constants/theme';

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<'posts' | 'people' | 'topics'>('posts');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      if (activeType === 'posts') {
        const res = await api.get<{ hits: any[] }>(`/search/posts?q=${encodeURIComponent(searchQuery)}`);
        setResults(res.hits || []);
      } else if (activeType === 'people') {
        const res = await api.get<{ hits: any[] }>(`/search/users?q=${encodeURIComponent(searchQuery)}`);
        setResults(res.hits || []);
      } else if (activeType === 'topics') {
        const res = await api.get<{ hits: any[] }>(`/search/topics?q=${encodeURIComponent(searchQuery)}`);
        const topics = (res.hits || []).map((t: any) => ({
          ...t,
          title: t.title || t.slug,
        }));
        setResults(topics);
      }
    } catch (error) {
      console.error('Failed to search', error);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = useMemo(
    () => {
      let timeoutId: NodeJS.Timeout;
      return (searchQuery: string) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          handleSearch(searchQuery);
        }, 300);
      };
    },
    [activeType]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel={t('common.goBack', 'Go back')}
          accessibilityRole="button"
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.paper} />
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
        />
      </View>

      <View style={styles.tabs}>
        {(['posts', 'people', 'topics'] as const).map((type) => (
          <Pressable
            key={type}
            style={[styles.tab, activeType === type && styles.tabActive]}
            onPress={() => {
              setActiveType(type);
              if (query) handleSearch(query);
            }}
            accessibilityLabel={t(`search.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeType === type }}
          >
            <Text style={[styles.tabText, activeType === type && styles.tabTextActive]}>
              {t(`search.${type}`, type.charAt(0).toUpperCase() + type.slice(1))}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item: any) => item.id}
        renderItem={useCallback(({ item }: { item: any }) => {
          if (activeType === 'posts') {
            return <PostItem post={item} />;
          } else if (activeType === 'people') {
            return (
              <PersonCard 
                item={item} 
                onPress={() => router.push(`/user/${item.handle}`)} 
                showWhy={false} 
              />
            );
          } else {
            return (
              <TopicCard 
                item={item} 
                onPress={() => router.push(`/topic/${item.slug}`)} 
                showWhy={false} 
              />
            );
          }
        }, [activeType, router])}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? t('common.loading') : query ? t('search.noResults') : t('search.startTyping')}
            </Text>
          </View>
        }
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
    paddingTop: SPACING.header,
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.l,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
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
});