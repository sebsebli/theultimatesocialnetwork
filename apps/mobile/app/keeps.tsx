import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  Modal,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../utils/api";
import { PostItem } from "../components/PostItem";
import { ScreenHeader } from "../components/ScreenHeader";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { useToast } from "../context/ToastContext";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  FLATLIST_DEFAULTS,
  SEARCH_BAR,
} from "../constants/theme";
import { ListFooterLoader } from "../components/ListFooterLoader";
import { FeedSkeleton } from "../components/LoadingSkeleton";

export default function KeepsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showSuccess, showError } = useToast();
  const [keeps, setKeeps] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Picker state
  const [showPicker, setShowPicker] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unsorted" | "in-collections">(
    "all",
  );

  useEffect(() => {
    setPage(1);
    setKeeps([]);
    loadKeeps(1, true);
  }, [search, filter]);

  useEffect(() => {
    if (showPicker) {
      loadCollections();
    }
  }, [showPicker]);

  const loadKeeps = async (pageNum: number, reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
      setKeeps([]);
    } else {
      setLoadingMore(true);
    }
    try {
      const params = new URLSearchParams();
      params.append("page", pageNum.toString());
      params.append("limit", "20");
      if (search) params.append("search", search);
      if (filter === "in-collections") params.append("inCollection", "true");
      if (filter === "unsorted") params.append("inCollection", "false");

      const data = await api.get<{
        items?: unknown[];
        hasMore?: boolean;
      } | unknown[]>(`/keeps?${params.toString()}`);
      const items = Array.isArray(data)
        ? (data as Record<string, unknown>[])
        : Array.isArray((data as { items?: unknown[] }).items)
          ? ((data as { items: unknown[] }).items as Record<string, unknown>[])
          : [];

      if (reset) {
        setKeeps(items);
      } else {
        setKeeps((prev) => [...prev, ...items]);
      }

      const paginatedData = Array.isArray(data) ? null : (data as { hasMore?: boolean });
      const hasMoreData = items.length === 20 && paginatedData?.hasMore !== false;
      setHasMore(hasMoreData);
      setError(null);
    } catch (error) {
      if (__DEV__) console.error("Failed to load keeps", error);
      if (reset) {
        setError(t("keeps.loadError", "Failed to load keeps"));
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
      loadKeeps(nextPage, false);
    }
  }, [loading, refreshing, loadingMore, hasMore, page, search, filter]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadKeeps(1, true);
  }, [search, filter]);

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => {
      const post = item.post as Record<string, unknown> | undefined;
      const postId = post?.id as string | undefined;
      return (
        <View style={styles.keepContainer}>
          <PostItem
            post={{ ...post, isKept: true } as Record<string, unknown>}
            onKeep={() =>
              setKeeps((prev) =>
                prev.filter((k: Record<string, unknown>) => {
                  const kPost = k.post as Record<string, unknown> | undefined;
                  return kPost?.id !== postId;
                }),
              )
            }
          />
          <View style={styles.keepActions}>
            <Pressable
              style={styles.addButton}
              onPress={() => {
                if (postId) {
                  setSelectedPostId(postId);
                  setShowPicker(true);
                }
              }}
            accessibilityLabel={t("keeps.addToCollection")}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="playlist-add"
              size={HEADER.iconSize}
              color={COLORS.primary}
            />
            <Text style={styles.addButtonText}>
              {t("keeps.addToCollection")}
            </Text>
          </Pressable>
        </View>
      </View>
      );
    },
    [t],
  );

  const keyExtractor = useCallback((item: Record<string, unknown>) => item.id, []);

  const loadCollections = async () => {
    try {
      const data = await api.get("/collections");
      setCollections(Array.isArray(data) ? data : []);
    } catch (error) {
      if (__DEV__) console.error("Failed to load collections", error);
    }
  };

  const addToCollection = async (collectionId: string) => {
    if (!selectedPostId) return;
    try {
      await api.post(`/collections/${collectionId}/items`, {
        postId: selectedPostId,
      });
      setShowPicker(false);
      setSelectedPostId(null);
      showSuccess(t("keeps.addedToCollection"));
    } catch (error) {
      if (__DEV__) console.error("Failed to add to collection", error);
      showError(t("keeps.failedAddToCollection"));
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title={t("keeps.title")} paddingTop={insets.top} />

      <View style={styles.filters}>
        <View style={SEARCH_BAR.container}>
          <MaterialIcons
            name="search"
            size={HEADER.iconSize}
            color={COLORS.tertiary}
          />
          <TextInput
            style={SEARCH_BAR.input}
            placeholder={t("keeps.searchPlaceholder", "Search keeps...")}
            placeholderTextColor={COLORS.tertiary}
            value={search}
            onChangeText={setSearch}
            includeFontPadding={false}
            returnKeyType="search"
          />
          {search.length > 0 ? (
            <Pressable
              onPress={() => setSearch("")}
              hitSlop={12}
              accessibilityLabel={t("common.clearSearch", "Clear search")}
              accessibilityRole="button"
            >
              <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.filterPills}>
          <Pressable
            style={[
              styles.filterPill,
              filter === "all" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "all" && styles.filterPillTextActive,
              ]}
            >
              {t("keeps.all")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              filter === "unsorted" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("unsorted")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "unsorted" && styles.filterPillTextActive,
              ]}
            >
              {t("keeps.unsorted")}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.filterPill,
              filter === "in-collections" && styles.filterPillActive,
            ]}
            onPress={() => setFilter("in-collections")}
          >
            <Text
              style={[
                styles.filterPillText,
                filter === "in-collections" && styles.filterPillTextActive,
              ]}
            >
              {t("keeps.inCollections")}
            </Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={keeps.filter((item: Record<string, unknown>) => {
          const post = item.post as Record<string, unknown> | undefined;
          return !!post?.author;
        })}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={emptyStateCenterWrapStyle}>
            {loading ? (
              <FeedSkeleton count={4} />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => {
                  setError(null);
                  loadKeeps(1, true);
                }}
              />
            ) : (
              <EmptyState
                icon="bookmark-border"
                headline={t("keeps.empty")}
                subtext={t("keeps.emptyHint")}
                secondaryLabel={t("keeps.explorePosts")}
                onSecondary={() => router.push("/(tabs)/explore")}
              />
            )}
          </View>
        }
        contentContainerStyle={
          keeps.filter((item: Record<string, unknown>) => {
            const post = item.post as Record<string, unknown> | undefined;
            return !!post?.author;
          }).length === 0
            ? { flexGrow: 1 }
            : undefined
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPicker}
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("keeps.chooseCollection")}
              </Text>
              <Pressable onPress={() => setShowPicker(false)}>
                <Text style={styles.closeButton}>{t("common.cancel")}</Text>
              </Pressable>
            </View>
            <FlatList
              data={collections}
              keyExtractor={(item: Record<string, unknown>) => item.id}
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }: { item: Record<string, unknown> }) => (
                <Pressable
                  style={styles.collectionItem}
                  onPress={() => addToCollection(item.id as string)}
                  accessibilityLabel={`${t("keeps.addToCollection")} ${item.title}`}
                  accessibilityRole="button"
                >
                  <Text style={styles.collectionTitle}>{item.title}</Text>
                  <Text style={styles.addIcon}>+</Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyTextModal}>
                  {t("collections.empty", "No collections found.")}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  filters: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.m,
  },
  filterPills: {
    flexDirection: "row",
    gap: SPACING.s,
  },
  filterPill: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  filterPillTextActive: {
    color: COLORS.paper,
  },
  keepContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  keepActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    marginTop: -SPACING.s, // Pull up slightly to feel connected
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.badge,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  footerLoader: {
    paddingVertical: SPACING.l,
    alignItems: "center",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "center",
    padding: SPACING.l,
  },
  modalContent: {
    backgroundColor: COLORS.ink,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xl,
    maxHeight: "50%",
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.l,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  closeButton: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  collectionItem: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  collectionTitle: {
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  addIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  emptyTextModal: {
    color: COLORS.secondary,
    textAlign: "center",
    padding: SPACING.l,
    fontFamily: FONTS.regular,
  },
});
