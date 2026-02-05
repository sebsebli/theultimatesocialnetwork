import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Text,
  View,
  Pressable,
  Share,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import {
  api,
  getWebAppBaseUrl,
  getCollectionPreviewImageUri,
} from "../../utils/api";
import { useAuth } from "../../context/auth";
import { useToast } from "../../context/ToastContext";
import { OptionsActionSheet } from "../../components/OptionsActionSheet";
import { ConfirmModal } from "../../components/ConfirmModal";
import { PostItem } from "../../components/PostItem";
import { UserCard } from "../../components/UserCard";
import { TopicCollectionHeader } from "../../components/TopicCollectionHeader";
import { TopicOrCollectionLayout } from "../../components/TopicOrCollectionLayout";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import { FeedSkeleton } from "../../components/LoadingSkeleton";
import { CollectionCard } from "../../components/CollectionCard";
import { Collection, CollectionItem } from "../../types";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  SEARCH_BAR,
  TABS,
  LIST_SCROLL_DEFAULTS,
} from "../../constants/theme";

const ITEMS_PAGE_SIZE = 20;
const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const STICKY_FADE_RANGE = 80;

export default function CollectionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useTranslation();
  const { userId } = useAuth();
  const { showToast, showSuccess, showError } = useToast();
  const [collection, setCollection] = useState<Collection | null>(null);
  const isOwner =
    !!collection?.ownerId && !!userId && collection.ownerId === userId;
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  type TabKey = "newest" | "ranked" | "sources" | "contributors";
  const [activeTab, setActiveTab] = useState<TabKey>("newest");
  const [items, setItems] = useState<
    (
      | CollectionItem
      | { id: string; url: string; title: string | null }
      | {
          id: string;
          handle: string;
          displayName: string;
          postCount: number;
          totalQuotes: number;
        }
    )[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [moreCollections, setMoreCollections] = useState<
    {
      id: string;
      title: string;
      description?: string;
      itemCount?: number;
      previewImageKey?: string | null;
    }[]
  >([]);
  const [shareSaves, setShareSaves] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [editShareSaves, setEditShareSaves] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const heroOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, HERO_FADE_HEIGHT],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollY],
  );
  const stickyOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [
          STICKY_HEADER_APPEAR,
          STICKY_HEADER_APPEAR + STICKY_FADE_RANGE,
        ],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [scrollY],
  );

  const collectionId = typeof id === "string" ? id : (id?.[0] ?? "");
  const handleShare = async () => {
    if (!collectionId) return;
    Haptics.selectionAsync();
    const url = `${getWebAppBaseUrl()}/collections/${collectionId}`;
    try {
      await Share.share({
        message: `Check out this collection: ${url}`,
        url, // iOS
      });
    } catch (error) {
      // console.error(error);
    }
  };

  const handleDeleteCollection = async () => {
    try {
      await api.delete(`/collections/${collectionId}`);
      showSuccess(t("collections.deleted", "Collection deleted"));
      setDeleteConfirmVisible(false);
      setMoreOptionsVisible(false);
      router.back();
    } catch (error) {
      showError(t("collections.deleteFailed", "Failed to delete collection"));
      throw error;
    }
  };

  const handleShareSavesToggle = async () => {
    try {
      await api.patch(`/collections/${collectionId}`, {
        shareSaves: !shareSaves,
      });
      setShareSaves(!shareSaves);
    } catch (error) {
      showError(t("collections.updateFailed", "Failed to update collection"));
    }
  };

  const openEditModal = useCallback(() => {
    setMoreOptionsVisible(false);
    if (!collection) return;
    setEditTitle(collection.title);
    setEditDescription(collection.description ?? "");
    setEditIsPublic(collection.isPublic !== false);
    setEditShareSaves(!!(collection as any).shareSaves);
    setEditModalVisible(true);
  }, [collection]);

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.patch(`/collections/${collectionId}`, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        isPublic: editIsPublic,
        shareSaves: editShareSaves,
      });
      setCollection((prev) =>
        prev
          ? {
              ...prev,
              ...updated,
              title: updated.title ?? prev.title,
              description: updated.description ?? prev.description,
              isPublic: updated.isPublic ?? prev.isPublic,
            }
          : null,
      );
      setShareSaves(!!(updated as any).shareSaves);
      setEditModalVisible(false);
      showSuccess(t("common.saved", "Saved"));
    } catch (error) {
      showError(t("collections.updateFailed", "Failed to update collection"));
    }
  };

  const loadTabData = useCallback(
    async (tab: TabKey, pageOrOffset: number, reset: boolean) => {
      if (reset) {
        setLoading(true);
        setItems([]);
        setNextOffset(0);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
      try {
        if (reset) {
          const collectionData = await api.get(
            `/collections/${collectionId}?limit=${ITEMS_PAGE_SIZE}&offset=0`,
          );
          setCollection(collectionData);
          setShareSaves(!!(collectionData as any).shareSaves);
          if (tab === "newest") {
            const itemsList = Array.isArray(collectionData?.items)
              ? collectionData.items
              : [];
            setItems(itemsList);
            setHasMore(collectionData?.hasMore === true);
            setNextOffset(itemsList.length);
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
            return;
          }
        }
        if (tab === "newest" && !reset) {
          const itemsData = await api.get(
            `/collections/${collectionId}/items?limit=${ITEMS_PAGE_SIZE}&offset=${pageOrOffset}&sort=recent`,
          );
          const itemsList = Array.isArray(itemsData?.items)
            ? itemsData.items
            : [];
          setItems((prev) => [...prev, ...itemsList]);
          setHasMore(itemsData?.hasMore === true);
          setNextOffset(pageOrOffset + itemsList.length);
        } else if (tab === "ranked") {
          const itemsData = await api.get(
            `/collections/${collectionId}/items?limit=${ITEMS_PAGE_SIZE}&offset=${reset ? 0 : pageOrOffset}&sort=ranked`,
          );
          const itemsList = Array.isArray(itemsData?.items)
            ? itemsData.items
            : [];
          if (reset) setItems(itemsList);
          else setItems((prev) => [...prev, ...itemsList]);
          setHasMore(itemsData?.hasMore === true);
          setNextOffset((reset ? 0 : pageOrOffset) + itemsList.length);
        } else if (tab === "sources") {
          const res = (await api.get(
            `/collections/${collectionId}/sources?page=${pageOrOffset}&limit=${ITEMS_PAGE_SIZE}`,
          )) as { items?: any[]; hasMore?: boolean };
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length === ITEMS_PAGE_SIZE && res?.hasMore !== false);
          setPage(pageOrOffset + 1);
        } else if (tab === "contributors") {
          const res = (await api.get(
            `/collections/${collectionId}/contributors?page=${pageOrOffset}&limit=${ITEMS_PAGE_SIZE}`,
          )) as { items?: any[]; hasMore?: boolean };
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length === ITEMS_PAGE_SIZE && res?.hasMore !== false);
          setPage(pageOrOffset + 1);
        }
      } catch (error) {
        if (reset) setCollection(null);
        setHasMore(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [collectionId],
  );

  useEffect(() => {
    if (collectionId) {
      setItems([]);
      setPage(1);
      setNextOffset(0);
      loadTabData(
        activeTab,
        activeTab === "sources" || activeTab === "contributors" ? 1 : 0,
        true,
      );
    }
  }, [collectionId, activeTab]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    if (activeTab === "sources" || activeTab === "contributors") {
      loadTabData(activeTab, page, false);
    } else {
      loadTabData(activeTab, nextOffset, false);
    }
  }, [
    loading,
    refreshing,
    loadingMore,
    hasMore,
    activeTab,
    page,
    nextOffset,
    loadTabData,
  ]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTabData(
      activeTab,
      activeTab === "sources" || activeTab === "contributors" ? 1 : 0,
      true,
    );
  }, [collectionId, activeTab, loadTabData]);

  useEffect(() => {
    if (!userId) return;
    api
      .get("/collections")
      .then((list: any[]) => {
        const arr = Array.isArray(list) ? list : [];
        setMoreCollections(
          arr.filter((c: any) => c.id !== collectionId).slice(0, 8),
        );
      })
      .catch(() => {});
  }, [userId, collectionId]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (activeTab === "contributors") {
        return (
          <UserCard
            item={{
              id: item.id,
              handle: item.handle,
              displayName: item.displayName,
              bio: undefined,
              avatarKey: undefined,
              avatarUrl: undefined,
              isFollowing: undefined,
            }}
            onPress={() => router.push(`/user/${item.handle}`)}
          />
        );
      }
      if (activeTab === "sources") {
        return (
          <Pressable
            style={styles.sourceItem}
            onPress={async () => {
              if (item.url) await WebBrowser.openBrowserAsync(item.url);
            }}
          >
            <View style={styles.sourceIcon}>
              <Text style={styles.sourceIconText}>
                {(item.title || "?").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.sourceContent}>
              <Text style={styles.sourceDomain}>
                {item.url ? new URL(item.url).hostname : "External"}
              </Text>
              <Text style={styles.sourceText} numberOfLines={1}>
                {item.title || item.url}
              </Text>
            </View>
            <MaterialIcons
              name="open-in-new"
              size={HEADER.iconSize}
              color={COLORS.tertiary}
            />
          </Pressable>
        );
      }
      const colItem = item as CollectionItem;
      if (!colItem?.post) return null;
      return (
        <View style={styles.itemContainer}>
          <PostItem post={colItem.post} />
          {colItem.curatorNote && (
            <View style={styles.noteContainer}>
              <Text style={styles.noteLabel}>
                {t("collections.curatorNote", "CURATOR NOTE")}
              </Text>
              <Text style={styles.noteText}>{colItem.curatorNote}</Text>
            </View>
          )}
        </View>
      );
    },
    [t, activeTab, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const handleAddCitationStable = useCallback(() => {
    showToast(
      t(
        "collections.addCitationHint",
        "To add items, browse posts and tap 'Keep' or 'Add to Collection'.",
      ),
    );
  }, [showToast, t]);

  const ListEmptyComponent = useMemo(() => {
    if (loading)
      return (
        <View style={emptyStateCenterWrapStyle}>
          <FeedSkeleton count={4} />
        </View>
      );
    if (activeTab === "sources") {
      return (
        <View style={emptyStateCenterWrapStyle}>
          <EmptyState
            icon="link"
            headline={t("topic.emptySources")}
            subtext={t("topic.emptySourcesSubtext")}
          />
        </View>
      );
    }
    if (activeTab === "contributors") {
      return (
        <View style={emptyStateCenterWrapStyle}>
          <EmptyState
            icon="people-outline"
            headline={t("topic.emptyPeople")}
            subtext={t("topic.emptyPeopleSubtext")}
          />
        </View>
      );
    }
    return (
      <View style={emptyStateCenterWrapStyle}>
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="folder-open"
            headline={t(
              "collections.emptyDetail",
              "No items in this collection",
            )}
            subtext={t(
              "collections.emptyDetailHint",
              "Add posts from the reading screen.",
            )}
          >
            {moreCollections.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsHeader}>
                  {t("collections.moreCollections", "More collections")}
                </Text>
                {moreCollections.map((c: any) => (
                  <View key={c.id} style={styles.suggestionItem}>
                    <CollectionCard
                      item={{
                        id: c.id,
                        title: c.title,
                        description: c.description ?? null,
                        itemCount: c.itemCount ?? 0,
                        previewImageKey: c.previewImageKey ?? null,
                      }}
                      onPress={() => router.push(`/collections/${c.id}`)}
                    />
                  </View>
                ))}
              </View>
            )}
          </EmptyState>
          <Pressable
            style={styles.addCitationButton}
            onPress={handleAddCitationStable}
            accessibilityLabel={t("collections.addCitation")}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="add"
              size={HEADER.iconSize}
              color={COLORS.primary}
            />
            <Text style={styles.addCitationText}>
              {t("collections.addCitation")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }, [t, handleAddCitationStable, activeTab, loading, moreCollections, router]);

  const listDataRaw =
    activeTab === "newest" || activeTab === "ranked"
      ? items.filter((item: any) => item?.post?.author)
      : items;

  const listData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listDataRaw;
    if (activeTab === "sources") {
      return listDataRaw.filter(
        (item: any) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.url && item.url.toLowerCase().includes(q)),
      );
    }
    if (activeTab === "contributors") {
      return listDataRaw.filter(
        (item: any) =>
          (item.displayName && item.displayName.toLowerCase().includes(q)) ||
          (item.handle && item.handle.toLowerCase().includes(q)),
      );
    }
    return listDataRaw.filter((item: any) => {
      const post = item?.post;
      if (!post) return false;
      const title = (post.title || "").toLowerCase();
      const body = (post.body || "").toLowerCase();
      return title.includes(q) || body.includes(q);
    });
  }, [listDataRaw, searchQuery, activeTab]);

  const headerComponent = useMemo(() => {
    if (!collection) return null;
    return (
      <>
        <TopicCollectionHeader
          type="collection"
          title={collection.title}
          description={collection.description}
          headerImageUri={getCollectionPreviewImageUri(collection as any)}
          onBack={() => router.back()}
          onAction={handleShare}
          actionLabel={t("common.share")}
          rightAction={isOwner ? "more" : undefined}
          onRightAction={
            isOwner ? () => setMoreOptionsVisible(true) : undefined
          }
          metrics={{
            itemCount: (collection as any).itemCount,
            contributorCount: (collection as any).contributorCount,
          }}
        >
          <View style={styles.searchRow}>
            <View style={SEARCH_BAR.container}>
              <MaterialIcons
                name="search"
                size={HEADER.iconSize}
                color={COLORS.tertiary}
              />
              <TextInput
                style={SEARCH_BAR.input}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t(
                  "collections.searchInCollection",
                  "Search in collection",
                )}
                placeholderTextColor={COLORS.tertiary}
                returnKeyType="search"
              />
              {searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={COLORS.tertiary}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
          <View style={[styles.tabsContainer, TABS.container]}>
            <ScrollView
              horizontal
              {...LIST_SCROLL_DEFAULTS}
              contentContainerStyle={[styles.tabsContent, TABS.content]}
              style={[styles.tabsScrollView, TABS.scrollView]}
            >
              {(["newest", "ranked", "sources", "contributors"] as const).map(
                (tab) => (
                  <Pressable
                    key={tab}
                    style={[
                      styles.tab,
                      TABS.tab,
                      activeTab === tab && TABS.tabActive,
                    ]}
                    onPress={() => setActiveTab(tab)}
                    accessibilityLabel={t(`collections.tab.${tab}`)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: activeTab === tab }}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        TABS.tabText,
                        activeTab === tab && TABS.tabTextActive,
                      ]}
                    >
                      {tab === "newest"
                        ? t("topic.latest", "Latest")
                        : tab === "ranked"
                          ? t("topic.relevance", "Most cited")
                          : tab === "sources"
                            ? t("topic.sources", "Sources")
                            : t("topic.people", "Contributors")}
                    </Text>
                  </Pressable>
                ),
              )}
            </ScrollView>
          </View>
        </TopicCollectionHeader>
      </>
    );
  }, [collection, isOwner, searchQuery, t]);

  return (
    <>
      <TopicOrCollectionLayout
        title={collection?.title ?? t("collections.title", "Collection")}
        loading={loading}
        notFound={!loading && !collection}
        notFoundMessage={t("collections.notFound", "Collection not found")}
        onBack={() => router.back()}
        headerComponent={headerComponent}
        heroOpacity={heroOpacity}
        stickyOpacity={stickyOpacity}
        onScroll={() => {}}
        scrollY={scrollY}
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={ListEmptyComponent}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        children={
          <>
            {isOwner && (
              <OptionsActionSheet
                visible={moreOptionsVisible}
                title={t("collections.options", "Collection Options")}
                options={[
                  {
                    label: t("collections.edit", "Edit"),
                    onPress: openEditModal,
                    icon: "edit",
                  },
                  {
                    label: t("collections.delete", "Delete Collection"),
                    onPress: () => {
                      setMoreOptionsVisible(false);
                      setDeleteConfirmVisible(true);
                    },
                    destructive: true,
                  },
                ]}
                cancelLabel={t("common.cancel")}
                onCancel={() => setMoreOptionsVisible(false)}
              />
            )}
            <ConfirmModal
              visible={deleteConfirmVisible}
              title={t("collections.delete", "Delete Collection")}
              message={t(
                "collections.deleteConfirm",
                "Are you sure you want to delete this collection? All items will be removed. This cannot be undone.",
              )}
              confirmLabel={t("collections.delete", "Delete Collection")}
              cancelLabel={t("common.cancel")}
              destructive
              onConfirm={handleDeleteCollection}
              onCancel={() => setDeleteConfirmVisible(false)}
            />
            <Modal visible={editModalVisible} transparent animationType="slide">
              <Pressable
                style={styles.editModalOverlay}
                onPress={() => setEditModalVisible(false)}
              >
                <View
                  style={[
                    styles.editModalContent,
                    { paddingBottom: insets.bottom + SPACING.l },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <View style={styles.editModalHandle} />
                  <Text style={styles.editModalTitle}>
                    {t("collections.edit", "Edit collection")}
                  </Text>
                  <TextInput
                    style={styles.editModalInput}
                    placeholder={t("collections.titlePlaceholder", "Title")}
                    placeholderTextColor={COLORS.tertiary}
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />
                  <TextInput
                    style={[
                      styles.editModalInput,
                      styles.editModalInputMultiline,
                    ]}
                    placeholder={t(
                      "collections.descPlaceholder",
                      "Description (optional)",
                    )}
                    placeholderTextColor={COLORS.tertiary}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={2}
                  />
                  <View style={styles.editModalSwitchRow}>
                    <Text style={styles.editModalSwitchLabel}>
                      {t("collections.visibility", "Visibility")}
                    </Text>
                    <Switch
                      value={editIsPublic}
                      onValueChange={setEditIsPublic}
                      trackColor={{
                        false: COLORS.tertiary + "40",
                        true: COLORS.primary + "99",
                      }}
                      thumbColor={
                        editIsPublic ? COLORS.primary : COLORS.secondary
                      }
                    />
                  </View>
                  <View style={styles.editModalSwitchRow}>
                    <Text style={styles.editModalSwitchLabel}>
                      {t("collections.shareSaves", "Share saves")}
                    </Text>
                    <Switch
                      value={editShareSaves}
                      onValueChange={setEditShareSaves}
                      trackColor={{
                        false: COLORS.tertiary + "40",
                        true: COLORS.primary + "99",
                      }}
                      thumbColor={
                        editShareSaves ? COLORS.primary : COLORS.secondary
                      }
                    />
                  </View>
                  <View style={styles.editModalButtons}>
                    <Pressable
                      style={styles.editModalButtonCancel}
                      onPress={() => setEditModalVisible(false)}
                    >
                      <Text style={styles.editModalButtonTextCancel}>
                        {t("common.cancel")}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.editModalButtonSave,
                        !editTitle.trim() && styles.editModalButtonDisabled,
                      ]}
                      onPress={handleSaveEdit}
                      disabled={!editTitle.trim()}
                    >
                      <Text style={styles.editModalButtonTextSave}>
                        {t("common.save", "Save")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Modal>
          </>
        }
      />
    </>
  );
}

