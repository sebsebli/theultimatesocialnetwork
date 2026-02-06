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
  FlatList,
  Pressable,
  ScrollView,
  RefreshControl,
  TextInput,
  Keyboard,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../utils/api";
import { PostItem } from "../../components/PostItem";
import { TopicCard } from "../../components/ExploreCards";
import { UserCard } from "../../components/UserCard";
import { SectionHeader } from "../../components/SectionHeader";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  toDimension,
  createStyles,
  FLATLIST_DEFAULTS,
  LIST_SCROLL_DEFAULTS,
  SEARCH_BAR,
  TABS,
  TAB_BAR_HEIGHT,
  LIST_PADDING_EXTRA,
} from "../../constants/theme";
import { ErrorState } from "../../components/ErrorState";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import {
  InlineSkeleton,
  FeedSkeleton,
  UserCardSkeleton,
  TopicCardSkeleton,
} from "../../components/LoadingSkeleton";
import { ListFooterLoader } from "../../components/ListFooterLoader";
import { SearchModal } from "../../components/SearchModal";
import { useAuth } from "../../context/auth";
import { useTabPress } from "../../context/TabPressContext";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const SEARCH_DEBOUNCE_MS = 480;
const SEARCH_LIMIT = 20;

type SearchFilterTab = "all" | "people" | "topics" | "posts";

