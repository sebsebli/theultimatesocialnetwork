import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../../utils/api';
import { COLORS, SPACING, SIZES, FONTS } from '../../constants/theme';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function InboxScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');
  
  // Separate data stores for instant switching
  const [notifications, setNotifications] = useState<any[]>([]);
  const [threads, setThreads] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    // Only clear if transitioning to a tab with NO data
    if (activeTab === 'notifications' && notifications.length === 0) {
        loadContent(1, true);
    } else if (activeTab === 'messages' && threads.length === 0) {
        loadContent(1, true);
    }
  }, [activeTab]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      if (activeTab === 'notifications') {
        const data = await api.get(`/notifications?page=${pageNum}&limit=20`);
        const items = Array.isArray(data.items || data) ? (data.items || data) : [];
        if (reset) {
          setNotifications(items);
        } else {
          setNotifications(prev => [...prev, ...items]);
        }
        setHasMore(items.length === 20 && (data.hasMore !== false));
      } else {
        const data = await api.get(`/messages/threads?page=${pageNum}&limit=20`);
        const items = Array.isArray(data.items || data) ? (data.items || data) : [];
        if (reset) {
          setThreads(items);
        } else {
          setThreads(prev => [...prev, ...items]);
        }
        setHasMore(items.length === 20 && (data.hasMore !== false));
      }
    } catch (error) {
      console.error('Failed to load content', error);
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
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, [activeTab]);

  const renderNotification = useCallback(({ item }: { item: any }) => (
    <Pressable
      style={styles.notification}
      onPress={() => {
        if (item.type === 'FOLLOW' && item.actor?.handle) {
          router.push(`/user/${item.actor.handle}`);
        } else if (item.post?.id) {
          router.push(`/post/${item.post.id}`);
        }
      }}
      accessibilityRole="button"
    >
      <View style={styles.notificationContent}>
        <Text style={styles.notificationText}>
          {item.actor?.displayName} {item.type === 'FOLLOW' ? t('inbox.startedFollowing') :
            item.type === 'REPLY' ? t('inbox.repliedToPost') :
              item.type === 'QUOTE' ? t('inbox.quotedPost') :
                item.type === 'LIKE' ? t('inbox.likedPost') :
                  item.type === 'MENTION' ? t('inbox.mentionedYou') : t('inbox.interactedWithYou')}
        </Text>
        {!item.readAt && <View style={styles.unreadDot} accessibilityLabel="Unread" />}
      </View>
    </Pressable>
  ), [t, router]);

  const renderThread = useCallback(({ item }: { item: any }) => (
    <Pressable
      style={styles.thread}
      onPress={() => router.push(`/messages/${item.id}`)}
      accessibilityRole="button"
    >
      <View style={styles.threadContent}>
        <Text style={styles.threadName}>
          {item.otherUser?.displayName || item.otherUser?.handle}
        </Text>
        <Text style={styles.threadLastMessage} numberOfLines={1}>
          {item.lastMessage?.body || t('messages.noMessages')}
        </Text>
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge} accessibilityLabel={`${item.unreadCount} unread messages`}>
          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  ), [t, router]);

  const ListFooterComponent = useMemo(() => {
    if (!hasMore || !loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }, [hasMore, loadingMore]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>{t('inbox.title')}</Text>
        {activeTab === 'notifications' && notifications.length > 0 && (
          <Pressable
            onPress={async () => {
              try {
                await api.post('/notifications/read-all');
                loadContent(1, true);
              } catch (error) {
                console.error('Failed to mark all read', error);
              }
            }}
            accessibilityLabel={t('inbox.markAllRead')}
            accessibilityRole="button"
          >
            <Text style={styles.markAllRead}>{t('inbox.markAllRead')}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.tabs}>
        <Pressable
          onPress={() => setActiveTab('notifications')}
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]}
          accessibilityLabel={t('inbox.notifications')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'notifications' }}
        >
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>
            {t('inbox.notifications')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('messages')}
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          accessibilityLabel={t('inbox.messages')}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'messages' }}
        >
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            {t('inbox.messages')}
          </Text>
        </Pressable>
      </View>

      {activeTab === 'notifications' ? (
        <FlatList
          data={notifications}
          keyExtractor={(item: any) => item.id}
          renderItem={renderNotification}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('inbox.noNotifications')}
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
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item: any) => item.id}
          renderItem={renderThread}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {loading ? t('common.loading') : t('inbox.noMessages')}
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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    paddingTop: 0, // Handled dynamically
    paddingBottom: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  markAllRead: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primary,
    fontFamily: FONTS.medium,
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
  notification: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationText: {
    fontSize: 15,
    color: COLORS.paper,
    flex: 1,
    fontFamily: FONTS.regular,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.s,
  },
  thread: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadContent: {
    flex: 1,
  },
  threadName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: 4,
    fontFamily: FONTS.semiBold,
  },
  threadLastMessage: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  unreadBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.s,
  },
  unreadBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: FONTS.semiBold,
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
