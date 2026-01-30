import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, Image, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, FONTS, SIZES, HEADER } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { api } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { ErrorState } from '../../../components/ErrorState';
import { useSocket } from '../../../context/SocketContext';
import { ScreenHeader } from '../../../components/ScreenHeader';

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

  const renderItem = ({ item }: { item: ThreadItem }) => {
    const participant = item.participant || item.participants?.[0]; 
    if (!participant) return null;

    if (search) {
      const nameMatch = participant.displayName?.toLowerCase().includes(search.toLowerCase());
      const msgMatch = item.lastMessage?.body.toLowerCase().includes(search.toLowerCase());
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

  return (
    <View style={styles.container}>
      <ScreenHeader
        showBack={false}
        title={t('inbox.messages')}
        paddingTop={insets.top}
        right={
          <Pressable style={styles.headerAction} onPress={() => router.push('/(tabs)/messages/new')} accessibilityLabel={t('messages.new', 'New message')} accessibilityRole="button">
            <MaterialIcons name="edit" size={HEADER.iconSize} color={HEADER.iconColor} />
          </Pressable>
        }
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('messages.searchPlaceholder', 'Search chats')}
          placeholderTextColor={COLORS.tertiary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error && threads.length === 0 ? (
        <ErrorState onRetry={fetchThreads} />
      ) : (
        <FlatList
          data={threads}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          renderItem={renderItem}
          keyExtractor={(item: ThreadItem) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} />
              <Text style={styles.emptyText}>{t('inbox.noMessages')}</Text>
            </View>
          }
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
  headerAction: {
    padding: SPACING.s,
  },
  searchContainer: {
    padding: SPACING.m,
    backgroundColor: COLORS.ink,
  },
  searchInput: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    color: COLORS.paper,
    fontSize: 16,
    fontFamily: FONTS.regular,
    letterSpacing: 0,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
});
