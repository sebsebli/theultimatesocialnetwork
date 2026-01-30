import { StyleSheet, Text, View, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';
import { useSocket } from '../context/SocketContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';

/** Notifications-only screen (bell). Messages are in the Messages tab. */
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { on, off } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const handleNotification = () => loadContent(1, true);
    on('notification', handleNotification);
    return () => off('notification', handleNotification);
  }, [on, off]);

  useEffect(() => {
    if (notifications.length === 0) loadContent(1, true);
  }, []);

  const loadContent = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get(`/notifications?page=${pageNum}&limit=20`);
      const items = Array.isArray(data.items || data) ? (data.items || data) : [];
      if (reset) {
        setNotifications(items);
      } else {
        setNotifications(prev => [...prev, ...items]);
      }
      setHasMore(items.length === 20 && (data.hasMore !== false));
    } catch (error) {
      console.error('Failed to load notifications', error);
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
  }, [loading, refreshing, loadingMore, hasMore, page]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, []);

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
        {!item.readAt && <View style={styles.unreadDot} accessibilityLabel={t('inbox.unread', 'Unread')} />}
      </View>
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
      <ScreenHeader
        title={t('notifications.title', 'Notifications')}
        paddingTop={insets.top}
        right={
          notifications.length > 0 ? (
            <Pressable
              onPress={async () => {
                try {
                  await api.post('/notifications/read-all');
                  loadContent(1, true);
                } catch (error) {
                  console.error('Failed to mark all read', error);
                }
              }}
              style={styles.headerAction}
              accessibilityLabel={t('notifications.markAllRead', 'Mark all read')}
              accessibilityRole="button"
            >
              <Text style={styles.markAllRead}>{t('notifications.markAllRead', 'Mark all read')}</Text>
            </Pressable>
          ) : undefined
        }
      />

      <FlatList
        data={notifications}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: any) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {loading ? t('common.loading') : t('notifications.empty', 'No notifications yet')}
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
    margin: -SPACING.s,
  },
  markAllRead: {
    fontSize: 16,
    fontWeight: '600',
    color: HEADER.saveColor,
    fontFamily: FONTS.semiBold,
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
