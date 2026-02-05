import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Text,
  View,
  Pressable,
  Share,
  TextInput,
  Animated,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { api, getWebAppBaseUrl, getTopicRecentImageUri } from "../../utils/api";
import { useAuth } from "../../context/auth";
import { PostItem } from "../../components/PostItem";
import { UserCard } from "../../components/UserCard";
import { TopicCard } from "../../components/ExploreCards";
import { SourceOrPostCard } from "../../components/SourceOrPostCard";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import { FeedSkeleton } from "../../components/LoadingSkeleton";
import { TopicCollectionHeader } from "../../components/TopicCollectionHeader";
import { TopicOrCollectionLayout } from "../../components/TopicOrCollectionLayout";
import { OptionsActionSheet } from "../../components/OptionsActionSheet";
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

const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const STICKY_FADE_RANGE = 80;
const PAGE_SIZE = 20;

type TabKey = "recent" | "discussed" | "sources" | "people";

/**
 * Topic detail: header (like post views), overlayed title, tab bar (Most recent, Most discussed, Sources, People), search bar, lazy load.
 */
export default function TopicScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const slugStr = (Array.isArray(slug) ? slug?.[0] : slug) ?? "";
  const { t } = useTranslation();
  const { userId } = useAuth();

  const [topic, setTopic] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [moreTopics, setMoreTopics] = useState<any[]>([]);
  const onEndReachedFiredRef = useRef(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const loadTopicMeta = useCallback(async () => {
    if (!slugStr) return null;
    const slugEnc = encodeURIComponent(slugStr);
    const data = await api.get(`/topics/${slugEnc}`);
    setTopic(data);
    setIsFollowing(!!(data as any).isFollowing);
    return data;
  }, [slugStr]);

  const loadTabData = useCallback(
    async (pageNum: number, reset: boolean) => {
      if (!slugStr) return;
      const slugEnc = encodeURIComponent(slugStr);
      const isSearch = searchQuery.trim().length > 0;
      const isPostsTab = activeTab === "recent" || activeTab === "discussed";

      if (reset) {
        setPage(1);
        setItems([]);
        setHasMore(true);
        onEndReachedFiredRef.current = false;
      }

      try {
        if (isPostsTab && isSearch) {
          const offset = (pageNum - 1) * PAGE_SIZE;
          const res = await api.get<{ hits: any[] }>(
            `/search/posts?q=${encodeURIComponent(searchQuery.trim())}&limit=${PAGE_SIZE}&offset=${offset}&topicSlug=${slugEnc}`,
          );
          const hits = res.hits || [];
          const list = hits.map((h: any) => ({
            ...h,
            author: h.author || {
              id: h.authorId,
              handle: h.author?.handle || "",
              displayName: h.author?.displayName || "",
            },
          }));
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(hits.length >= PAGE_SIZE);
          return;
        }

        if (activeTab === "recent") {
          const res = await api.get(
            `/topics/${slugEnc}/posts?sort=recent&page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "discussed") {
          const res = await api.get(
            `/topics/${slugEnc}/posts?sort=ranked&page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "people") {
          const res = await api.get(
            `/topics/${slugEnc}/people?page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "sources") {
          const res = await api.get(
            `/topics/${slugEnc}/sources?page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        }
      } catch (err) {
        console.error("Topic loadTabData error", err);
        if (reset) setItems([]);
        setHasMore(false);
        // Do not setTopic(null) — keep topic header so user stays on the screen and can pull-to-refresh
      }
    },
    [slugStr, activeTab, searchQuery],
  );

  useEffect(() => {
    if (!slugStr) {
      setLoading(false);
      setTopic(null);
      setItems([]);
      return;
    }
    // Clear previous topic immediately so we never show an old topic when slug changes
    setTopic(null);
    setItems([]);
    setSearchQuery("");
    setPage(1);
    setHasMore(true);
    let cancelled = false;
    setLoading(true);
    loadTopicMeta()
      .then((data) => {
        if (cancelled || !data) return;
        setPage(1);
        setItems([]);
        loadTabData(1, true);
      })
      .catch((err: any) => {
        if (!cancelled) {
          setTopic(null);
          setItems([]);
          if (err?.status === 404) router.back();
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugStr, router]);

  const prevSearchAndTabRef = useRef({
    searchQuery: "",
    activeTab: "recent" as TabKey,
  });
  useEffect(() => {
    if (!topic) return;
    const prev = prevSearchAndTabRef.current;
    const searchChanged = prev.searchQuery !== searchQuery;
    const tabChanged = prev.activeTab !== activeTab;
    prevSearchAndTabRef.current = { searchQuery, activeTab };
    if (!searchChanged && !tabChanged) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(
      () => {
        setPage(1);
        loadTabData(1, true);
        searchDebounceRef.current = null;
      },
      searchChanged ? 400 : 0,
    );
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, activeTab]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTopicMeta().then(() => {
      loadTabData(1, true);
      setRefreshing(false);
    });
  }, [slugStr, loadTopicMeta, loadTabData]);

  const handleLoadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !hasMore) return;
    if (onEndReachedFiredRef.current) return;
    onEndReachedFiredRef.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    loadTabData(nextPage, false).finally(() => {
      onEndReachedFiredRef.current = false;
    });
  }, [loading, refreshing, loadingMore, hasMore, page, loadTabData]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      if (activeTab === "people") {
        return (
          <UserCard
            item={{
              id: item.id,
              handle: item.handle,
              displayName: item.displayName,
              bio: undefined,
              avatarKey: undefined,
              avatarUrl: undefined,
              isFollowing: item.isFollowing,
            }}
            onPress={() => router.push(`/user/${item.handle}`)}
          />
        );
      }
      if (activeTab === "sources") {
        const title =
          item.title || (item.url ? new URL(item.url).hostname : "External");
        const subtitle = item.url || "";
        return (
          <SourceOrPostCard
            type="external"
            title={title}
            subtitle={subtitle}
            onPress={() => item.url && WebBrowser.openBrowserAsync(item.url)}
          />
        );
      }
      return <PostItem post={item} />;
    },
    [activeTab, router],
  );

  const keyExtractor = useCallback((item: any) => item.id, []);

  const listData = useMemo(() => {
    const base =
      activeTab === "recent" || activeTab === "discussed"
        ? items.filter((p: any) => !!p?.author)
        : items;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    if (activeTab === "people") {
      return base.filter(
        (item: any) =>
          (item.displayName && item.displayName.toLowerCase().includes(q)) ||
          (item.handle && item.handle.toLowerCase().includes(q)) ||
          (item.bio && item.bio.toLowerCase().includes(q)),
      );
    }
    if (activeTab === "sources") {
      return base.filter(
        (item: any) =>
          (item.title && item.title.toLowerCase().includes(q)) ||
          (item.url && item.url.toLowerCase().includes(q)),
      );
    }
    return base;
  }, [items, activeTab, searchQuery]);

  const handleFollowSuggestedTopic = useCallback(async (tpc: any) => {
    try {
      const slugEnc = encodeURIComponent(tpc.slug || tpc.id);
      if (tpc.isFollowing) await api.delete(`/topics/${slugEnc}/follow`);
      else await api.post(`/topics/${slugEnc}/follow`);
      setMoreTopics((prev) =>
        prev.map((x) =>
          (x.id || x.slug) === (tpc.id || tpc.slug)
            ? { ...x, isFollowing: !tpc.isFollowing }
            : x,
        ),
      );
    } catch (e) {
      /* ignore */
    }
  }, []);

  const ListEmptyComponent = useMemo(() => {
    if (loading)
      return (
        <View style={emptyStateCenterWrapStyle}>
          <FeedSkeleton count={4} />
        </View>
      );
    const emptyContent =
      activeTab === "people" ? (
        <EmptyState
          icon="people-outline"
          headline={t("topic.emptyPeople")}
          subtext={t("topic.emptyPeopleSubtext")}
        >
          {moreTopics.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsHeader}>
                {t("profile.topicsToFollow", "Topics to follow")}
              </Text>
              {moreTopics.map((tpc: any) => (
                <View key={tpc.id || tpc.slug} style={styles.suggestionItem}>
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent(tpc.slug || tpc.id)}`,
                      )
                    }
                    onFollow={() => handleFollowSuggestedTopic(tpc)}
                  />
                </View>
              ))}
            </View>
          )}
        </EmptyState>
      ) : activeTab === "sources" ? (
        <EmptyState
          icon="link"
          headline={t("topic.emptySources")}
          subtext={t("topic.emptySourcesSubtext")}
        >
          {moreTopics.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsHeader}>
                {t("profile.topicsToFollow", "Topics to follow")}
              </Text>
              {moreTopics.map((tpc: any) => (
                <View key={tpc.id || tpc.slug} style={styles.suggestionItem}>
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent(tpc.slug || tpc.id)}`,
                      )
                    }
                    onFollow={() => handleFollowSuggestedTopic(tpc)}
                  />
                </View>
              ))}
            </View>
          )}
        </EmptyState>
      ) : (
        <EmptyState
          icon="article"
          headline={t("topic.emptyPosts")}
          subtext={t("topic.emptyPostsSubtext")}
        >
          {moreTopics.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsHeader}>
                {t("profile.topicsToFollow", "Topics to follow")}
              </Text>
              {moreTopics.map((tpc: any) => (
                <View key={tpc.id || tpc.slug} style={styles.suggestionItem}>
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent(tpc.slug || tpc.id)}`,
                      )
                    }
                    onFollow={() => handleFollowSuggestedTopic(tpc)}
                  />
                </View>
              ))}
            </View>
          )}
        </EmptyState>
      );
    return <View style={emptyStateCenterWrapStyle}>{emptyContent}</View>;
  }, [loading, activeTab, t, moreTopics, router, handleFollowSuggestedTopic]);

  const handleFollow = useCallback(async () => {
    if (!slugStr || !userId) return;
    try {
      const slugEnc = encodeURIComponent(slugStr);
      if (isFollowing) await api.delete(`/topics/${slugEnc}/follow`);
      else await api.post(`/topics/${slugEnc}/follow`);
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error("Failed to toggle follow", error);
    }
  }, [slugStr, userId, isFollowing]);

  const handleShareTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    if (!slugStr) return;
    const url = `${getWebAppBaseUrl()}/topic/${encodeURIComponent(slugStr)}`;
    Share.share({
      message: `${t("topic.shareTopicMessage", { defaultValue: "Check out this topic", slug: slugStr })}\n${url}`,
      url,
      title: t("topic.shareTopic", "Share topic"),
    }).catch(() => {});
  }, [slugStr, t]);

  const handleSearchInTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    router.push({ pathname: "/search", params: { topicSlug: slugStr } });
  }, [router, slugStr]);

  useEffect(() => {
    api
      .get("/explore/topics?limit=10")
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setMoreTopics(
          list
            .filter((tpc: any) => (tpc.slug || tpc.id) !== slugStr)
            .slice(0, 10),
        );
      })
      .catch(() => {});
  }, [slugStr]);

  const headerComponent = useMemo(() => {
    if (!topic) return null;
    const tabs: { key: TabKey; label: string }[] = [
      { key: "recent", label: t("topic.recent", "Most recent") },
      { key: "discussed", label: t("topic.discussed", "Most discussed") },
      { key: "sources", label: t("topic.sources", "Sources") },
      { key: "people", label: t("topic.people", "People") },
    ];
    return (
      <>
        <TopicCollectionHeader
          type="topic"
          title={topic.title}
          description={topic.description}
          headerImageUri={getTopicRecentImageUri(topic)}
          onBack={() => router.back()}
          onAction={userId ? handleFollow : undefined}
          actionLabel={
            isFollowing ? t("profile.following") : t("profile.follow")
          }
          isActionActive={isFollowing}
          metrics={{
            postCount: topic.postCount,
            contributorCount: topic.contributorCount,
          }}
          rightAction="more"
          onRightAction={() => setMoreOptionsVisible(true)}
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
                placeholder={t("topic.searchInTopic", "Search in topic")}
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
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.tab,
                    TABS.tab,
                    activeTab === tab.key && TABS.tabActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === tab.key }}
                >
                  <Text
                    style={[
                      styles.tabText,
                      TABS.tabText,
                      activeTab === tab.key && TABS.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </TopicCollectionHeader>
      </>
    );
  }, [
    topic,
    isFollowing,
    activeTab,
    searchQuery,
    t,
    handleFollow,
    router,
    userId,
  ]);

  return (
    <TopicOrCollectionLayout
      title={topic?.title ?? (slugStr || t("topic.title", "Topic"))}
      loading={loading}
      notFound={!loading && !topic}
      notFoundMessage={t("topic.notFound", "Topic not found")}
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
        <OptionsActionSheet
          visible={moreOptionsVisible}
          title={topic?.title ?? ""}
          options={[
            {
              label: t("topic.searchInTopic", "Search in topic"),
              onPress: handleSearchInTopic,
              icon: "search",
            },
            {
              label: t("topic.shareTopic", "Share topic"),
              onPress: handleShareTopic,
              icon: "share",
            },
          ]}
          cancelLabel={t("common.cancel", "Cancel")}
          onCancel={() => setMoreOptionsVisible(false)}
        />
      }
    />
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
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.tertiary,
    fontFamily: FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.paper,
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
});