/** Stable header component so the search TextInput is not remounted when searchQuery changes (which was dismissing the keyboard on first keystroke). */
function ExploreListHeader({
  insetsTop,
  searchQuery,
  setSearchQuery,
  searchLoading,
  isSearchActive,
  searchFilterTab,
  setSearchFilterTab,
  activeTab,
  setActiveTab,
  inputRef,
  styles,
  t,
  EXPLORE_TABS,
}: {
  insetsTop: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchLoading: boolean;
  isSearchActive: boolean;
  searchFilterTab: SearchFilterTab;
  setSearchFilterTab: (tab: SearchFilterTab) => void;
  activeTab: string;
  setActiveTab: (
    tab:
      | "trending"
      | "newest"
      | "topics"
      | "people"
      | "quoted"
      | "deep-dives"
      | "newsroom",
  ) => void;
  inputRef: React.RefObject<TextInput | null>;
  styles: Record<string, object>;
  t: (key: string, fallback?: string) => string;
  EXPLORE_TABS: readonly string[];
}) {
  return (
    <View
      key="explore-list-header"
      style={[styles.headerContainer, { paddingTop: insetsTop }]}
    >
      <View style={styles.searchRow}>
        <View style={[SEARCH_BAR.container, styles.searchBarFullWidth]}>
          <MaterialIcons
            name="search"
            size={HEADER.iconSize}
            color={COLORS.tertiary}
          />
          <TextInput
            ref={inputRef}
            style={SEARCH_BAR.input}
            placeholder={t("explore.searchPlaceholder")}
            placeholderTextColor={COLORS.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchLoading ? (
            <InlineSkeleton />
          ) : searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              hitSlop={8}
              accessibilityLabel={t("common.clear", "Clear")}
            >
              <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {isSearchActive ? (
        <View style={styles.searchFilterTabs}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.searchFilterContent}
          >
            {(["all", "people", "topics", "posts"] as const).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setSearchFilterTab(tab)}
                style={[
                  styles.searchFilterTab,
                  searchFilterTab === tab && styles.searchFilterTabActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: searchFilterTab === tab }}
              >
                <Text
                  style={[
                    styles.searchFilterTabText,
                    searchFilterTab === tab && styles.searchFilterTabTextActive,
                  ]}
                >
                  {tab === "all"
                    ? t("search.all", "All")
                    : tab === "people"
                      ? t("search.people", "People")
                      : tab === "topics"
                        ? t("search.topics", "Topics")
                        : t("search.posts", "Posts")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View key="explore-tabs" style={[styles.tabsContainer, TABS.container]}>
          <ScrollView
            horizontal
            {...LIST_SCROLL_DEFAULTS}
            contentContainerStyle={[styles.tabsContent, TABS.content]}
            style={[styles.tabsScrollView, TABS.scrollView]}
          >
            {(EXPLORE_TABS as readonly string[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab as "trending" | "newest" | "topics" | "people" | "quoted" | "deep-dives" | "newsroom")}
                style={[
                  styles.tab,
                  TABS.tab,
                  activeTab === tab && TABS.tabActive,
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab }}
              >
                <Text
                  style={[
                    styles.tabText,
                    TABS.tabText,
                    activeTab === tab && TABS.tabTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {tab === "deep-dives"
                    ? t("explore.deepDives")
                    : tab === "quoted"
                      ? t("explore.quoted")
                      : tab === "newsroom"
                        ? t("explore.newsroom")
                        : t(`explore.${tab}`)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
      <View key="explore-spacer" style={{ height: SPACING.m }} />
    </View>
  );
}

type SearchListItem =
  | { type: "section"; key: string; title: string }
  | { type: "post"; key: string; [k: string]: unknown }
  | { type: "user"; key: string; [k: string]: unknown }
  | { type: "topic"; key: string; [k: string]: unknown };

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<
    | "trending"
    | "newest"
    | "topics"
    | "people"
    | "quoted"
    | "deep-dives"
    | "newsroom"
  >("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilterTab, setSearchFilterTab] =
    useState<SearchFilterTab>("all");
  const [searchPosts, setSearchPosts] = useState<Record<string, unknown>[]>([]);
  const [searchUsers, setSearchUsers] = useState<Record<string, unknown>[]>([]);
  const [searchTopics, setSearchTopics] = useState<Record<string, unknown>[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const onEndReachedFiredRef = useRef(false);
  const listLayoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const flatListRef = useRef<FlatList>(null);
  const tabPress = useTabPress();
  const MAX_PAGE = 50;

  useEffect(() => {
    const count = tabPress?.tabPressCounts?.explore ?? 0;
    if (count === 0) return;
    if (!searchQuery.trim()) {
      setRefreshing(true);
      loadContent(1, true);
    }
    const t = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 50);
    return () => clearTimeout(t);
  }, [tabPress?.tabPressCounts?.explore]);

  const EXPLORE_TABS = [
    "trending",
    "newest",
    "quoted",
    "deep-dives",
    "newsroom",
    "topics",
    "people",
  ] as const;

  useEffect(() => {
    if (params.tab) {
      const tabName = Array.isArray(params.tab) ? params.tab[0] : params.tab;
      if (
        [
          "trending",
          "newest",
          "topics",
          "people",
          "quoted",
          "deep-dives",
          "newsroom",
        ].includes(tabName)
      ) {
        setActiveTab(tabName as typeof activeTab);
      }
    }
    if (params.q) {
      const query = Array.isArray(params.q) ? params.q[0] : params.q;
      if (query) setSearchQuery(query);
    }
  }, [params.tab, params.q]);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchPosts([]);
      setSearchUsers([]);
      setSearchTopics([]);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await api.get<{ posts: Record<string, unknown>[]; users: Record<string, unknown>[]; topics: Record<string, unknown>[] }>(
        `/search/all?q=${encodeURIComponent(trimmed)}&limit=${SEARCH_LIMIT}`,
      );
      const rawPosts = (res.posts || []).filter((p: Record<string, unknown>) => !!p?.author);
      const rawUsers = res.users || [];
      const rawTopics = (res.topics || []).map((tpc: Record<string, unknown>) => ({
        ...tpc,
        title: tpc.title || tpc.slug,
      }));
      setSearchPosts(rawPosts);
      setSearchUsers(rawUsers);
      setSearchTopics(rawTopics);
    } catch (err) {
      if (__DEV__) console.error("Search failed", err);
      setSearchPosts([]);
      setSearchUsers([]);
      setSearchTopics([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) {
      setSearchPosts([]);
      setSearchUsers([]);
      setSearchTopics([]);
      setSearchLoading(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      runSearch(searchQuery);
      searchDebounceRef.current = null;
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, runSearch]);

  const isSearchActive = searchQuery.trim().length > 0;

  const searchFlatData = useMemo((): SearchListItem[] => {
    if (searchFilterTab === "people") {
      return searchUsers.map((u) => ({
        type: "user" as const,
        key: String(u.id ?? ""),
        ...u,
      }));
    }
    if (searchFilterTab === "topics") {
      return searchTopics.map((tpc) => ({
        type: "topic" as const,
        key: String(tpc.id ?? tpc.slug ?? ""),
        ...tpc,
      }));
    }
    if (searchFilterTab === "posts") {
      return searchPosts.map((p) => ({
        type: "post" as const,
        key: String(p.id ?? ""),
        ...p,
      }));
    }
    const out: SearchListItem[] = [];
    if (searchPosts.length > 0) {
      out.push({
        type: "section",
        key: "section-posts",
        title: t("search.posts", "Posts"),
      });
      searchPosts.forEach((p) => out.push({ type: "post", key: String(p.id ?? ""), ...p }));
    }
    if (searchUsers.length > 0) {
      out.push({
        type: "section",
        key: "section-people",
        title: t("search.people", "People"),
      });
      searchUsers.forEach((u) => out.push({ type: "user", key: String(u.id ?? ""), ...u }));
    }
    if (searchTopics.length > 0) {
      out.push({
        type: "section",
        key: "section-topics",
        title: t("search.topics", "Topics"),
      });
      searchTopics.forEach((tpc) =>
        out.push({ type: "topic", key: String(tpc.id ?? tpc.slug ?? ""), ...tpc }),
      );
    }
    return out;
  }, [searchFilterTab, searchPosts, searchUsers, searchTopics, t]);

  const navigateToPost = useCallback(
    (post: Record<string, unknown>) => {
      Keyboard.dismiss();
      setSearchQuery("");
      if (post?.id) router.push(`/post/${post.id}`);
    },
    [router],
  );
  const navigateToUser = useCallback(
    (user: Record<string, unknown>) => {
      Keyboard.dismiss();
      setSearchQuery("");
      if (user?.handle) router.push(`/user/${user.handle}`);
    },
    [router],
  );
  const navigateToTopic = useCallback(
    (topic: Record<string, unknown>) => {
      Keyboard.dismiss();
      setSearchQuery("");
      if (topic?.slug || topic?.id)
        router.push(`/topic/${encodeURIComponent(String(topic.slug ?? topic.id ?? ""))}`);
    },
    [router],
  );

  // When tab changes: load content for current tab
  useEffect(() => {
    if (isAuthenticated) {
      setPage(1);
      setData([]);
      loadContent(1, true);
    }
  }, [activeTab, isAuthenticated]);

  const loadContent = async (pageNum: number, reset = false) => {
    if (!reset && (loading || loadingMore)) return;

    if (reset) {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      onEndReachedFiredRef.current = false;
    } else {
      setLoadingMore(true);
    }
    setError(false);
    try {
      let endpoint = "/explore/topics";
      if (activeTab === "newest") endpoint = "/explore/newest";
      else if (activeTab === "trending") endpoint = "/explore/trending";
      else if (activeTab === "people") endpoint = "/explore/people";
      else if (activeTab === "quoted") endpoint = "/explore/quoted-now";
      else if (activeTab === "deep-dives") endpoint = "/explore/deep-dives";
      else if (activeTab === "newsroom") endpoint = "/explore/newsroom";
      const params: Record<string, string> = {
        page: pageNum.toString(),
        limit: "20",
        sort: "recommended",
      };
      const qs = new URLSearchParams(params).toString();
      const res = await api.get<{ items?: Record<string, unknown>[]; hasMore?: boolean } | Record<string, unknown>[]>(`${endpoint}?${qs}`);
      const rawItems = Array.isArray(res) ? res : (Array.isArray((res as { items?: Record<string, unknown>[] }).items) ? (res as { items?: Record<string, unknown>[] }).items : []) || [];
      const normalized = rawItems.map((item: Record<string, unknown>) => ({
        ...item,
        author: item.author || {
          id: item.authorId || "",
          handle: item.handle || t("post.unknownUser", "Unknown"),
          displayName: item.displayName || t("post.unknownUser", "Unknown"),
        },
      }));
      const seen = new Set<string>();
      const items = normalized.filter((item: Record<string, unknown>) => {
        const k = String(item.id ?? item.slug ?? "");
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const hasMoreData = items.length === 20 && (Array.isArray(res) ? true : (res as { hasMore?: boolean }).hasMore !== false);

      if (reset) {
        setData(items);
      } else {
        setData((prev) => {
          const prevSeen = new Set(
            prev.map((p: Record<string, unknown>) => p.id ?? p.slug).filter(Boolean),
          );
          const appended = items.filter(
            (item: Record<string, unknown>) => !prevSeen.has(item.id ?? item.slug),
          );
          return prev.concat(appended);
        });
      }
      setHasMore(hasMoreData);
    } catch (error: unknown) {
      if ((error as { status?: number })?.status === 401) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }
      if (__DEV__) console.error("Failed to load content", error);
      setError(true);
      // Stop pagination on any error (e.g. 503) so we don't retry infinitely when scrolling
      setHasMore(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleFollow = async (topic: Record<string, unknown>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      // Optimistic update
      setData((prev) =>
        prev.map((item) =>
          item.id === topic.id
            ? { ...item, isFollowing: !item.isFollowing }
            : item,
        ),
      );

      if (topic.isFollowing) {
        await api.delete(`/topics/${encodeURIComponent(String(topic.slug ?? ""))}/follow`);
      } else {
        await api.post(`/topics/${encodeURIComponent(String(topic.slug ?? ""))}/follow`);
      }
    } catch (err) {
      if (__DEV__) console.error("Follow failed", err);
      // Revert on failure
      setData((prev) =>
        prev.map((item) =>
          item.id === topic.id
            ? { ...item, isFollowing: topic.isFollowing }
            : item,
        ),
      );
    }
  };

  const handleFollowUser = async (user: Record<string, unknown>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setData((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, isFollowing: !item.isFollowing }
            : item,
        ),
      );
      if (user.isFollowing) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }
    } catch (err) {
      if (__DEV__) console.error("Follow user failed", err);
      setData((prev) =>
        prev.map((item) =>
          item.id === user.id
            ? { ...item, isFollowing: user.isFollowing }
            : item,
        ),
      );
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!loading && !refreshing && !loadingMore && hasMore && page < MAX_PAGE) {
      if (onEndReachedFiredRef.current) return;
      onEndReachedFiredRef.current = true;
      const nextPage = page + 1;
      setPage(nextPage);
      loadContent(nextPage, false).finally(() => {
        onEndReachedFiredRef.current = false;
      });
    }
    if (page >= MAX_PAGE) setHasMore(false);
  }, [loading, refreshing, loadingMore, hasMore, page, activeTab]);

  /** When content is shorter than the list, onEndReached never fires. Load more until list is scrollable or no more data. */
  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h;
      const listH = listLayoutHeightRef.current;
      if (
        listH > 0 &&
        h < listH &&
        hasMore &&
        !loading &&
        !loadingMore &&
        page < MAX_PAGE &&
        !onEndReachedFiredRef.current
      ) {
        onEndReachedFiredRef.current = true;
        const nextPage = page + 1;
        setPage(nextPage);
        loadContent(nextPage, false).finally(() => {
          onEndReachedFiredRef.current = false;
        });
      }
    },
    [hasMore, loading, loadingMore, page, loadContent],
  );

  const handleListLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      listLayoutHeightRef.current = e.nativeEvent.layout.height;
    },
    [],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContent(1, true);
  }, [activeTab]);

  const renderItem = useCallback(
    ({ item }: { item: Record<string, unknown> }) => {
      if (
        activeTab === "newest" ||
        activeTab === "trending" ||
        activeTab === "deep-dives"
      ) {
        if (!item || !item.id) return null;
        return <PostItem post={item} />;
      } else if (activeTab === "people") {
        return (
          <UserCard
            item={item}
            onPress={() => router.push(`/user/${item.handle}`)}
            onFollow={() => handleFollowUser(item)}
          />
        );
      } else if (activeTab === "quoted") {
        if (!item || !item.id) return null;
        return <PostItem post={item} />;
      } else if (activeTab === "newsroom") {
        if (!item || !item.id) return null;
        return <PostItem post={item} />;
      } else {
        if (!item || !item.id) return null;
        return (
          <TopicCard
            item={item}
            onPress={() =>
              router.push(`/topic/${encodeURIComponent(String(item.slug ?? item.id ?? ""))}`)
            }
            onFollow={() => handleFollow(item)}
          />
        );
      }
    },
    [activeTab, router, handleFollowUser],
  );

  const keyExtractor = useCallback(
    (item: Record<string, unknown>, index: number) =>
      `explore-${activeTab}-${String(item?.id ?? item?.slug ?? `i-${index}`)}`,
    [activeTab],
  );

  const searchKeyExtractor = useCallback(
    (item: SearchListItem) => item.key,
    [],
  );
  const searchRenderItem = useCallback(
    ({ item }: { item: SearchListItem }) => {
      if (item.type === "section") {
        return <SectionHeader title={item.title} />;
      }
      if (item.type === "post") {
        return (
          <Pressable onPress={() => navigateToPost(item)}>
            <PostItem post={item} />
          </Pressable>
        );
      }
      if (item.type === "user") {
        return (
          <UserCard
            item={item}
            onPress={() => navigateToUser(item)}
            onFollow={() => handleFollowUser(item)}
          />
        );
      }
      if (item.type === "topic") {
        return (
          <TopicCard
            item={item}
            onPress={() => navigateToTopic(item)}
            onFollow={() => handleFollow(item)}
          />
        );
      }
      return null;
    },
    [
      navigateToPost,
      navigateToUser,
      navigateToTopic,
      handleFollow,
      handleFollowUser,
    ],
  );

  const showSearchResults = isSearchActive;
  const listData = showSearchResults
    ? searchFlatData
    : ["trending", "newest", "quoted", "deep-dives", "newsroom"].includes(
          activeTab,
        )
      ? data.filter((item: Record<string, unknown>) => !!item?.author)
      : data;
  const listKeyExtractor = showSearchResults
    ? searchKeyExtractor
    : keyExtractor;
  const listRenderItem = showSearchResults ? searchRenderItem : renderItem;

  const searchListEmpty = useMemo(() => {
    if (searchLoading) {
      return (
        <View style={styles.searchListSkeleton}>
          <UserCardSkeleton />
          <UserCardSkeleton />
          <TopicCardSkeleton />
          <TopicCardSkeleton />
        </View>
      );
    }
    return (
      <View style={emptyStateCenterWrapStyle}>
        <EmptyState
          icon="search"
          headline={
            searchQuery.trim()
              ? t("search.noResults", "No results")
              : t("search.startTyping", "Search posts, people, topics")
          }
          subtext={
            searchQuery.trim()
              ? t("search.noResultsHint", "Try different keywords.")
              : undefined
          }
        />
      </View>
    );
  }, [searchLoading, searchQuery, t]);

  const exploreListEmpty = useMemo(
    () => (
      <View style={emptyStateCenterWrapStyle}>
        {loading ? (
          <FeedSkeleton count={4} />
        ) : (
          <EmptyState
            icon="explore"
            headline={t("explore.noContent", "No content yet")}
            subtext={t(
              "explore.noContentHint",
              "Try another filter or check back later.",
            )}
          />
        )}
      </View>
    ),
    [loading, t],
  );

  return (
    <View style={styles.container}>
      {/* Fixed header so the search TextInput is never remounted (avoids keyboard dismissing after first keystroke) */}
      <ExploreListHeader
        insetsTop={insets.top}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchLoading={searchLoading}
        isSearchActive={isSearchActive}
        searchFilterTab={searchFilterTab}
        setSearchFilterTab={setSearchFilterTab}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        inputRef={inputRef}
        styles={styles}
        t={t}
        EXPLORE_TABS={EXPLORE_TABS}
      />
      {!showSearchResults && error && data.length === 0 ? (
        <ErrorState
          onRetry={() => loadContent(1, true)}
          onDismiss={() => setError(false)}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          style={styles.listBelowHeader}
          data={listData}
          keyExtractor={
            listKeyExtractor as (item: Record<string, unknown> | SearchListItem, index: number) => string
          }
          ListHeaderComponent={null}
          renderItem={
            listRenderItem as (info: { item: Record<string, unknown> | SearchListItem }) => React.ReactElement | null
          }
          ListEmptyComponent={
            showSearchResults ? searchListEmpty : exploreListEmpty
          }
          ListFooterComponent={
            showSearchResults ? null : (
              <ListFooterLoader visible={!!(hasMore && loadingMore)} />
            )
          }
          refreshControl={
            showSearchResults ? undefined : (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.primary}
              />
            )
          }
          onEndReached={showSearchResults ? undefined : handleLoadMore}
          onContentSizeChange={
            showSearchResults ? undefined : handleContentSizeChange
          }
          onLayout={showSearchResults ? undefined : handleListLayout}
          contentContainerStyle={[
            {
              paddingBottom:
                TAB_BAR_HEIGHT + insets.bottom + LIST_PADDING_EXTRA,
            },
            listData.length === 0 && { flexGrow: 1 },
          ]}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="none"
          {...LIST_SCROLL_DEFAULTS}
          {...FLATLIST_DEFAULTS}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
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
  listBelowHeader: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: COLORS.ink,
    paddingHorizontal: toDimension(HEADER.barPaddingHorizontal),
  },
  searchRow: {
    paddingVertical: SPACING.m,
  },
  searchBarFullWidth: {
    width: "100%",
  },
  searchSpinner: {
    marginLeft: SPACING.s,
  },
  searchListSkeleton: {
    paddingVertical: SPACING.m,
  },
  searchFilterTabs: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  searchFilterContent: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    gap: SPACING.m,
    flexDirection: "row",
  },
  searchFilterTab: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: SIZES.borderRadiusPill,
    backgroundColor: COLORS.hover,
  },
  searchFilterTabActive: {
    backgroundColor: COLORS.primary + "33",
  },
  searchFilterTabText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  searchFilterTabTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
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
    paddingHorizontal: SPACING.s,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
    alignItems: "center",
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
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
