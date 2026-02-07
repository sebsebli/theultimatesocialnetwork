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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useOpenExternalLink } from "../../hooks/useOpenExternalLink";
import {
  api,
  getWebAppBaseUrl,
  getTopicRecentImageUri,
  getImageUrl,
} from "../../utils/api";
import { useAuth } from "../../context/auth";
import { PostItem } from "../../components/PostItem";
import { UserCard } from "../../components/UserCard";
import { TopicCard } from "../../components/ExploreCards";
import { SourceOrPostCard } from "../../components/SourceOrPostCard";
import { Topic, Post } from "../../types";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import {
  FeedSkeleton,
  FullScreenSkeleton,
} from "../../components/LoadingSkeleton";
import { HeaderIconButton } from "../../components/HeaderIconButton";
import { TopicCollectionHeader } from "../../components/TopicCollectionHeader";
import { TopicOrCollectionLayout } from "../../components/TopicOrCollectionLayout";
import { OptionsActionSheet } from "../../components/OptionsActionSheet";
import { ExplorationTrail } from "../../components/ExplorationTrail";
import { useExplorationTrail } from "../../context/ExplorationTrailContext";
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
  toDimension,
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
  const { openExternalLink } = useOpenExternalLink();
  const { pushStep } = useExplorationTrail();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [moreTopics, setMoreTopics] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [topicMap, setTopicMap] = useState<{
    centralPosts: Array<{
      id: string;
      title: string | null;
      authorHandle: string;
      authorDisplayName: string;
      authorAvatarKey: string | null;
      connections: number;
    }>;
    connectedTopics: Array<{
      id: string;
      slug: string;
      title: string;
      sharedPosts: number;
    }>;
  } | null>(null);
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
    const data = await api.get<Topic>(`/topics/${slugEnc}`);
    setTopic(data);
    setIsFollowing(!!data.isFollowing);
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
        setLoadingTab(true);
      }

      try {
        if (isPostsTab && isSearch) {
          const offset = (pageNum - 1) * PAGE_SIZE;
          const res = await api.get<{ hits: Record<string, unknown>[] }>(
            `/search/posts?q=${encodeURIComponent(searchQuery.trim())}&limit=${PAGE_SIZE}&offset=${offset}&topicSlug=${slugEnc}`,
          );
          const hits = res.hits || [];
          const list = hits.map((h: Record<string, unknown>) => ({
            ...h,
            author: h.author || {
              id: h.authorId,
              handle: (h.author as Record<string, unknown>)?.handle || "",
              displayName:
                (h.author as Record<string, unknown>)?.displayName || "",
            },
          }));
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(hits.length >= PAGE_SIZE);
          return;
        }

        if (activeTab === "recent") {
          const res = await api.get<{
            items?: Record<string, unknown>[];
            hasMore?: boolean;
          }>(
            `/topics/${slugEnc}/posts?sort=recent&page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "discussed") {
          const res = await api.get<{
            items?: Record<string, unknown>[];
            hasMore?: boolean;
          }>(
            `/topics/${slugEnc}/posts?sort=ranked&page=${pageNum}&limit=${PAGE_SIZE}`,
          );
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "people") {
          const res = await api.get<{
            items?: Record<string, unknown>[];
            hasMore?: boolean;
          }>(`/topics/${slugEnc}/people?page=${pageNum}&limit=${PAGE_SIZE}`);
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        } else if (activeTab === "sources") {
          const res = await api.get<{
            items?: Record<string, unknown>[];
            hasMore?: boolean;
          }>(`/topics/${slugEnc}/sources?page=${pageNum}&limit=${PAGE_SIZE}`);
          const list = Array.isArray(res?.items) ? res.items : [];
          if (reset) setItems(list);
          else setItems((prev) => [...prev, ...list]);
          setHasMore(list.length >= PAGE_SIZE && res?.hasMore !== false);
        }
      } catch (err: unknown) {
        if (__DEV__) console.error("Topic loadTabData error", err);
        if (reset) {
          setItems([]);
          setError(t("topic.loadError", "Failed to load topic content"));
        }
        setHasMore(false);
        // Do not setTopic(null) — keep topic header so user stays on the screen and can pull-to-refresh
      } finally {
        if (reset) setLoadingTab(false);
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
      .catch((err: unknown) => {
        if (!cancelled) {
          setTopic(null);
          setItems([]);
          if ((err as { status?: number })?.status === 404) {
            router.back();
          } else {
            setError(t("topic.loadError", "Failed to load topic"));
          }
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slugStr, router]);

  // Track trail step when topic loads
  useEffect(() => {
    if (topic && slugStr) {
      pushStep({
        type: "topic",
        id: topic.id || slugStr,
        label: topic.title || slugStr,
        href: `/topic/${slugStr}`,
      });
    }
  }, [topic, slugStr, pushStep]);

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
    setError(null);
    loadTopicMeta()
      .then(() => {
        loadTabData(1, true);
        setRefreshing(false);
      })
      .catch(() => {
        setError(t("topic.loadError", "Failed to load topic"));
        setRefreshing(false);
      });
  }, [loadTopicMeta, loadTabData, t]);

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
    ({ item }: { item: Record<string, unknown> }) => {
      if (activeTab === "people") {
        return (
          <UserCard
            item={{
              id: item.id,
              handle: item.handle,
              displayName: item.displayName,
              bio: undefined,
              avatarKey: item.avatarKey ?? undefined,
              avatarUrl: item.avatarUrl ?? undefined,
              isFollowing: item.isFollowing,
            }}
            onPress={() => router.push(`/user/${item.handle}`)}
          />
        );
      }
      if (activeTab === "sources") {
        const type = item.type ?? "external";
        if (type === "post") {
          return (
            <SourceOrPostCard
              type="post"
              title={item.title || "Post"}
              subtitle={item.authorHandle ?? undefined}
              imageUri={
                item.headerImageKey
                  ? getImageUrl(item.headerImageKey as string)
                  : undefined
              }
              onPress={() => router.push(`/post/${item.id as string}/reading`)}
            />
          );
        }
        if (type === "topic") {
          return (
            <SourceOrPostCard
              type="topic"
              title={(item.title ?? item.slug ?? "Topic") as string}
              subtitle={item.slug as string | undefined}
              onPress={() =>
                router.push(
                  `/topic/${encodeURIComponent((item.slug ?? item.id) as string)}`,
                )
              }
            />
          );
        }
        const title = (item.title ||
          (item.url
            ? new URL(item.url as string).hostname
            : "External")) as string;
        const subtitle = (item.url || "") as string;
        return (
          <SourceOrPostCard
            type="external"
            title={title}
            subtitle={subtitle}
            onPress={() => item.url && openExternalLink(item.url as string)}
          />
        );
      }
      return <PostItem post={item} />;
    },
    [activeTab, router],
  );

  const keyExtractor = useCallback(
    (item: Record<string, unknown>) =>
      activeTab === "sources" && item?.type
        ? `${item.type as string}-${item.type === "external" ? ((item.url ?? item.id) as string) : (item.id as string)}`
        : (item.id as string),
    [activeTab],
  );

  const listData = useMemo(() => {
    const base =
      activeTab === "recent" || activeTab === "discussed"
        ? items.filter((p: Record<string, unknown>) => !!p?.author)
        : items;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return base;
    if (activeTab === "people") {
      return base.filter(
        (item: Record<string, unknown>) =>
          (item.displayName &&
            (item.displayName as string).toLowerCase().includes(q)) ||
          (item.handle && (item.handle as string).toLowerCase().includes(q)) ||
          (item.bio && (item.bio as string).toLowerCase().includes(q)),
      );
    }
    if (activeTab === "sources") {
      return base.filter(
        (item: Record<string, unknown>) =>
          (item.title && (item.title as string).toLowerCase().includes(q)) ||
          (item.url && (item.url as string).toLowerCase().includes(q)) ||
          (item.slug && (item.slug as string).toLowerCase().includes(q)) ||
          (item.authorHandle &&
            (item.authorHandle as string).toLowerCase().includes(q)),
      );
    }
    return base;
  }, [items, activeTab, searchQuery]);

  const handleFollowSuggestedTopic = useCallback(
    async (tpc: Record<string, unknown>) => {
      try {
        const slugEnc = encodeURIComponent((tpc.slug || tpc.id) as string);
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
    },
    [],
  );

  const ListEmptyComponent = useMemo(() => {
    if (loading || loadingTab)
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
              {moreTopics.map((tpc: Record<string, unknown>) => (
                <View
                  key={(tpc.id || tpc.slug) as string}
                  style={styles.suggestionItem}
                >
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent((tpc.slug || tpc.id) as string)}`,
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
              {moreTopics.map((tpc: Record<string, unknown>) => (
                <View
                  key={(tpc.id || tpc.slug) as string}
                  style={styles.suggestionItem}
                >
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent((tpc.slug || tpc.id) as string)}`,
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
              {moreTopics.map((tpc: Record<string, unknown>) => (
                <View
                  key={(tpc.id || tpc.slug) as string}
                  style={styles.suggestionItem}
                >
                  <TopicCard
                    item={tpc}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent((tpc.slug || tpc.id) as string)}`,
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
  }, [
    loading,
    loadingTab,
    activeTab,
    t,
    moreTopics,
    router,
    handleFollowSuggestedTopic,
  ]);

  const handleFollow = useCallback(async () => {
    if (!slugStr || !userId) return;
    try {
      const slugEnc = encodeURIComponent(slugStr);
      if (isFollowing) await api.delete(`/topics/${slugEnc}/follow`);
      else await api.post(`/topics/${slugEnc}/follow`);
      setIsFollowing(!isFollowing);
    } catch (error) {
      if (__DEV__) console.error("Failed to toggle follow", error);
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
    }).catch(() => {
      /* operation failure handled silently */
    });
  }, [slugStr, t]);

  const handleSearchInTopic = useCallback(() => {
    setMoreOptionsVisible(false);
    router.push({ pathname: "/search", params: { topicSlug: slugStr } });
  }, [router, slugStr]);

  useEffect(() => {
    api
      .get<Record<string, unknown>[] | { items?: Record<string, unknown>[] }>(
        "/explore/topics?limit=10",
      )
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setMoreTopics(
          list
            .filter(
              (tpc: Record<string, unknown>) =>
                (tpc.slug || tpc.id) !== slugStr,
            )
            .slice(0, 10),
        );
      })
      .catch(() => {
        /* operation failure handled silently */
      });
  }, [slugStr]);

  // Load topic map
  useEffect(() => {
    if (!slugStr) return;
    const slugEnc = encodeURIComponent(slugStr);
    api
      .get<{
        centralPosts: Array<{
          id: string;
          title: string | null;
          authorHandle: string;
          authorDisplayName: string;
          authorAvatarKey: string | null;
          connections: number;
        }>;
        connectedTopics: Array<{
          id: string;
          slug: string;
          title: string;
          sharedPosts: number;
        }>;
      }>(`/topics/${slugEnc}/map`)
      .then((data) => {
        setTopicMap(data);
      })
      .catch(() => {
        // Silently fail - map is optional
      });
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
          headerImageUri={getTopicRecentImageUri(
            topic as unknown as {
              recentPostImageUrl?: string | null;
              recentPostImageKey?: string | null;
              recentPost?: {
                headerImageUrl?: string | null;
                headerImageKey?: string | null;
              } | null;
            },
          )}
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
            <View style={[SEARCH_BAR.container, styles.searchBarWrap]}>
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
          {/* Topic Map Section */}
          {topicMap && topicMap.centralPosts.length > 0 && (
            <View style={styles.topicMapSection}>
              <Text style={styles.sectionTitle}>
                {t("topic.topicMap", "TOPIC MAP")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topicMapScrollContent}
              >
                {topicMap.centralPosts.map((post) => (
                  <Pressable
                    key={post.id}
                    onPress={() => router.push(`/post/${post.id}/reading`)}
                    style={styles.topicMapCard}
                  >
                    <Text style={styles.topicMapCardTitle} numberOfLines={2}>
                      {post.title || t("post.fallbackTitle", "Post")}
                    </Text>
                    <Text style={styles.topicMapCardAuthor} numberOfLines={1}>
                      {post.authorDisplayName || post.authorHandle}
                    </Text>
                    {post.connections > 0 && (
                      <Text style={styles.topicMapCardConnections}>
                        {post.connections}{" "}
                        {t("topic.connections", "connections")}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Connected Topics Section */}
          {topicMap && topicMap.connectedTopics.length > 0 && (
            <View style={styles.connectedTopicsSection}>
              <Text style={styles.sectionTitle}>
                {t("topic.connectedTopics", "CONNECTED TOPICS")}
              </Text>
              <View style={styles.connectedTopicsContainer}>
                {topicMap.connectedTopics.map((connectedTopic) => (
                  <Pressable
                    key={connectedTopic.id}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent(connectedTopic.slug)}`,
                      )
                    }
                    style={styles.connectedTopicPill}
                  >
                    <Text style={styles.connectedTopicPillText}>
                      {connectedTopic.title}
                    </Text>
                    {connectedTopic.sharedPosts > 0 && (
                      <Text style={styles.connectedTopicPillCount}>
                        {connectedTopic.sharedPosts}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          )}

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

  // Show a single full-screen loading state until topic is loaded. This avoids
  // the "weird" in-between view (back bar + slug title + empty header + skeleton list)
  // when navigating from a post (or elsewhere) to a topic. Also show when slug changed
  // (e.g. topic A → topic B) so we never flash the previous topic's content.
  const topicSlugMismatch =
    topic && topic.slug !== slugStr && topic.id !== slugStr;
  if (slugStr && ((loading && !topic) || topicSlugMismatch)) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.ink }}
        edges={["top", "bottom"]}
      >
        <View style={styles.loadingScreenBar}>
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back", "Back")}
          />
        </View>
        <FullScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (error && !loading && !topic) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.ink }}
        edges={["top", "bottom"]}
      >
        <View style={styles.loadingScreenBar}>
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back", "Back")}
          />
        </View>
        <ErrorState
          message={error}
          onRetry={() => {
            setError(null);
            loadTopicMeta()
              .then((data) => {
                if (data) {
                  setPage(1);
                  setItems([]);
                  loadTabData(1, true);
                }
              })
              .catch(() => {
                setError(t("topic.loadError", "Failed to load topic"));
              });
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <>
      {React.createElement(ExplorationTrail as React.ComponentType)}
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
        ListFooterComponent={
          !hasMore && topicMap && topicMap.connectedTopics.length > 0 ? (
            <View style={styles.continueExploringSection}>
              <Text style={styles.sectionTitle}>
                {t("topic.continueExploring", "CONTINUE EXPLORING")}
              </Text>
              <Text style={styles.continueExploringText}>
                {t("topic.continueExploringSubtext", "Explore related topics")}
              </Text>
              <View style={styles.connectedTopicsContainer}>
                {topicMap.connectedTopics.slice(0, 6).map((connectedTopic) => (
                  <Pressable
                    key={connectedTopic.id}
                    onPress={() =>
                      router.push(
                        `/topic/${encodeURIComponent(connectedTopic.slug)}`,
                      )
                    }
                    style={styles.connectedTopicPill}
                  >
                    <Text style={styles.connectedTopicPillText}>
                      {connectedTopic.title}
                    </Text>
                    {connectedTopic.sharedPosts > 0 && (
                      <Text style={styles.connectedTopicPillCount}>
                        {connectedTopic.sharedPosts}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null
        }
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
        stickyBarRight={
          <HeaderIconButton
            onPress={() => setMoreOptionsVisible(true)}
            icon="more-horiz"
            accessibilityLabel={t("profile.options", "More options")}
          />
        }
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
    </>
  );
}

const styles = createStyles({
  loadingScreenBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: toDimension(HEADER.barPaddingHorizontal),
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  searchRow: {
    paddingHorizontal: toDimension(HEADER.barPaddingHorizontal),
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  searchBarWrap: {
    flex: 1,
    minWidth: 0,
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
  topicMapSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  topicMapScrollContent: {
    gap: SPACING.m,
    paddingRight: SPACING.l,
  },
  topicMapCard: {
    width: 180,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.xs,
  },
  topicMapCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 18,
  },
  topicMapCardAuthor: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  topicMapCardConnections: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  connectedTopicsSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  connectedTopicsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
  },
  connectedTopicPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.xs,
  },
  connectedTopicPillText: {
    fontSize: 13,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  connectedTopicPillCount: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  continueExploringSection: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  continueExploringText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.m,
  },
});
