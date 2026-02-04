import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SIZES, HEADER, createStyles, FLATLIST_DEFAULTS, SEARCH_BAR } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { api } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { ErrorState } from '../../../components/ErrorState';
import { useSocket } from '../../../context/SocketContext';
import { useTabPress } from '../../../context/TabPressContext';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { HeaderIconButton } from '../../../components/HeaderIconButton';
import { CenteredEmptyState } from '../../../components/EmptyState';

interface ThreadItem {
  id: string;
  participant?: { displayName?: string };
  participants?: { displayName?: string }[];
  lastMessage?: {
    body: string;
    createdAt: string;
    isRead: boolean;
  };
}

interface ChatSearchHit {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  otherUser: { id: string; handle: string; displayName: string };
}

export default function MessagesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const { on, off } = useSocket();
  const [threads, setThreads] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ChatSearchHit[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const tabPress = useTabPress();

  useEffect(() => {
    const count = tabPress?.tabPressCounts?.messages ?? 0;
    if (count === 0) return;
    setRefreshing(true);
    fetchThreads();
    const t = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [tabPress?.tabPressCounts?.messages]);

  const fetchThreads = async () => {
    try {
      const data = await api.get('/messages/threads');
      setThreads(Array.isArray(data) ? data : []);
      setError(false);
    } catch (error) {
      console.error(error);
      setError(true);
      showError(t('messages.loadError', 'Failed to load messages'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchThreads();
    }, [])
  );

  useEffect(() => {
    const handleNewMessage = (data: any) => {
      fetchThreads();
    };

    on('message', handleNewMessage);
    return () => {
      off('message', handleNewMessage);
    };
  }, [on, off]);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const data = await api.get<ChatSearchHit[]>(`/messages/search?q=${encodeURIComponent(q)}&limit=30`);
        setSearchResults(Array.isArray(data) ? data : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchThreads();
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 1000 * 60 * 60 * 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  const renderThreadItem = ({ item }: { item: ThreadItem }) => {
    const participant = item.participant || item.participants?.[0];
    if (!participant) return null;
    const q = search.trim();
    if (q.length >= 2) return null;
    if (q.length === 1) {
      const nameMatch = participant.displayName?.toLowerCase().includes(q.toLowerCase());
      const msgMatch = item.lastMessage?.body?.toLowerCase().includes(q.toLowerCase());
      if (!nameMatch && !msgMatch) return null;
    }

    return (
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [styles.threadItem, pressed && styles.threadItemPressed]}
        onPress={() => router.push(`/(tabs)/messages/${item.id}`)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{participant.displayName?.charAt(0) || '?'}</Text>
        </View>
        <View style={styles.threadContent}>
          <View style={styles.threadHeader}>
            <Text style={styles.displayName}>{participant.displayName || t('common.unknown', 'Unknown')}</Text>
            {item.lastMessage && (
              <Text style={styles.timestamp}>{formatTime(item.lastMessage.createdAt)}</Text>
            )}
          </View>
          {item.lastMessage ? (
            <Text style={[styles.lastMessage, !item.lastMessage.isRead && styles.unreadMessage]} numberOfLines={1}>
              {item.lastMessage.body}
            </Text>
          ) : (
            <Text style={styles.lastMessage}>{t('messages.noMessages', 'No messages yet')}</Text>
          )}
        </View>
        {item.lastMessage && !item.lastMessage.isRead && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  const renderSearchHit = ({ item }: { item: ChatSearchHit }) => (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.threadItem, pressed && styles.threadItemPressed]}
      onPress={() => router.push(`/(tabs)/messages/${item.threadId}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.otherUser.displayName?.charAt(0) || '?'}</Text>
      </View>
      <View style={styles.threadContent}>
        <View style={styles.threadHeader}>
          <Text style={styles.displayName}>{item.otherUser.displayName || item.otherUser.handle}</Text>
          <Text style={styles.timestamp}>{formatTime(item.createdAt)}</Text>
        </View>
        <Text style={styles.lastMessage} numberOfLines={2}>{item.body}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        showBack={false}
        title={t('inbox.messages')}
        paddingTop={insets.top}
        right={
          <HeaderIconButton onPress={() => router.push('/(tabs)/messages/new')} icon="add" accessibilityLabel={t('messages.new', 'New message')} />
        }
      />

      <View style={styles.searchContainer}>
        <View style={SEARCH_BAR.container}>
          <MaterialIcons name="search" size={HEADER.iconSize} color={COLORS.tertiary} />
          <TextInput
            style={[SEARCH_BAR.input, styles.searchInput]}
            placeholder={t('messages.searchPlaceholder', 'Search chats')}
            placeholderTextColor={COLORS.tertiary}
            value={search}
            onChangeText={setSearch}
            includeFontPadding={false}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && threads.length === 0 ? (
        <ErrorState onRetry={fetchThreads} onDismiss={() => setError(false)} />
      ) : search.trim().length >= 2 ? (
        searchLoading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            showsVerticalScrollIndicator={false}
            renderItem={renderSearchHit}
            keyExtractor={(item: ChatSearchHit) => item.id}
            contentContainerStyle={[styles.listContent, searchResults.length === 0 && { flexGrow: 1 }]}
            ListEmptyComponent={<CenteredEmptyState icon="search-off" headline={t('search.noResults', 'No results')} compact />}
            {...FLATLIST_DEFAULTS}
          />
        )
      ) : (
        <FlatList
          ref={flatListRef}
          data={threads}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={renderThreadItem}
          keyExtractor={(item: ThreadItem) => item.id}
          contentContainerStyle={[styles.listContent, threads.length === 0 && { flexGrow: 1 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={<CenteredEmptyState icon="chat-bubble-outline" headline={t('inbox.noMessages')} compact />}
          {...FLATLIST_DEFAULTS}
        />
      )}
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  searchContainer: {
    padding: SPACING.m,
    backgroundColor: COLORS.ink,
  },
  searchInput: {
    padding: 0,
  },
  listContent: {
    paddingBottom: 100,
  },
  threadItem: {
    flexDirection: 'row',
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    alignItems: 'center',
  },
  threadItemPressed: {
    backgroundColor: COLORS.hover,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  threadContent: {
    flex: 1,
    justifyContent: 'center',
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  lastMessage: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  unreadMessage: {
    color: COLORS.paper,
    fontWeight: '600',
    fontFamily: FONTS.semiBold,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.s,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