const styles = createStyles({
  searchRow: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  tabsContent: {
    gap: SPACING.m,
    paddingRight: SPACING.l,
  },
  tab: {
    flexShrink: 0,
    paddingVertical: SPACING.m,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
  },
  sourceItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.m,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  sourceIconText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  sourceContent: { flex: 1, gap: 2 },
  sourceDomain: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  sourceText: { fontSize: 14, color: COLORS.paper, fontFamily: FONTS.medium },
  emptyWrapper: {
    paddingVertical: SPACING.xxxl,
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  noteContainer: {
    padding: SPACING.l,
    paddingTop: SPACING.m,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary,
    marginLeft: SPACING.l,
    marginTop: SPACING.s,
  },
  noteLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.semiBold,
  },
  noteText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
  addCitationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.m,
  },
  addCitationText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  emptyState: {
    padding: SPACING.xxxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  suggestionsContainer: {
    marginTop: SPACING.xxxl,
    width: "100%",
  },
  suggestionsHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  suggestionItem: {
    marginBottom: SPACING.m,
  },
  shareSavesRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  shareSavesBtn: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  shareSavesBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  shareSavesBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.secondary,
    fontFamily: FONTS.semiBold,
  },
  shareSavesBtnTextActive: {
    color: COLORS.ink,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: COLORS.ink,
    borderTopLeftRadius: SIZES.borderRadius * 2,
    borderTopRightRadius: SIZES.borderRadius * 2,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
  },
  editModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.divider,
    alignSelf: "center",
    marginBottom: SPACING.l,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.m,
  },
  editModalInput: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 16,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
  },
  editModalInputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editModalSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },
  editModalSwitchLabel: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  editModalButtons: {
    flexDirection: "row",
    gap: SPACING.m,
    marginTop: SPACING.l,
  },
  editModalButtonCancel: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    alignItems: "center",
  },
  editModalButtonSave: {
    flex: 1,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  editModalButtonDisabled: {
    opacity: 0.5,
  },
  editModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  editModalButtonTextSave: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
});
