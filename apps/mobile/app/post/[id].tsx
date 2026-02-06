import React, { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
  Share,
  Animated,
  type ViewProps,
  type ScrollViewProps,
  type ViewStyle,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, getWebAppBaseUrl, getAvatarUri } from "../../utils/api";
import { useAuth } from "../../context/auth";
import { useToast } from "../../context/ToastContext";
import { useOpenExternalLink } from "../../hooks/useOpenExternalLink";
import { ConfirmModal } from "../../components/ConfirmModal";
import { OptionsActionSheet } from "../../components/OptionsActionSheet";
import { SourceOrPostCard } from "../../components/SourceOrPostCard";
import { PostItem } from "../../components/PostItem";
import { PostContent } from "../../components/PostContent";
import { MarkdownText } from "../../components/MarkdownText";
import { ScreenHeader } from "../../components/ScreenHeader";
import { HeaderIconButton } from "../../components/HeaderIconButton";

import { FullScreenSkeleton } from "../../components/LoadingSkeleton";
import { Post } from "../../types";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
  toDimensionValue,
} from "../../constants/theme";

const AnimatedScrollView = Animated.ScrollView as (
  props: ScrollViewProps & { style?: ViewStyle },
) => React.ReactElement | null;
const AnimatedView = Animated.View as (
  props: ViewProps & { style?: ViewStyle },
) => React.ReactElement | null;

