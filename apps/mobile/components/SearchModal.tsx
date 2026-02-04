import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  FlatList,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../utils/api';
import { PostItem } from './PostItem';
import { TopicCard } from './ExploreCards';
import { UserCard } from './UserCard';
import { EmptyState, emptyStateCenterWrapStyle } from './EmptyState';
import { SectionHeader } from './SectionHeader';
import { HeaderIconButton, headerIconCircleSize, headerIconCircleMarginH } from './HeaderIconButton';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles, FLATLIST_DEFAULTS, SEARCH_BAR } from '../constants/theme';

const DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 20;

export interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  /** Optional initial query (e.g. from topic search-in-topic) */
  initialQuery?: string;
}

type ListItem =
  | { type: 'section'; key: string; title: string }
  | { type: 'post'; key: string; [k: string]: unknown }
  | { type: 'user'; key: string; [k: string]: unknown }
  | { type: 'topic'; key: string; [k: string]: unknown };

export function SearchModal({
  visible,
  onClose,
  initialQuery = '',
}: SearchModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery, visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [visible]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setPosts([]);
      setUsers([]);
      setTopics([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<{ posts: any[]; users: any[]; topics: any[] }>(
        `/search/all?q=${encodeURIComponent(trimmed)}&limit=${SEARCH_LIMIT}`,
      );
      const rawPosts = (res.posts || []).filter((p: any) => !!p?.author);
      const rawUsers = res.users || [];
      const rawTopics = (res.topics || []).map((tpc: any) => ({
        ...tpc,
        title: tpc.title || tpc.slug,
      }));
      setPosts(rawPosts);
      setUsers(rawUsers);
      setTopics(rawTopics);
    } catch (err) {
      console.error('Search failed', err);
      setPosts([]);
      setUsers([]);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      setTopics([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(query);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const flatData = useMemo((): ListItem[] => {
    const out: ListItem[] = [];
    if (posts.length > 0) {
      out.push({ type: 'section', key: 'section-posts', title: t('search.posts', 'Posts') });
      posts.forEach((p) => out.push({ type: 'post', key: p.id, ...p }));
    }
    if (users.length > 0) {
      out.push({ type: 'section', key: 'section-people', title: t('search.people', 'People') });
      users.forEach((u) => out.push({ type: 'user', key: u.id, ...u }));
    }
    if (topics.length > 0) {
      out.push({ type: 'section', key: 'section-topics', title: t('search.topics', 'Topics') });
      topics.forEach((tpc) => out.push({ type: 'topic', key: tpc.id || tpc.slug, ...tpc }));
    }
    return out;
  }, [posts, users, topics, t]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === 'section') {
        return <SectionHeader title={item.title} />;
      }
      if (item.type === 'post') {
        return <PostItem post={item} />;
      }
      if (item.type === 'user') {
        return (
          <UserCard
            item={item}
            onPress={() => {
              onClose();
              router.push(`/user/${item.handle}`);
            }}
          />
        );
      }
      if (item.type === 'topic') {
        const slug = item.slug ?? item.id ?? '';
        return (
          <TopicCard
            item={item}
            onPress={() => {
              onClose();
              router.push(`/topic/${encodeURIComponent(String(slug))}`);
            }}
          />
        );
      }
      return null;
    },
    [onClose, router],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={emptyStateCenterWrapStyle}>
          <Text style={styles.loadingText}>{t('common.loading', 'Loading...')}</Text>
        </View>
      );
    }
    return (
      <View style={emptyStateCenterWrapStyle}>
        <EmptyState
          icon="search"
          headline={
            query.trim()
              ? t('search.noResults', 'No results')
              : t('search.startTyping', 'Search posts, people, topics')
          }
          subtext={query.trim() ? t('search.noResultsHint', 'Try different keywords.') : undefined}
        />
      </View>
    );
  }, [loading, query, t]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <HeaderIconButton onPress={onClose} icon="close" accessibilityLabel={t('common.close', 'Close')} />
          <View style={[SEARCH_BAR.container, styles.searchWrap]}>
            <MaterialIcons name="search" size={HEADER.iconSize} color={COLORS.tertiary} />
            <TextInput
              ref={inputRef}
              style={[SEARCH_BAR.input, styles.input]}
              placeholder={t('home.search', 'Search')}
              placeholderTextColor={COLORS.tertiary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel={t('common.clear', 'Clear')}>
                <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
              </Pressable>
            ) : null}
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <FlatList
          data={flatData}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={flatData.length === 0 ? { flexGrow: 1 } : { paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...FLATLIST_DEFAULTS}
        />
      </KeyboardAvoidingView>
    </Modal>
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
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  searchWrap: {
    flex: 1,
    marginHorizontal: SPACING.m,
  },
  input: {},
  headerSpacer: {
    width: headerIconCircleSize + headerIconCircleMarginH * 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
});
