import { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, RefreshControl } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { api } from "../../../utils/api";
import {
  COLORS,
  SPACING,
  FONTS,
  LAYOUT,
  createStyles,
  FLATLIST_DEFAULTS,
} from "../../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { SourceOrPostCard } from "../../../components/SourceOrPostCard";
import { CenteredEmptyState } from "../../../components/EmptyState";
import { ListFooterLoader } from "../../../components/ListFooterLoader";
import { FeedSkeleton } from "../../../components/LoadingSkeleton";
import { Post } from "../../../types";

export default function PostQuotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handlePostPress = (item: Post) => {
    if (item.title) router.push(`/post/${item.id}/reading`);
    else router.push(`/post/${item.id}`);
  };
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const postId = params.id as string;
  const [quotes, setQuotes] = useState<Post[]>([]);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (pageNum: number, reset = false) => {
      if (!postId) return;
      if (reset) {
        setLoading(true);
        // Fetch post details only once
        api
          .get<{ title?: string }>(`/posts/${postId}`)
          .then((data) => setPostTitle(data?.title ?? null));
      } else {
        setLoadingMore(true);
      }

      try {
        const res = await api.get<{ items: Post[]; hasMore: boolean } | Post[]>(
          `/posts/${postId}/referenced-by?page=${pageNum}&limit=20`,
        );
        const newItems = Array.isArray(res) ? res : res.items;
        const more = Array.isArray(res) ? false : res.hasMore;

        setQuotes((prev) => (reset ? newItems : [...prev, ...newItems]));
        setHasMore(more);
        setPage(pageNum);
      } catch (error) {
        console.error("Failed to load quotes", error);
        if (reset) setQuotes([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [postId],
  );

  useEffect(() => {
    load(1, true);
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load(1, true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      load(page + 1, false);
    }
  };

  if (loading && quotes.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <FeedSkeleton count={4} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={`${t("post.quotedBy", "Quoted by")} ${quotes.length > 0 ? `(${quotes.length})` : ""}`}
        paddingTop={insets.top}
      />
      {postTitle ? (
        <Text style={styles.postTitleLabel} numberOfLines={1}>
          {postTitle}
        </Text>
      ) : null}

      <FlatList
        data={quotes}
        keyExtractor={(item: Post) => item.id}
        renderItem={({ item }: { item: Post }) => {
          const bodyPreview = (item.body ?? "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);
          const title = item.title ?? (bodyPreview || "Post");
          const subtitle =
            item.author?.displayName || item.author?.handle || "";
          return (
            <View style={styles.itemWrap}>
              <SourceOrPostCard
                type="post"
                title={title}
                subtitle={subtitle || undefined}
                onPress={() => handlePostPress(item)}
              />
            </View>
          );
        }}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
          quotes.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <CenteredEmptyState
              icon="format-quote"
              headline={t(
                "post.noQuotesYet",
                "No one has quoted this post yet.",
              )}
            />
          ) : null
        }
        ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
        {...FLATLIST_DEFAULTS}
      />
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: {
    paddingTop: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  itemWrap: { marginBottom: SPACING.s },
  postTitleLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginBottom: SPACING.s,
    marginHorizontal: SPACING.xl,
    fontFamily: FONTS.regular,
  },
});
