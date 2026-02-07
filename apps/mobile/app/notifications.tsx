import { Text, View, FlatList, Pressable, RefreshControl } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../utils/api";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../constants/theme";
import { ListFooterLoader } from "../components/ListFooterLoader";
import { useSocket } from "../context/SocketContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../components/ScreenHeader";
import { HeaderIconButton } from "../components/HeaderIconButton";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { MessageListSkeleton } from "../components/LoadingSkeleton";

/** Notifications-only screen (bell). Messages are in the Messages tab. */
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { on, off, clearUnreadNotifications } = useSocket();
  const [notifications, setNotifications] = useState<Record<string, unknown>[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  interface GroupedNotification {
    key: string;
    type: string;
    actors: { handle?: string; displayName?: string }[];
    post?: { id?: string; title?: string };
    postId?: string;
    replyId?: string;
    readAt?: string | null;
    latestCreatedAt?: string;
    count: number;
    originalItems: Record<string, unknown>[];
  }

  const groupedNotifications = useMemo((): GroupedNotification[] => {
    const groups: Map<string, GroupedNotification> = new Map();
    const result: GroupedNotification[] = [];

    for (const notif of notifications) {
      const type = notif.type as string;
      const post = notif.post as { id?: string; title?: string } | undefined;
      const postId = (post?.id ?? notif.postId ?? "") as string;
      const actor = notif.actor as
        | { handle?: string; displayName?: string }
        | undefined;

      // Only group LIKE and FOLLOW notifications (these are the ones that commonly batch)
      const groupable = type === "LIKE" || type === "FOLLOW";
      const groupKey = groupable
        ? `${type}:${postId}`
        : `single:${notif.id as string}`;

      const existing = groups.get(groupKey);
      if (existing && groupable) {
        if (actor && !existing.actors.some((a) => a.handle === actor.handle)) {
          existing.actors.push(actor);
        }
        existing.count++;
        existing.originalItems.push(notif);
        if (!existing.readAt && !notif.readAt) existing.readAt = null;
      } else {
        const group: GroupedNotification = {
          key: groupKey + ":" + (notif.id as string),
          type,
          actors: actor ? [actor] : [],
          post,
          postId: postId || undefined,
          replyId: notif.replyId as string | undefined,
          readAt: notif.readAt as string | null | undefined,
          latestCreatedAt: notif.createdAt as string | undefined,
          count: 1,
          originalItems: [notif],
        };
        groups.set(groupKey, group);
        result.push(group);
      }
    }

    return result;
  }, [notifications]);

  useEffect(() => {
    const handleNotification = () => loadContent(1, true);
    on("notification", handleNotification);
    return () => off("notification", handleNotification);
  }, [on, off]);

  useEffect(() => {
    if (notifications.length === 0) loadContent(1, true);
  }, []);

  // Clear notification badge (red dot) immediately when user opens this screen
  useEffect(() => {
    clearUnreadNotifications();
  }, [clearUnreadNotifications]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const data = await api.get<
        | {
            items?: unknown[];
            hasMore?: boolean;
          }
        | unknown[]
      >(`/notifications?page=${pageNum}&limit=20`);
      const items = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray((data as { items?: unknown[] }).items)
          ? ((data as { items: unknown[] }).items as Record<string, unknown>[])
          : [];
      if (reset) {
        setNotifications(items);
      } else {
        setNotifications((prev) => [...prev, ...items]);
      }
      const paginatedData = Array.isArray(data)
        ? null
        : (data as { hasMore?: boolean });
      setHasMore(items.length === 20 && paginatedData?.hasMore !== false);
      setError(null);
    } catch (error) {
      if (__DEV__) console.error("Failed to load notifications", error);
      if (reset) {
        setError(t("notifications.loadError", "Failed to load notifications"));
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
  }, [loading, refreshing, loadingMore, hasMore, page]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, []);

  const renderNotification = useCallback(
    ({ item }: { item: GroupedNotification }) => {
      const actorNames = item.actors
        .map((a) => a.displayName || a.handle || "")
        .filter(Boolean);
      let displayText = "";

      if (actorNames.length === 0) {
        displayText = t("inbox.interactedWithYou");
      } else if (actorNames.length === 1) {
        displayText = actorNames[0];
      } else if (actorNames.length === 2) {
        displayText = `${actorNames[0]} ${t("common.and", "and")} ${actorNames[1]}`;
      } else {
        displayText = `${actorNames[0]}, ${actorNames[1]}, ${t("notifications.andOthers", "and {{count}} others", { count: item.count - 2 })}`;
      }

      const actionText =
        item.type === "FOLLOW"
          ? t("inbox.startedFollowing")
          : item.type === "REPLY"
            ? t("inbox.repliedToPost")
            : item.type === "QUOTE"
              ? t("inbox.quotedPost")
              : item.type === "LIKE"
                ? t("inbox.likedPost")
                : item.type === "MENTION"
                  ? t("inbox.mentionedYou")
                  : t("inbox.interactedWithYou");

      return (
        <Pressable
          style={styles.notification}
          onPress={() => {
            if (item.type === "FOLLOW" && item.actors[0]?.handle) {
              router.push(`/user/${item.actors[0].handle}`);
            } else if (
              item.type === "MENTION" &&
              item.replyId &&
              (item.post?.id || item.postId)
            ) {
              const pId = item.post?.id ?? item.postId;
              router.push({
                pathname: `/post/${pId}/comments`,
                params: { replyId: item.replyId },
              });
            } else if (item.post?.id || item.postId) {
              router.push(`/post/${item.post?.id ?? item.postId}/reading`);
            }
          }}
          accessibilityLabel={`${displayText} ${actionText}`}
          accessibilityRole="button"
        >
          <View style={styles.notificationContent}>
            <Text style={styles.notificationText}>
              {displayText} {actionText}
            </Text>
            {!item.readAt && (
              <View
                style={styles.unreadDot}
                accessibilityLabel={t("inbox.unread", "Unread")}
              />
            )}
          </View>
        </Pressable>
      );
    },
    [t, router],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={t("notifications.title", "Notifications")}
        paddingTop={insets.top}
        right={
          notifications.length > 0 ? (
            <HeaderIconButton
              onPress={async () => {
                try {
                  await api.post("/notifications/read-all");
                  loadContent(1, true);
                } catch (error) {
                  if (__DEV__) console.error("Failed to mark all read", error);
                }
              }}
              icon="done-all"
              accessibilityLabel={t(
                "notifications.markAllRead",
                "Mark all read",
              )}
            />
          ) : undefined
        }
      />

      <FlatList
        data={groupedNotifications}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: GroupedNotification) => item.key}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View style={emptyStateCenterWrapStyle}>
            {loading ? (
              <MessageListSkeleton count={5} />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => {
                  setError(null);
                  loadContent(1, true);
                }}
              />
            ) : (
              <EmptyState
                icon="notifications-none"
                headline={t("notifications.empty", "No notifications yet")}
                subtext={t(
                  "notifications.emptySubtext",
                  "When someone follows you, replies, or mentions you, it will show up here.",
                )}
              />
            )}
          </View>
        }
        contentContainerStyle={
          notifications.length === 0 ? { flexGrow: 1 } : undefined
        }
        ListFooterComponent={
          <ListFooterLoader visible={!!(hasMore && loadingMore)} />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
  notification: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: "center",
  },
});
