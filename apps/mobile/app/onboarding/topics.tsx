import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Text,
  View,
  Pressable,
  ScrollView,
  TextInput,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  api,
  setOnboardingStage,
  getImageUrl,
  getTopicRecentImageUri,
} from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopicCardSkeleton } from "../../components/LoadingSkeleton";

interface TopicRecentPost {
  id: string;
  title: string | null;
  bodyExcerpt: string;
  headerImageKey: string | null;
  author: { handle: string; displayName: string } | null;
  createdAt: string | null;
}

interface Topic {
  id: string;
  slug: string;
  title: string;
  description?: string;
  postCount?: number;
  followerCount?: number;
  isFollowing?: boolean;
  recentPostImageKey?: string | null;
  recentPostImageUrl?: string | null;
  headerImageKey?: string | null;
  imageKey?: string | null;
  recentPost?: TopicRecentPost | null;
}

// Deterministic muted color for topics without images
const TOPIC_BG_COLORS = [
  "#1a2744", // blue
  "#1a3a2a", // emerald
  "#2a1a44", // violet
  "#3a2a1a", // amber
  "#3a1a2a", // rose
  "#1a3a3a", // cyan
  "#2a1a3a", // fuchsia
  "#1a3a34", // teal
  "#3a2a1a", // orange
  "#1a1a3a", // indigo
];

function getTopicBgColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TOPIC_BG_COLORS[Math.abs(hash) % TOPIC_BG_COLORS.length];
}

function getTopicImageUri(topic: Topic): string | null {
  const rp = topic.recentPost;
  if (rp?.headerImageKey) return getImageUrl(rp.headerImageKey);
  if (topic.recentPostImageUrl) return topic.recentPostImageUrl;
  const topicAsRec = topic as unknown as Record<string, unknown>;
  const fromUtil = getTopicRecentImageUri(topicAsRec);
  if (fromUtil) return fromUtil;
  if (topic.recentPostImageKey) return getImageUrl(topic.recentPostImageKey);
  if (topic.headerImageKey) return getImageUrl(topic.headerImageKey);
  if (topic.imageKey) return getImageUrl(topic.imageKey);
  return null;
}

function getTopicExcerpt(topic: Topic): string | null {
  const rp = topic.recentPost;
  if (rp?.title?.trim()) return rp.title.trim();
  if (rp?.bodyExcerpt?.trim()) return rp.bodyExcerpt.trim();
  if (topic.description?.trim()) return topic.description.trim();
  return null;
}