export default function PostDetailScreen() {
  const { id, highlightReplyId } = useLocalSearchParams<{
    id: string;
    highlightReplyId?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { userId } = useAuth();
  const { showSuccess, showError } = useToast();
  const { openExternalLink } = useOpenExternalLink();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Post[]>([]);
  const [referencedBy, setReferencedBy] = useState<Post[]>([]);
  const [sources, setSources] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"sources" | "cited">("sources");

  // Interaction state
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    targetId: string;
    type: "POST" | "REPLY";
  } | null>(null);
  const [postOptionsVisible, setPostOptionsVisible] = useState(false);
  const [replyOptionsVisible, setReplyOptionsVisible] = useState(false);
  const [replyOptionsReplyId, setReplyOptionsReplyId] = useState<string | null>(
    null,
  );
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedAuthor, setDeniedAuthor] = useState<{
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string | null;
  } | null>(null);

  // Merge API sources (posts, topics, users/mentions, external) with external links from body; deduplicate
  const mergedSources = useMemo(() => {
    const apiExternal = sources.filter((s: Record<string, unknown>) => s.type === "external");
    const apiOther = sources.filter((s: Record<string, unknown>) => s.type !== "external");
    const urlSeen = new Set(apiExternal.map((s: Record<string, unknown>) => s.url).filter(Boolean));
    const fromBody: { url: string; title: string | null }[] = [];
    if (post?.body) {
      const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
      let m;
      while ((m = linkRegex.exec(post.body)) !== null) {
        const a = (m[1] ?? "").trim();
        const b = (m[2] ?? "").trim();
        const isUrl = (s: string) => /^https?:\/\//i.test(s);
        const url = isUrl(b) ? b : isUrl(a) ? a : null;
        const title = isUrl(b) ? a || null : isUrl(a) ? b || null : null;
        if (url && !urlSeen.has(url)) {
          urlSeen.add(url);
          fromBody.push({ url, title });
        }
      }
    }
    const combined = [
      ...apiExternal,
      ...fromBody.map(({ url, title }) => ({
        type: "external" as const,
        url,
        title,
      })),
      ...apiOther,
    ];
    // Deduplicate by canonical key (API already dedupes; body links can duplicate API external)
    const seen = new Set<string>();
    return combined.filter((s: Record<string, unknown>) => {
      const key =
        s.type === "external"
          ? (s.url ?? s.id)
          : s.type === "post"
            ? s.id
            : s.type === "user"
              ? (s.handle ?? s.id)
              : s.type === "topic"
                ? (s.slug ?? s.id)
                : `${s.type}-${s.id ?? s.url ?? s.handle ?? s.slug}`;
      const keyStr = String(key ?? "");
      if (seen.has(keyStr)) return false;
      seen.add(keyStr);
      return true;
    });
  }, [sources, post?.body]);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const STICKY_HEADER_APPEAR = 120;
  const STICKY_FADE_RANGE = 80;
  const overlayBarOpacity = useMemo(
    () =>
      scrollY.interpolate({
        inputRange: [0, STICKY_HEADER_APPEAR],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [scrollY],
  );
  const stickyBarOpacity = useMemo(
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

  const [highlightY, setHighlightY] = useState<number | null>(null);
  const repliesSectionY = useRef(0);

  useEffect(() => {
    if (highlightY !== null && scrollViewRef.current) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: highlightY, animated: true });
      }, 500); // Slight delay for layout to settle
      return () => clearTimeout(timer);
    }
  }, [highlightY]);


  useEffect(() => {
    if (!id) return;

    // Track view
    api.post(`/posts/${id}/view`).catch(() => { /* view tracking best-effort */ });

    // Track read time on unmount
    const startTime = Date.now();
    return () => {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      if (duration > 5) {
        api.post(`/posts/${id}/read-time`, { duration }).catch(() => { /* read-time tracking best-effort */ });
      }
    };
  }, [id]);

  const loadIdRef = useRef(0);
  const loadPost = useCallback(async () => {
    setAccessDenied(false);
    setDeniedAuthor(null);
    const loadId = loadIdRef.current + 1;
    loadIdRef.current = loadId;
    try {
      // Step 1: Load main post content first for instant display
      const postRes = await api.get<Post>(`/posts/${id}`);
      if (loadIdRef.current !== loadId) return;
      setPost(postRes);
      const pr = postRes as unknown as Record<string, unknown>;
      setLiked(!!pr?.isLiked);
      setKept(!!pr?.isKept);
      setLoading(false);

      // Step 2: Load supplementary data in background (skip for deleted posts)
      if (!pr?.deletedAt) {
        Promise.all([
          api.get(`/posts/${id}/replies`),
          api.get(`/posts/${id}/referenced-by`),
          api.get(`/posts/${id}/sources`),
        ]).then(([repliesRes, referencedRes, sourcesRes]) => {
          if (loadIdRef.current !== loadId) return;
          setReplies(Array.isArray(repliesRes) ? repliesRes : []);
          setReferencedBy(Array.isArray(referencedRes) ? referencedRes : []);
          setSources(Array.isArray(sourcesRes) ? sourcesRes : []);
        });
      }
    } catch (error: unknown) {
      if (loadIdRef.current !== loadId) return;
      setLoading(false);
      setPost(null);
      const err = error as { status?: number; data?: { author?: unknown } };
      if (err?.status === 403 && err?.data?.author) {
        setAccessDenied(true);
        setDeniedAuthor(
          err.data.author as {
            id: string;
            handle: string;
            displayName: string;
            avatarKey?: string | null;
          },
        );
        return;
      }
      if (err?.status === 404) {
        showError(
          t("post.notFoundMessage", "This post doesn't exist anymore."),
        );
        router.back();
        return;
      }
    }
  }, [id, t]);

  // Load post when screen mounts or id changes (e.g. navigating from Cited by to another post)
  useEffect(() => {
    if (id) loadPost();
  }, [id, loadPost]);

  const handleLike = useCallback(async () => {
    if (!userId) {
      router.replace("/welcome");
      return;
    }
    const previous = liked;
    setLiked(!previous);
    try {
      if (previous) {
        await api.delete(`/posts/${id}/like`);
      } else {
        await api.post(`/posts/${id}/like`);
      }
    } catch (error) {
      setLiked(previous);
      // console.error('Failed to toggle like', error);
    }
  }, [liked, post, id, userId, router]);

  const handleKeep = useCallback(async () => {
    if (!userId) {
      router.replace("/welcome");
      return;
    }
    const previous = kept;
    setKept(!previous);
    try {
      if (previous) {
        await api.delete(`/posts/${id}/keep`);
      } else {
        await api.post(`/posts/${id}/keep`);
      }
    } catch (error) {
      setKept(previous);
      // console.error('Failed to toggle keep', error);
    }
  }, [kept, post, id, userId, router]);

  const handleReport = (targetId: string, type: "POST" | "REPLY") =>
    setReportTarget({ targetId, type });

  const confirmReport = async () => {
    if (!reportTarget) return;
    try {
      await api.post("/safety/report", {
        targetId: reportTarget.targetId,
        targetType: reportTarget.type,
        reason: "Reported via mobile app detail view",
      });
      showSuccess(t("post.reportSuccess", "Content reported successfully"));
    } catch (error) {
      showError(t("post.reportError", "Failed to report content"));
      throw error;
    }
  };

  const handleShare = useCallback(async () => {
    if (!post) return;
    const url = `${getWebAppBaseUrl()}/post/${post.id}`;
    try {
      await Share.share({
        message: `Check out this post by @${post.author.handle}: ${url}`,
        url, // iOS
      });
    } catch (error) {
      // console.error(error);
    }
  }, [post]);

  const handlePostMenu = useCallback(() => setPostOptionsVisible(true), []);

  const handleDeletePost = async () => {
    try {
      await api.delete(`/posts/${id}`);
      showSuccess(t("post.deleted", "Post deleted"));
      setDeleteConfirmVisible(false);
      setPostOptionsVisible(false);
      router.back();
    } catch (error: unknown) {
      showError(
        (error as { message?: string })?.message || t("post.deleteFailed", "Failed to delete post"),
      );
      throw error;
    }
  };

  const isOwnPost = !!post && !!userId && post.author?.id === userId;

  const handleReplyMenu = useCallback((replyId: string) => {
    setReplyOptionsReplyId(replyId);
    setReplyOptionsVisible(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPost();
    setRefreshing(false);
  }, [id, loadPost]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.thread")} paddingTop={insets.top} />
        <View style={styles.center}>
          <FullScreenSkeleton />
        </View>
      </View>
    );
  }

  // Deleted: show placeholder before private (API returns viewerCanSeeContent false for both)
  if (post?.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.thread")} paddingTop={insets.top} />
        <View style={styles.deletedPlaceholder}>
          <MaterialIcons
            name="delete-outline"
            size={48}
            color={COLORS.tertiary}
            style={styles.deletedPlaceholderIcon}
          />
          <Text style={styles.deletedPlaceholderText}>
            {t("post.deletedOn", {
              date: formattedDate,
              defaultValue: `This post has been deleted on ${formattedDate}.`,
            })}
          </Text>
        </View>
      </View>
    );
  }

  // Private post: 403 with author, or 200 with viewerCanSeeContent false AND we have author (so it's clearly a private post, not e.g. cached/stale)
  const showPrivateOverlay =
    (accessDenied && deniedAuthor) ||
    (post != null &&
      post.viewerCanSeeContent === false &&
      (deniedAuthor != null ||
        (post.author != null &&
          (post.author.handle != null || post.author.id != null))));
  const privateAuthor =
    deniedAuthor ??
    (post?.author
      ? {
        id: post.author.id,
        handle: post.author.handle ?? "",
        displayName: post.author.displayName ?? "",
        avatarKey: post.author.avatarKey ?? null,
      }
      : null);

  if (showPrivateOverlay) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.thread")} paddingTop={insets.top} />
        <View style={styles.privatePostOverlay}>
          <View style={styles.privatePostBlur}>
            <MaterialIcons name="lock" size={48} color={COLORS.tertiary} />
            <Text style={styles.privatePostTitle}>
              {t("post.privatePost", "This is a private post")}
            </Text>
            <Text style={styles.privatePostSubtext}>
              {t(
                "post.privatePostSubtext",
                "Only followers can see this post. Follow the author to request access.",
              )}
            </Text>
          </View>
          {privateAuthor != null ? (
            <Pressable
              style={styles.privatePostAuthorCard}
              onPress={() =>
                privateAuthor.handle &&
                router.push(`/user/${privateAuthor.handle}`)
              }
            >
              {getAvatarUri({ avatarKey: privateAuthor.avatarKey }) ? (
                <Image
                  source={{
                    uri: getAvatarUri({ avatarKey: privateAuthor.avatarKey })!,
                  }}
                  style={styles.privatePostAuthorAvatar}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.privatePostAuthorAvatarPlaceholder}>
                  <Text style={styles.privatePostAuthorInitial}>
                    {(privateAuthor.displayName || privateAuthor.handle || "?")
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.privatePostAuthorInfo}>
                <Text style={styles.privatePostAuthorName} numberOfLines={1}>
                  {privateAuthor.displayName || privateAuthor.handle}
                </Text>
                <Text style={styles.privatePostAuthorHandle} numberOfLines={1}>
                  @{privateAuthor.handle}
                </Text>
              </View>
              <Text style={styles.privatePostFollowCta}>
                {t("profile.follow", "Follow")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.thread")} paddingTop={insets.top} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{t("post.noPost")}</Text>
        </View>
      </View>
    );
  }

  // Content hidden but no author (e.g. cached/stale response or token not sent): offer retry instead of "private post"
  if (post.viewerCanSeeContent === false && !showPrivateOverlay) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.thread")} paddingTop={insets.top} />
        <View
          style={[
            styles.center,
            { paddingHorizontal: LAYOUT.contentPaddingHorizontal },
          ]}
        >
          <MaterialIcons
            name="refresh"
            size={48}
            color={COLORS.tertiary}
            style={{ marginBottom: SPACING.l }}
          />
          <Text style={[styles.errorText, { marginBottom: SPACING.m }]}>
            {t(
              "post.contentUnavailable",
              "Content could not be loaded. If this post is visible in your feed, try again.",
            )}
          </Text>
          <Pressable
            onPress={() => loadPost()}
            style={({ pressed }: { pressed: boolean }) => [
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text
              style={{
                color: COLORS.primary,
                fontSize: 16,
                fontFamily: FONTS.semiBold,
              }}
            >
              {t("common.retry", "Retry")}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Overlay bar: fades out on scroll (like topic) */}
        <AnimatedView
          style={[
            styles.overlayBar,
            { paddingTop: Math.max(8, insets.top - 20), opacity: overlayBarOpacity },
          ]}
          pointerEvents="box-none"
        >
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back", "Back")}
          />
          <View style={styles.overlayBarSpacer} />
          <HeaderIconButton
            onPress={handlePostMenu}
            icon="more-horiz"
            accessibilityLabel={t("profile.options", "Options")}
          />
        </AnimatedView>

        {/* Sticky bar: fades in on scroll (reveal like topic) */}
        <AnimatedView
          style={[
            styles.stickyBar,
            { paddingTop: Math.max(8, insets.top - 20), opacity: stickyBarOpacity },
          ]}
          pointerEvents="box-none"
        >
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back", "Back")}
          />
          <View style={styles.overlayBarSpacer} />
          <HeaderIconButton
            onPress={handlePostMenu}
            icon="more-horiz"
            accessibilityLabel={t("profile.options", "Options")}
          />
        </AnimatedView>

        <AnimatedScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          style={styles.container}
          contentContainerStyle={[
            styles.postScrollContent,
            {
              paddingTop: Math.max(8, insets.top - 20) + 56,
            },
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.postContent}>
            <PostContent
              post={post}
              disableNavigation
              referenceMetadata={post.referenceMetadata}
            />

            <View style={styles.stats}>
              <Text style={styles.stat}>
                {post.replyCount} {t("post.replies")}
              </Text>
              <Text style={styles.stat}>
                {post.quoteCount} {t("post.quotes")}
              </Text>
              {post.readingTimeMinutes ? (
                <Text style={styles.stat}>
                  {post.readingTimeMinutes} {t("post.minRead", "min read")}
                </Text>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.actionButton}
                onPress={() => router.push(`/post/${post.id}/reading`)}
                accessibilityLabel={t("post.readArticle", "Read article")}
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="menu-book"
                  size={HEADER.iconSize}
                  color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>
                  {t("post.readArticle", "Read")}
                </Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (!userId) {
                    router.replace("/welcome");
                    return;
                  }
                  router.push({
                    pathname: "/post/compose",
                    params: { replyTo: post.id },
                  });
                }}
                accessibilityLabel={t("post.reply")}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>{t("post.reply")}</Text>
              </Pressable>
              <Pressable
                style={styles.actionButton}
                onPress={() => {
                  if (!userId) {
                    router.replace("/welcome");
                    return;
                  }
                  router.push({
                    pathname: "/post/compose",
                    params: { quote: post.id },
                  });
                }}
                accessibilityLabel={t("post.quote")}
                accessibilityRole="button"
              >
                <Text style={styles.actionButtonText}>{t("post.quote")}</Text>
              </Pressable>
            </View>
          </View>

          {/* Tabs: Sources | Cited by | Graph */}
          <View style={styles.tabSection}>
            <View style={styles.tabsRow}>
              <Pressable
                style={[styles.tabBtn, activeTab === "sources" && styles.tabBtnActive]}
                onPress={() => setActiveTab("sources")}
                accessibilityLabel={t("post.sources", "Sources")}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "sources" }}
              >
                <Text style={[styles.tabBtnText, activeTab === "sources" && styles.tabBtnTextActive]}>
                  {t("post.sources", "Sources")} {mergedSources.length > 0 ? `(${mergedSources.length})` : ""}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, activeTab === "cited" && styles.tabBtnActive]}
                onPress={() => setActiveTab("cited")}
                accessibilityLabel={t("post.quotedBy", "Cited by")}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "cited" }}
              >
                <Text style={[styles.tabBtnText, activeTab === "cited" && styles.tabBtnTextActive]}>
                  {t("post.quotedBy", "Cited by")} {referencedBy.length > 0 ? `(${referencedBy.length})` : ""}
                </Text>
              </Pressable>
            </View>

            {activeTab === "sources" ? (
              mergedSources.length === 0 ? (
                <Text style={styles.emptyTabText}>
                  {t("post.noSources", "No external sources.")}
                </Text>
              ) : (
                <View style={styles.sourcesList}>
                  {mergedSources.map((source: Record<string, unknown>, index: number) => {
                    const title =
                      String(source.alias ?? source.title ?? source.handle ?? source.url ?? source.slug ?? "");
                    const subtitle =
                      source.type === "external" && typeof source.url === "string"
                        ? typeof source.description === "string" && source.description.trim()
                          ? source.description.trim()
                          : (() => {
                            try {
                              return new URL(source.url).hostname.replace(
                                "www.",
                                "",
                              );
                            } catch {
                              return "";
                            }
                          })()
                        : source.type === "user" && typeof source.handle === "string"
                          ? `@${source.handle}`
                          : source.type === "topic"
                            ? t("post.topic", "Topic")
                            : "";
                    return (
                      <SourceOrPostCard
                        key={
                          source.type === "external" && typeof source.url === "string"
                            ? `ext-${source.url}`
                            : (typeof source.id === "string" ? source.id : `i-${index}`)
                        }
                        type={source.type}
                        title={title}
                        subtitle={subtitle || undefined}
                        onPress={() => {
                          if (source.type === "external" && typeof source.url === "string") {
                            openExternalLink(source.url);
                          } else if (source.type === "post" && typeof source.id === "string") {
                            router.push(`/post/${source.id}`);
                          } else if (source.type === "topic") {
                            router.push(
                              `/topic/${encodeURIComponent(String(source.slug ?? source.title ?? source.id ?? ""))}`,
                            );
                          } else if (source.type === "user" && typeof source.handle === "string") {
                            router.push(`/user/${source.handle}`);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              )
            ) : (
              referencedBy.length === 0 ? (
                <Text style={styles.emptyTabText}>
                  {t("post.noQuotes", "No citations yet.")}
                </Text>
              ) : (
                <View style={styles.sourcesList}>
                  {referencedBy.map((refPost) => {
                    const bodyPreview = (refPost.body ?? "")
                      .replace(/\s+/g, " ")
                      .trim()
                      .slice(0, 80);
                    const title = refPost.title ?? (bodyPreview || t("post.fallbackTitle", "Post"));
                    const subtitle =
                      refPost.author?.displayName || refPost.author?.handle || "";
                    const targetId = refPost.id;
                    return (
                      <SourceOrPostCard
                        key={targetId ?? refPost.createdAt ?? Math.random()}
                        type="post"
                        title={title}
                        subtitle={subtitle || undefined}
                        onPress={() => {
                          if (targetId) {

                            router.push(`/post/${targetId}`);
                          }
                        }}
                      />
                    );
                  })}
                </View>
              )
            )}
          </View>

          <View
            style={styles.section}
            onLayout={(event: { nativeEvent: { layout: { y: number } } }) => {
              repliesSectionY.current = event.nativeEvent.layout.y;
            }}
          >
            <Pressable
              onPress={() => router.push(`/post/${id}/comments`)}
              style={styles.sectionHeader}
              accessibilityLabel={t("post.comments", "Comments")}
              accessibilityRole="button"
            >
              <Text style={styles.sectionTitle}>
                {t("post.comments", "Comments")}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: SPACING.s,
                }}
              >
                <Text style={styles.sectionCount}>
                  {replies.length}{" "}
                  {replies.length === 1
                    ? t("post.replies_one", "reply")
                    : t("post.replies", "replies")}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={HEADER.iconSize}
                  color={COLORS.tertiary}
                />
              </View>
            </Pressable>
            {replies.map((reply) => (
              <View
                key={reply.id}
                onLayout={(event: { nativeEvent: { layout: { y: number } } }) => {
                  if (highlightReplyId === reply.id) {
                    const itemY = event.nativeEvent.layout.y;
                    const totalY = repliesSectionY.current + itemY;
                    setHighlightY(totalY);
                  }
                }}
                style={[
                  styles.replyItem,
                  highlightReplyId === reply.id && {
                    backgroundColor: COLORS.hover,
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                  },
                ]}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={styles.authorRow}>
                    <View style={styles.avatarSmall}>
                      <Text style={styles.avatarTextSmall}>
                        {reply.author.displayName.charAt(0)}
                      </Text>
                    </View>
                    <Text style={styles.displayNameSmall}>
                      {reply.author.displayName}
                    </Text>
                    <Text style={styles.handleSmall}>@{reply.author.handle}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleReplyMenu(reply.id)}
                    hitSlop={10}
                    accessibilityLabel={t("post.options", "Reply options")}
                    accessibilityRole="button"
                  >
                    <MaterialIcons
                      name="more-horiz"
                      size={HEADER.iconSize}
                      color={COLORS.tertiary}
                    />
                  </Pressable>
                </View>
                <View style={{ marginTop: 4 }}>
                  <MarkdownText>{reply.body}</MarkdownText>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.bottomActions}>
            <Pressable
              style={styles.bottomActionButton}
              onPress={() => {
                if (!userId) {
                  router.replace("/welcome");
                  return;
                }
                router.push({
                  pathname: "/post/compose",
                  params: { replyTo: post.id },
                });
              }}
              accessibilityLabel={t("post.reply")}
              accessibilityRole="button"
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={HEADER.iconSize}
                color={COLORS.tertiary}
              />
              <Text style={styles.bottomActionText}>{t("post.reply")}</Text>
            </Pressable>
            <Pressable
              style={styles.bottomActionButton}
              onPress={() => {
                if (!userId) {
                  router.replace("/welcome");
                  return;
                }
                router.push({
                  pathname: "/post/compose",
                  params: { quote: post.id },
                });
              }}
              accessibilityLabel={t("post.quote")}
              accessibilityRole="button"
            >
              <MaterialIcons
                name="format-quote"
                size={HEADER.iconSize}
                color={COLORS.tertiary}
              />
              <Text style={styles.bottomActionText}>{t("post.quote")}</Text>
            </Pressable>
            <Pressable
              style={styles.bottomActionButton}
              onPress={handleLike}
              accessibilityLabel={liked ? t("post.liked") : t("post.like")}
              accessibilityRole="button"
            >
              <MaterialIcons
                name={liked ? "favorite" : "favorite-border"}
                size={HEADER.iconSize}
                color={liked ? COLORS.like || COLORS.primary : COLORS.tertiary}
              />
              <Text
                style={[
                  styles.bottomActionText,
                  liked && { color: COLORS.like || COLORS.primary },
                ]}
              >
                {liked ? t("post.liked") : t("post.like")}
              </Text>
            </Pressable>
            <Pressable
              style={styles.bottomActionButton}
              onPress={handleKeep}
              accessibilityLabel={kept ? t("post.kept") : t("post.keep")}
              accessibilityRole="button"
            >
              <MaterialIcons
                name={kept ? "bookmark" : "bookmark-border"}
                size={HEADER.iconSize}
                color={kept ? COLORS.primary : COLORS.tertiary}
              />
              <Text
                style={[
                  styles.bottomActionText,
                  kept && { color: COLORS.primary },
                ]}
              >
                {kept ? t("post.kept") : t("post.keep")}
              </Text>
            </Pressable>
            {!post?.author?.isProtected && (
              <Pressable
                style={styles.bottomActionButton}
                onPress={handleShare}
                accessibilityLabel={t("post.share")}
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="ios-share"
                  size={HEADER.iconSize}
                  color={COLORS.tertiary}
                />
                <Text style={styles.bottomActionText}>{t("post.share")}</Text>
              </Pressable>
            )}
          </View>
        </AnimatedScrollView>
      </View>

      <ConfirmModal
        visible={!!reportTarget}
        title={t("post.reportTitle", "Report Content")}
        message={t(
          "post.reportMessage",
          "Are you sure you want to report this content?",
        )}
        confirmLabel={t("post.report", "Report")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={confirmReport}
        onCancel={() => setReportTarget(null)}
      />
      <OptionsActionSheet
        visible={postOptionsVisible}
        title={t("post.options", "Post Options")}
        options={[
          ...(isOwnPost
            ? [
              {
                label: t("post.delete", "Delete Post"),
                onPress: () => {
                  setPostOptionsVisible(false);
                  setDeleteConfirmVisible(true);
                },
                destructive: true as const,
              },
            ]
            : []),
          {
            label: t("post.report", "Report Post"),
            onPress: () => {
              setPostOptionsVisible(false);
              handleReport(id as string, "POST");
            },
            destructive: true,
          },
        ]}
        cancelLabel={t("common.cancel")}
        onCancel={() => setPostOptionsVisible(false)}
      />
      <ConfirmModal
        visible={deleteConfirmVisible}
        title={t("post.delete", "Delete Post")}
        message={t(
          "post.deleteConfirm",
          "Are you sure you want to delete this post? This cannot be undone.",
        )}
        confirmLabel={t("post.delete", "Delete Post")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
      <OptionsActionSheet
        visible={replyOptionsVisible}
        title={t("post.options", "Reply Options")}
        options={
          replyOptionsReplyId
            ? [
              {
                label: t("post.report", "Report Reply"),
                onPress: () => {
                  setReplyOptionsVisible(false);
                  setReplyOptionsReplyId(null);
                  handleReport(replyOptionsReplyId, "REPLY");
                },
                destructive: true,
              },
            ]
            : []
        }
        cancelLabel={t("common.cancel")}
        onCancel={() => {
          setReplyOptionsVisible(false);
          setReplyOptionsReplyId(null);
        }}
      />
    </>
  );
}

const styles = createStyles({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  overlayBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    zIndex: 10,
  },
  overlayBarSpacer: {
    flex: 1,
  },
  stickyBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    zIndex: 11,
  },
  postScrollContent: {},
  privatePostOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  privatePostBlur: {
    backgroundColor: COLORS.overlayHeavy,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.xxl,
    alignItems: "center",
    marginBottom: SPACING.xl,
    minWidth: "100%",
  },
  privatePostTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: SPACING.l,
  },
  privatePostSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: SPACING.s,
    textAlign: "center",
  },
  privatePostAuthorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    width: "100%",
    gap: SPACING.m,
  },
  privatePostAuthorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  privatePostAuthorAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.badge,
    justifyContent: "center",
    alignItems: "center",
  },
  privatePostAuthorInitial: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  privatePostAuthorInfo: { flex: 1, minWidth: 0 },
  privatePostAuthorName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  privatePostAuthorHandle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  privatePostFollowCta: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  placeholder: {
    width: SIZES.iconLarge,
  },
  postContent: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.l,
  },
  avatar: {
    width: 48, // h-12 w-12
    height: 48,
    borderRadius: 24, // rounded-full
    backgroundColor: COLORS.hover, // bg-primary/20
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  displayName: {
    fontSize: 17,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  handle: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.serifSemiBold, // IBM Plex Serif for content
  },
  stats: {
    flexDirection: "row",
    gap: SPACING.l,
    marginTop: SPACING.l,
    marginBottom: SPACING.l,
  },
  stat: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  actions: {
    flexDirection: "row",
    gap: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  actionButton: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadiusPill,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  tabSection: {
    paddingVertical: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  tabsRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    marginBottom: SPACING.m,
  },
  tabBtn: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    marginRight: SPACING.m,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabBtnText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.medium,
  },
  tabBtnTextActive: {
    color: COLORS.paper,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  emptyTabText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: "italic",
    paddingVertical: SPACING.l,
  },
  section: {
    paddingVertical: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  sectionCount: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  sourcesList: {
    gap: SPACING.s,
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
  sourceNumber: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    minWidth: 20,
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
  sourceContent: {
    flex: 1,
    gap: 2,
  },
  sourceDomain: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  sourceTitle: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
  },
  sourceDescription: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  viewAllButton: {
    padding: SPACING.m,
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    backgroundColor: COLORS.ink,
  },
  bottomActionButton: {
    alignItems: "center",
    gap: 4,
  },
  bottomActionText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  replyItem: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  avatarSmall: {
    width: 32, // h-8 w-8
    height: 32,
    borderRadius: 16, // rounded-full
    backgroundColor: COLORS.hover, // bg-primary/20
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.s,
  },
  avatarTextSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  displayNameSmall: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    marginRight: 4,
    fontFamily: FONTS.semiBold,
  },
  handleSmall: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  replyBody: {
    fontSize: 16,
    color: COLORS.secondary,
    lineHeight: 24,
    marginTop: 4,
    fontFamily: FONTS.serifRegular, // IBM Plex Serif for content
  },
  loadingText: {
    color: COLORS.tertiary,
    textAlign: "center",
    marginTop: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  errorText: {
    color: COLORS.error,
    textAlign: "center",
    marginTop: SPACING.xl,
    fontFamily: FONTS.regular,
  },
  deletedPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  deletedPlaceholderIcon: {
    marginBottom: SPACING.l,
  },
  deletedPlaceholderText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    textAlign: "center",
    marginBottom: SPACING.xl,
  },
});
