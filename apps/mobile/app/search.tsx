import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Text, View, TextInput, FlatList, Pressable } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../utils/api";
import { PostItem } from "../components/PostItem";
import { TopicCard } from "../components/ExploreCards";
import { UserCard } from "../components/UserCard";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../components/EmptyState";
import { SectionHeader } from "../components/SectionHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import {
  HeaderIconButton,
  headerIconCircleSize,
  headerIconCircleMarginH,
} from "../components/HeaderIconButton";

const DEBOUNCE_MS = 350;
const SEARCH_LIMIT = 20;

type ListItem =
  | { type: "section"; key: string; title: string }
  | { type: "post"; key: string; [k: string]: unknown }
  | { type: "user"; key: string; [k: string]: unknown }
  | { type: "topic"; key: string; [k: string]: unknown };

/**
 * Full-screen search: one query, one request to /search/all, results shown in sections (Posts, People, Topics).
 * No tabs. Used when navigating to /search (e.g. from topic "Search in topic") or deep link.
 */
export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ topicSlug?: string; q?: string }>();
  const topicSlug =
    typeof params.topicSlug === "string" ? params.topicSlug : undefined;
  const initialQ =
    typeof params.q === "string"
      ? params.q
      : Array.isArray(params.q)
        ? params.q[0]
        : "";
  const { t } = useTranslation();

  const [query, setQuery] = useState(initialQ || "");
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (initialQ) setQuery(initialQ);
  }, [initialQ]);

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) {
        setPosts([]);
        setUsers([]);
        setTopics([]);
        return;
      }
      setLoading(true);
      try {
        const url = topicSlug
          ? `/search/all?q=${encodeURIComponent(trimmed)}&limit=${SEARCH_LIMIT}&topicSlug=${encodeURIComponent(topicSlug)}`
          : `/search/all?q=${encodeURIComponent(trimmed)}&limit=${SEARCH_LIMIT}`;
        const res = await api.get<{
          posts: any[];
          users: any[];
          topics: any[];
        }>(url);
        const rawPosts = (res.posts || []).filter((p: any) => !!p?.author);
        const rawUsers = res.users || [];
        const rawTopics = (res.topics || []).map((tpc: any) => ({
          ...tpc,
          title: tpc.title || tpc.slug,
        }));
        setPosts(rawPosts);
        setUsers(rawUsers);
        setTopics(rawTopics);
      } catch (err) {
        console.error("Search failed", err);
        setPosts([]);
        setUsers([]);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    },
    [topicSlug],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setPosts([]);
      setUsers([]);
      setTopics([]);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      runSearch(query);
      debounceRef.current = null;
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  const flatData = useMemo((): ListItem[] => {
    const out: ListItem[] = [];
    if (posts.length > 0) {
      out.push({
        type: "section",
        key: "section-posts",
        title: t("search.posts", "Posts"),
      });
      posts.forEach((p) => out.push({ type: "post", key: p.id, ...p }));
    }
    if (users.length > 0) {
      out.push({
        type: "section",
        key: "section-people",
        title: t("search.people", "People"),
      });
      users.forEach((u) => out.push({ type: "user", key: u.id, ...u }));
    }
    if (topics.length > 0) {
      out.push({
        type: "section",
        key: "section-topics",
        title: t("search.topics", "Topics"),
      });
      topics.forEach((tpc) =>
        out.push({ type: "topic", key: tpc.id || tpc.slug, ...tpc }),
      );
    }
    return out;
  }, [posts, users, topics, t]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "section") {
        return <SectionHeader title={item.title} />;
      }
      if (item.type === "post") {
        return <PostItem post={item} />;
      }
      if (item.type === "user") {
        return (
          <UserCard
            item={item}
            onPress={() => router.push(`/user/${item.handle}`)}
          />
        );
      }
      if (item.type === "topic") {
        return (
          <TopicCard
            item={item}
            onPress={() =>
              router.push(
                `/topic/${encodeURIComponent(String(item.slug ?? item.id ?? ""))}`,
              )
            }
          />
        );
      }
      return null;
    },
    [router],
  );

  const keyExtractor = useCallback((item: ListItem) => item.key, []);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View style={emptyStateCenterWrapStyle}>
          <Text style={styles.loadingText}>
            {t("common.loading", "Loading...")}
          </Text>
        </View>
      );
    }
    return (
      <View style={emptyStateCenterWrapStyle}>
        <EmptyState
          icon="search"
          headline={
            query.trim()
              ? t("search.noResults", "No results")
              : topicSlug
                ? t(
                    "search.typeToSearchInTopic",
                    "Type to search in this topic",
                  )
                : t("search.startTyping", "Search posts, people, topics")
          }
          subtext={
            query.trim()
              ? t("search.noResultsHint", "Try different keywords.")
              : undefined
          }
        />
      </View>
    );
  }, [loading, query, topicSlug, t]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HeaderIconButton
          onPress={() => router.back()}
          icon="arrow-back"
          accessibilityLabel={t("common.goBack", "Go back")}
        />
        <View style={[SEARCH_BAR.container, styles.searchWrap]}>
          <MaterialIcons
            name="search"
            size={HEADER.iconSize}
            color={COLORS.tertiary}
          />
          <TextInput
            style={[SEARCH_BAR.input, styles.input]}
            placeholder={
              topicSlug
                ? t("search.withinTopic", "Search in topic")
                : t("home.search", "Search")
            }
            placeholderTextColor={COLORS.tertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoFocus
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 ? (
            <Pressable
              onPress={() => setQuery("")}
              hitSlop={8}
              accessibilityLabel={t("common.clear", "Clear")}
            >
              <MaterialIcons name="close" size={20} color={COLORS.tertiary} />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {topicSlug ? (
        <View style={styles.topicScopeBar}>
          <Text style={styles.topicScopeText} numberOfLines={1}>
            {t("search.withinTopic", "Searching within this topic")}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={flatData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={
          flatData.length === 0
            ? { flexGrow: 1 }
            : { paddingBottom: insets.bottom + 24 }
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.m,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
  },
  searchWrap: {
    flex: 1,
    marginHorizontal: SPACING.m,
  },
  input: {},
  headerSpacer: {
    width: headerIconCircleSize + headerIconCircleMarginH * 2,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  topicScopeBar: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.hover,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  topicScopeText: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
});