export default function OnboardingTopicsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showError } = useToast();
  const insets = useSafeAreaInsets();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchResults, setSearchResults] = useState<Topic[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await api.get<Topic[] | { items?: Topic[] }>(
        "/explore/topics?sort=popular&limit=60",
      );
      const items = Array.isArray(data)
        ? data
        : Array.isArray((data as { items?: Topic[] }).items)
          ? (data as { items: Topic[] }).items
          : [];
      setTopics(items);
      const followed = new Set(
        items.filter((t) => t.isFollowing).map((t) => t.id),
      );
      setFollowing(followed);
    } catch (error) {
      if (__DEV__) console.error("Failed to load topics", error);
      showError(t("onboarding.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Server-side search for ALL topics
  const searchTopics = useCallback(async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const data = await api.get<{ hits?: Topic[] } | Topic[]>(
        `/search/topics?q=${encodeURIComponent(query.trim())}&limit=40`,
      );
      const hits = Array.isArray(data)
        ? data
        : (data as { hits?: Topic[] }).hits || [];
      setSearchResults(hits);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      clearTimeout(searchTimer.current);
      if (!value.trim() || value.trim().length < 2) {
        setSearchResults(null);
        setSearching(false);
        return;
      }
      setSearching(true);
      searchTimer.current = setTimeout(() => {
        searchTopics(value);
      }, 300);
    },
    [searchTopics],
  );

  const displayTopics = useMemo(() => {
    if (searchResults !== null) return searchResults;
    if (!search.trim()) return topics;
    const q = search.toLowerCase().trim();
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description?.toLowerCase().includes(q) ?? false),
    );
  }, [topics, search, searchResults]);

  const toggleFollow = async (topic: Topic) => {
    const isFollowing = following.has(topic.id);
    const newFollowing = new Set(following);
    if (isFollowing) {
      newFollowing.delete(topic.id);
    } else {
      newFollowing.add(topic.id);
    }
    setFollowing(newFollowing);

    try {
      const slugEnc = encodeURIComponent(topic.slug);
      if (isFollowing) {
        await api.delete(`/topics/${slugEnc}/follow`);
      } else {
        await api.post(`/topics/${slugEnc}/follow`);
      }
    } catch (error) {
      setFollowing(following);
      if (__DEV__) console.error("Follow toggle failed", error);
    }
  };

  const handleNext = async () => {
    Keyboard.dismiss();
    await setOnboardingStage("profile");
    router.push("/onboarding/profile");
  };

  const footerHeight = 56 + SPACING.l * 2 + 20 + insets.bottom;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Step dots */}
      <View style={styles.header}>
        <View style={styles.stepIndicator}>
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: footerHeight + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>What are you interested in?</Text>
        <Text style={styles.subtitle}>
          Follow topics to fill your feed with ideas you care about. Every post
          tagged to a topic you follow will appear in your timeline.
        </Text>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <MaterialIcons
            name="search"
            size={18}
            color={COLORS.tertiary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics..."
            placeholderTextColor={COLORS.tertiary}
            value={search}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => handleSearchChange("")}
              hitSlop={12}
              style={styles.searchClear}
            >
              <MaterialIcons name="close" size={16} color={COLORS.tertiary} />
            </Pressable>
          )}
        </View>

        {/* Selection count + search indicator */}
        <View style={styles.statusRow}>
          {following.size > 0 ? (
            <Text style={styles.selectionCountText}>
              {following.size} topic{following.size !== 1 ? "s" : ""} selected
            </Text>
          ) : (
            <View />
          )}
          {searching && (
            <View style={styles.searchingRow}>
              <ActivityIndicator size="small" color={COLORS.tertiary} />
              <Text style={styles.searchingText}>Searching...</Text>
            </View>
          )}
          {search.trim().length >= 2 &&
            searchResults !== null &&
            !searching && (
              <Text style={styles.resultCountText}>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </Text>
            )}
        </View>

        {loading ? (
          <View style={{ marginTop: 24 }}>
            <TopicCardSkeleton />
            <TopicCardSkeleton />
            <TopicCardSkeleton />
            <TopicCardSkeleton />
          </View>
        ) : displayTopics.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search.trim()
                ? `No topics matching "${search}"`
                : "No topics available yet."}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {displayTopics.map((topic) => {
              const isFollowed = following.has(topic.id);
              const imageUri = getTopicImageUri(topic);
              const excerpt = getTopicExcerpt(topic);
              const bgColor = getTopicBgColor(topic.title);

              return (
                <Pressable
                  key={topic.id}
                  onPress={() => toggleFollow(topic)}
                  style={({ pressed }: { pressed: boolean }) => [
                    styles.card,
                    isFollowed && styles.cardFollowed,
                    pressed && { opacity: 0.85 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${isFollowed ? "Unfollow" : "Follow"} ${topic.title}`}
                >
                  {/* Image or color fallback */}
                  <View style={styles.cardImage}>
                    {imageUri ? (
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.cardImageFull}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <View
                        style={[
                          styles.cardImageFallback,
                          { backgroundColor: bgColor },
                        ]}
                      >
                        <Text style={styles.cardImageFallbackText}>#</Text>
                      </View>
                    )}

                    {/* Check mark */}
                    {isFollowed && (
                      <View style={styles.checkBadge}>
                        <MaterialIcons
                          name="check"
                          size={14}
                          color={COLORS.paper}
                        />
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.cardContent}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardHash}>#</Text>
                      <Text
                        style={[
                          styles.cardTitle,
                          isFollowed && { color: COLORS.primary },
                        ]}
                        numberOfLines={1}
                      >
                        {topic.title}
                      </Text>
                    </View>

                    {excerpt && (
                      <Text style={styles.cardExcerpt} numberOfLines={1}>
                        {excerpt}
                      </Text>
                    )}

                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {topic.postCount
                        ? `${topic.postCount} post${topic.postCount !== 1 ? "s" : ""}`
                        : ""}
                      {topic.postCount && topic.followerCount ? " \u00B7 " : ""}
                      {topic.followerCount
                        ? `${topic.followerCount} follower${topic.followerCount !== 1 ? "s" : ""}`
                        : ""}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Fixed footer */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.l }]}
      >
        <Pressable
          style={[
            styles.button,
            (loading || following.size < 3) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={loading || following.size < 3}
          accessibilityRole="button"
          accessibilityLabel={t("common.continue")}
        >
          <Text style={styles.buttonText}>
            {following.size >= 3
              ? `Continue with ${following.size} topics`
              : `Select at least 3 topics (${following.size}/3)`}
          </Text>
          <MaterialIcons
            name="arrow-forward"
            size={HEADER.iconSize}
            color={COLORS.paper}
          />
        </Pressable>
        <Text style={styles.footerHint}>
          You can always change your topic follows later in Settings.
        </Text>
      </View>
    </View>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  header: {
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    alignItems: "center",
    height: 44,
    justifyContent: "center",
  },
  stepIndicator: {
    flexDirection: "row",
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.divider,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  content: {
    paddingHorizontal: SPACING.l,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.s,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginBottom: SPACING.l,
    lineHeight: 22,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.s,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
    letterSpacing: 0,
  },
  searchClear: {
    padding: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },
  selectionCountText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  searchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  searchingText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  resultCountText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.m,
  },
  card: {
    width: "48%",
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    backgroundColor: COLORS.hover,
    overflow: "hidden",
  },
  cardFollowed: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  cardImage: {
    width: "100%",
    height: 70,
    position: "relative",
  },
  cardImageFull: {
    width: "100%",
    height: "100%",
  },
  cardImageFallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  cardImageFallbackText: {
    fontSize: 32,
    fontWeight: "700",
    color: "rgba(255,255,255,0.08)",
    fontFamily: FONTS.semiBold,
  },
  checkBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: SPACING.m,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  cardHash: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  cardExcerpt: {
    fontSize: 11,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 15,
  },
  cardMeta: {
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.l,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.s,
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: SIZES.borderRadius,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  footerHint: {
    fontSize: 12,
    color: COLORS.tertiary,
    textAlign: "center",
    marginTop: SPACING.m,
    fontFamily: FONTS.regular,
  },
});
