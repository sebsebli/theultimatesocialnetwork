import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
  type ViewStyle,
} from "react-native";
import type { ScrollViewProps, ViewProps } from "react-native";

/** Typed Animated components for React 19 JSX compatibility */
const AnimatedScrollView = Animated.ScrollView as (
  props: ScrollViewProps & { style?: ViewStyle },
) => React.ReactElement | null;
const AnimatedView = Animated.View as (
  props: ViewProps & { style?: ViewStyle },
) => React.ReactElement | null;

import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useOpenExternalLink } from "../../../hooks/useOpenExternalLink";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import {
  api,
  getAvatarUri,
  getImageUrl,
  getPostHeaderImageUri,
} from "../../../utils/api";
import { MarkdownText } from "../../../components/MarkdownText";
import { PostAuthorHeader } from "../../../components/PostAuthorHeader";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
  toDimension,
  toDimensionValue,
} from "../../../constants/theme";
import { FullScreenSkeleton } from "../../../components/LoadingSkeleton";
const ACTION_ICON_SIZE = HEADER.iconSize;
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import AddToCollectionSheet, {
  AddToCollectionSheetRef,
} from "../../../components/AddToCollectionSheet";
import ShareSheet, { ShareSheetRef } from "../../../components/ShareSheet";
import { SourceOrPostCard } from "../../../components/SourceOrPostCard";

import { HeaderIconButton } from "../../../components/HeaderIconButton";
import { ReportModal } from "../../../components/ReportModal";
import { OptionsActionSheet } from "../../../components/OptionsActionSheet";
import { ConfirmModal } from "../../../components/ConfirmModal";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../../components/EmptyState";
import { useToast } from "../../../context/ToastContext";
import {
  savePostForOffline,
  removeOfflinePost,
  isPostDownloaded,
  getDownloadSavedForOffline,
  type OfflinePost,
} from "../../../utils/offlineStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Post {
  id: string;
  title?: string;
  body: string;
  createdAt: string;
  headerImageKey?: string | null;
  replyCount?: number;
  quoteCount?: number;
  readingTimeMinutes?: number;
  author?: {
    id?: string;
    displayName?: string;
    handle?: string;
    avatarUrl?: string | null;
    avatarKey?: string | null;
    isProtected?: boolean;
    bio?: string;
  };
  isLiked?: boolean;
  isKept?: boolean;
  lang?: string | null;
  referenceMetadata?: Record<string, { title?: string }>;
  deletedAt?: string;
  /** When false, viewer cannot see post body (e.g. FOLLOWERS-only and viewer doesn't follow). */
  viewerCanSeeContent?: boolean;
}

export default function ReadingModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const { showSuccess, showError } = useToast();
  const { openExternalLink } = useOpenExternalLink();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [sources, setSources] = useState<Record<string, unknown>[]>([]);
  const [quotedBy, setQuotedBy] = useState<Record<string, unknown>[]>([]);
  const [connections, setConnections] = useState<{
    buildsOn: Record<string, unknown>[];
    builtUponBy: Record<string, unknown>[];
    topics: Record<string, unknown>[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const collectionSheetRef = useRef<AddToCollectionSheetRef>(null);
  const shareSheetRef = useRef<ShareSheetRef>(null);
  const [reportVisible, setReportVisible] = useState(false);
  const [moreOptionsVisible, setMoreOptionsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [offlineEnabled, setOfflineEnabled] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedAuthor, setDeniedAuthor] = useState<{
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string | null;
  } | null>(null);

  const loadIdRef = useRef(0);
  const loadPost = useCallback(
    async (cancelledRef?: { current: boolean }) => {
      if (!postId) return;
      setLoading(true);
      setAccessDenied(false);
      setDeniedAuthor(null);
      const loadId = loadIdRef.current + 1;
      loadIdRef.current = loadId;
      try {
        const postData = await api.get<Post>(`/posts/${postId}`);
        if (cancelledRef?.current || loadIdRef.current !== loadId) return;
        setPost(postData);
        const pd = postData as unknown as Record<string, unknown>;
        setLiked(!!pd?.isLiked);
        setKept(!!pd?.isKept);
        if (!pd?.deletedAt) {
          const [
            sourcesData,
            quotesData,
            connectionsData,
            downloaded,
            enabled,
          ] = await Promise.all([
            api.get(`/posts/${postId}/sources`).catch(() => []),
            api.get(`/posts/${postId}/quotes`).catch(() => []),
            api
              .get<Record<string, unknown>>(`/posts/${postId}/connections`)
              .catch(() => null),
            isPostDownloaded(postId),
            getDownloadSavedForOffline(),
          ]);
          if (cancelledRef?.current || loadIdRef.current !== loadId) return;
          setSources(Array.isArray(sourcesData) ? sourcesData : []);
          setQuotedBy(
            Array.isArray(quotesData)
              ? quotesData
              : (((quotesData as Record<string, unknown>)
                  ?.items as unknown[]) ?? []),
          );
          if (connectionsData) {
            setConnections({
              buildsOn: Array.isArray(connectionsData.buildsOn)
                ? (connectionsData.buildsOn as Record<string, unknown>[])
                : [],
              builtUponBy: Array.isArray(connectionsData.builtUponBy)
                ? (connectionsData.builtUponBy as Record<string, unknown>[])
                : [],
              topics: Array.isArray(connectionsData.topics)
                ? (connectionsData.topics as Record<string, unknown>[])
                : [],
            });
          }
          setIsDownloaded(downloaded);
          setOfflineEnabled(enabled);
        }
      } catch (error: unknown) {
        if (cancelledRef?.current || loadIdRef.current !== loadId) return;
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
        } else {
          showError(t("post.loadFailed"));
        }
      } finally {
        if (!cancelledRef?.current && loadIdRef.current === loadId) {
          setLoading(false);
        }
      }
    },
    [postId, t],
  );

  useEffect(() => {
    let cancelled = false;
    const cancelledRef = { current: false };
    const load = async () => {
      await loadPost(cancelledRef);
    };
    load();
    return () => {
      cancelled = true;
      cancelledRef.current = true;
    };
  }, [loadPost]);

  // Merge API sources (posts, topics, users/mentions, external) with external links from body; deduplicate
  const sourcesUnique = useMemo(() => {
    const apiExternal = sources.filter(
      (s: Record<string, unknown>) => s.type === "external",
    );
    const apiOther = sources.filter(
      (s: Record<string, unknown>) => s.type !== "external",
    );
    const urlSeen = new Set(
      apiExternal.map((s: Record<string, unknown>) => s.url).filter(Boolean),
    );
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

  const handleLike = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const prev = liked;
    setLiked(!prev);
    try {
      if (prev) await api.delete(`/posts/${postId}/like`);
      else await api.post(`/posts/${postId}/like`);
    } catch {
      setLiked(prev);
    }
  }, [liked, post, postId]);

  const handleKeep = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const prev = kept;
    setKept(!prev);
    try {
      if (prev) await api.delete(`/posts/${postId}/keep`);
      else await api.post(`/posts/${postId}/keep`);
    } catch {
      setKept(prev);
    }
  }, [kept, post, postId]);

  const handleDownloadOffline = useCallback(async () => {
    if (!post) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      if (isDownloaded) {
        await removeOfflinePost(post.id);
        setIsDownloaded(false);
        showSuccess(t("post.removedFromDevice", "Removed from device"));
      } else {
        const payload: OfflinePost = {
          id: post.id,
          title: post.title ?? null,
          body: post.body,
          createdAt: post.createdAt,
          headerImageKey: post.headerImageKey ?? null,
          author: post.author,
          lang: post.lang ?? null,
          savedAt: Date.now(),
        };
        await savePostForOffline(payload);
        setIsDownloaded(true);
        showSuccess(
          t("post.downloadedForOffline", "Saved for offline reading"),
        );
      }
    } catch (e) {
      showError(t("post.downloadFailed", "Download failed"));
    }
  }, [post, isDownloaded, showSuccess, showError, t]);

  const handleReportSubmit = useCallback(
    async (reason: string, comment?: string) => {
      try {
        await api.post("/safety/report", {
          targetId: post!.id,
          targetType: "POST",
          reason,
          comment,
        });
        showSuccess(t("post.reportSuccess", "Post reported successfully"));
      } catch (e) {
        showError(t("post.reportError", "Failed to report post"));
        throw e;
      }
    },
    [post, showSuccess, showError, t],
  );

  const handleDeletePost = useCallback(async () => {
    try {
      await api.delete(`/posts/${postId}`);
      showSuccess(t("post.deleted", "Post deleted"));
      setDeleteConfirmVisible(false);
      setMoreOptionsVisible(false);
      router.back();
    } catch (e: unknown) {
      showError(
        (e as { message?: string })?.message ||
          t("post.deleteFailed", "Failed to delete post"),
      );
      throw e;
    }
  }, [postId, showSuccess, showError, t, router]);

  const isOwnPost = !!post && !!userId && post.author?.id === userId;

  const animateLike = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <FullScreenSkeleton />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>
          {t("post.notFound", "Post not found")}
        </Text>
      </View>
    );
  }

  // Deleted: show placeholder before private (API returns viewerCanSeeContent false for both)
  if (post.deletedAt) {
    const deletedDate = new Date(post.deletedAt);
    const formattedDate = deletedDate.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.overlayHeader,
            { paddingTop: Math.max(8, insets.top - 20) },
          ]}
          pointerEvents="box-none"
        >
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back")}
          />
          <View style={{ flex: 1 }} />
        </View>
        <View style={[styles.center, styles.deletedPlaceholderWrap]}>
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
      </View>
    );
  }

  // Private post: 403 with author, or 200 with viewerCanSeeContent false AND we have author
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
        <View
          style={[
            styles.overlayHeader,
            { paddingTop: Math.max(8, insets.top - 20) },
          ]}
          pointerEvents="box-none"
        >
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back")}
          />
          <View style={{ flex: 1 }} />
        </View>
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

  // Content hidden but no author (e.g. cached/stale or token not sent): offer retry
  if (post.viewerCanSeeContent === false && !showPrivateOverlay) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.overlayHeader,
            { paddingTop: Math.max(8, insets.top - 20) },
          ]}
          pointerEvents="box-none"
        >
          <HeaderIconButton
            onPress={() => router.back()}
            icon="arrow-back"
            accessibilityLabel={t("common.back")}
          />
          <View style={{ flex: 1 }} />
        </View>
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

  const replyCount = post.replyCount ?? 0;
  const quoteCount = post.quoteCount ?? 0;

  const postHeaderUri = getPostHeaderImageUri(
    post as { headerImageUrl?: string | null; headerImageKey?: string | null },
  );
  const hasHero =
    (postHeaderUri != null && postHeaderUri !== "") ||
    (post.headerImageKey != null && post.headerImageKey !== "");

  // --- Fading header logic ---
  // Floating buttons fade out after 80px of scroll; solid bar fades in
  const HEADER_FADE_START = 60;
  const HEADER_FADE_END = 140;
  const floatingHeaderOpacity = scrollY.interpolate({
    inputRange: [HEADER_FADE_START, HEADER_FADE_END],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const solidBarOpacity = scrollY.interpolate({
    inputRange: [HEADER_FADE_START, HEADER_FADE_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
      {/* Floating header: transparent, fades out on scroll */}
      <AnimatedView
        style={[
          styles.overlayHeader,
          {
            paddingTop: Math.max(8, insets.top - 20),
            opacity: floatingHeaderOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <HeaderIconButton
          onPress={() => router.back()}
          icon="arrow-back"
          accessibilityLabel={t("common.back")}
        />
        <View style={{ flex: 1 }} />
        <HeaderIconButton
          onPress={() => {
            Haptics.selectionAsync();
            setMoreOptionsVisible(true);
          }}
          icon="more-horiz"
          accessibilityLabel={t("profile.options", "Options")}
        />
      </AnimatedView>

      {/* Solid header bar: fades in on scroll */}
      <AnimatedView
        style={[
          styles.solidBar,
          { paddingTop: insets.top, opacity: solidBarOpacity },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.solidBarBtn}
        >
          <MaterialIcons name="arrow-back" size={22} color={COLORS.paper} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => {
            Haptics.selectionAsync();
            setMoreOptionsVisible(true);
          }}
          hitSlop={10}
          style={styles.solidBarBtn}
        >
          <MaterialIcons name="more-horiz" size={22} color={COLORS.paper} />
        </Pressable>
      </AnimatedView>

      <AnimatedScrollView
        contentContainerStyle={[
          styles.scrollContent,
          // When no hero image, tight top padding (just enough to clear the header bar)
          !hasHero && {
            paddingTop: insets.top + 44,
          },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        {/* Cover: full width, edge-to-edge (overlay header sits on top); fades out on scroll */}
        {hasHero &&
          (() => {
            const heroFadeDistance = SCREEN_WIDTH * 0.6;
            const heroOpacity = scrollY.interpolate({
              inputRange: [0, heroFadeDistance],
              outputRange: [1, 0],
              extrapolate: "clamp",
            });
            return (
              <AnimatedView
                style={[
                  styles.heroImageWrap,
                  { height: SCREEN_WIDTH * (3 / 4), opacity: heroOpacity },
                ]}
              >
                <Image
                  source={{ uri: postHeaderUri ?? "" }}
                  style={[
                    styles.heroImage,
                    { width: SCREEN_WIDTH, height: SCREEN_WIDTH * (3 / 4) },
                  ]}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {post.title ? (
                  <View style={styles.heroTitleOverlay}>
                    <Text style={styles.heroTitleText} numberOfLines={2}>
                      {post.title}
                    </Text>
                  </View>
                ) : null}
              </AnimatedView>
            );
          })()}

        <View style={styles.article}>
          {/* Author — shared component */}
          <View style={{ marginBottom: SPACING.l }}>
            <PostAuthorHeader
              variant="full"
              author={
                post.author as {
                  id?: string;
                  handle?: string;
                  displayName?: string;
                  avatarKey?: string | null;
                  avatarUrl?: string | null;
                  bio?: string | null;
                }
              }
              createdAt={post.createdAt}
              readingTimeMinutes={post.readingTimeMinutes}
            />
          </View>

          {/* Title only when no hero overlay (hero already shows title) */}
          {!hasHero && post.title != null && post.title !== "" ? (
            <Text style={styles.title}>{post.title}</Text>
          ) : null}

          <MarkdownText
            stripLeadingH1IfMatch={post.title ?? undefined}
            referenceMetadata={post.referenceMetadata}
          >
            {post.body}
          </MarkdownText>

          {/* Action row: subtle meta bar with smaller icons so it doesn't compete with the article */}
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={() => {
                animateLike();
                handleLike();
              }}
            >
              <AnimatedView style={{ transform: [{ scale: scaleValue }] }}>
                <MaterialIcons
                  name={liked ? "favorite" : "favorite-border"}
                  size={ACTION_ICON_SIZE}
                  color={liked ? COLORS.like : COLORS.tertiary}
                />
              </AnimatedView>
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push(`/post/${postId}/comments`)}
            >
              <MaterialIcons
                name="chat-bubble-outline"
                size={ACTION_ICON_SIZE}
                color={COLORS.tertiary}
              />
              {replyCount > 0 && (
                <Text style={styles.actionCount}>{replyCount}</Text>
              )}
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() =>
                router.push({
                  pathname: "/post/compose",
                  params: { quote: postId },
                })
              }
            >
              <MaterialIcons
                name="format-quote"
                size={ACTION_ICON_SIZE}
                color={COLORS.tertiary}
              />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={handleKeep}
              accessibilityLabel={t("post.save")}
            >
              <MaterialIcons
                name={kept ? "bookmark" : "bookmark-border"}
                size={ACTION_ICON_SIZE}
                color={kept ? COLORS.primary : COLORS.tertiary}
              />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() => collectionSheetRef.current?.open(postId)}
              accessibilityLabel={t("post.addToCollection")}
            >
              <MaterialIcons
                name="add-circle-outline"
                size={ACTION_ICON_SIZE}
                color={COLORS.tertiary}
              />
            </Pressable>

            <Pressable
              style={styles.actionBtn}
              onPress={() =>
                shareSheetRef.current?.open(postId, {
                  authorIsProtected: post?.author?.isProtected === true,
                })
              }
            >
              <MaterialIcons
                name="ios-share"
                size={ACTION_ICON_SIZE}
                color={COLORS.tertiary}
              />
            </Pressable>

            {offlineEnabled && (
              <Pressable
                style={styles.actionBtn}
                onPress={handleDownloadOffline}
                accessibilityLabel={
                  isDownloaded
                    ? t("post.removeFromDevice", "Remove from device")
                    : t("post.downloadForOffline", "Download for offline")
                }
              >
                <MaterialIcons
                  name="offline-pin"
                  size={ACTION_ICON_SIZE}
                  color={isDownloaded ? COLORS.primary : COLORS.tertiary}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* ─── Connections: This builds on / Built upon by / In topics ─── */}
        {connections &&
          (connections.buildsOn.length > 0 ||
            connections.builtUponBy.length > 0 ||
            connections.topics.length > 0) && (
            <View style={styles.section}>
              {/* This Builds On */}
              {connections.buildsOn.length > 0 && (
                <View style={styles.connectionSection}>
                  <Text style={styles.connectionHeader}>This builds on</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.connectionScroll}
                    contentContainerStyle={styles.connectionScrollContent}
                  >
                    {connections.buildsOn.map(
                      (item: Record<string, unknown>, idx: number) => {
                        const itemType = String(item.type ?? "post");
                        const label = String(item.label ?? item.title ?? "");
                        const itemId = String(item.id ?? idx);
                        const bodyExcerpt =
                          typeof item.bodyExcerpt === "string"
                            ? item.bodyExcerpt
                            : typeof item.description === "string"
                              ? item.description
                              : "";
                        const authorHandle =
                          typeof item.authorHandle === "string"
                            ? item.authorHandle
                            : "";
                        const authorDisplayName =
                          typeof item.authorDisplayName === "string"
                            ? item.authorDisplayName
                            : "";
                        const authorAvatarKey =
                          typeof item.authorAvatarKey === "string"
                            ? item.authorAvatarKey
                            : null;
                        const postCount =
                          typeof item.postCount === "number"
                            ? item.postCount
                            : 0;
                        const slug =
                          typeof item.slug === "string" ? item.slug : label;
                        const domain =
                          typeof item.domain === "string" ? item.domain : "";
                        const imageUrl =
                          typeof item.imageUrl === "string"
                            ? item.imageUrl
                            : "";

                        return (
                          <Pressable
                            key={`bo-${itemType}-${itemId}`}
                            style={({ pressed }: { pressed: boolean }) => [
                              styles.connectionCard,
                              pressed && {
                                opacity: 0.8,
                                transform: [{ scale: 0.98 }],
                              },
                            ]}
                            onPress={() => {
                              if (itemType === "post")
                                router.push(`/post/${itemId}/reading`);
                              else if (itemType === "topic")
                                router.push(
                                  `/topic/${encodeURIComponent(slug)}`,
                                );
                              else if (itemType === "user")
                                router.push(`/user/${authorHandle || itemId}`);
                              else if (
                                itemType === "external" &&
                                typeof item.url === "string"
                              )
                                openExternalLink(item.url);
                            }}
                          >
                            {/* Card header: avatar/icon + author name */}
                            <View style={styles.cardHeader}>
                              {itemType === "post" ? (
                                authorAvatarKey ? (
                                  <Image
                                    source={{
                                      uri:
                                        getAvatarUri({
                                          avatarKey: authorAvatarKey,
                                        }) ?? "",
                                    }}
                                    style={styles.cardAvatar}
                                    contentFit="cover"
                                  />
                                ) : (
                                  <View style={styles.cardAvatarPlaceholder}>
                                    <Text style={styles.cardAvatarLetter}>
                                      {(
                                        authorDisplayName ||
                                        authorHandle ||
                                        "?"
                                      )
                                        .charAt(0)
                                        .toUpperCase()}
                                    </Text>
                                  </View>
                                )
                              ) : itemType === "topic" ? (
                                <View
                                  style={[
                                    styles.cardIconBg,
                                    { backgroundColor: COLORS.primary + "18" },
                                  ]}
                                >
                                  <MaterialIcons
                                    name="tag"
                                    size={14}
                                    color={COLORS.primary}
                                  />
                                </View>
                              ) : itemType === "external" ? (
                                <View
                                  style={[
                                    styles.cardIconBg,
                                    {
                                      backgroundColor: COLORS.secondary + "22",
                                    },
                                  ]}
                                >
                                  <MaterialIcons
                                    name="open-in-new"
                                    size={13}
                                    color={COLORS.secondary}
                                  />
                                </View>
                              ) : (
                                <View style={styles.cardAvatarPlaceholder}>
                                  <MaterialIcons
                                    name="person"
                                    size={14}
                                    color={COLORS.tertiary}
                                  />
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                {itemType === "post" ? (
                                  <Text
                                    style={styles.cardSubtitle}
                                    numberOfLines={1}
                                  >
                                    {authorDisplayName || `@${authorHandle}`}
                                  </Text>
                                ) : itemType === "topic" ? (
                                  <Text
                                    style={styles.cardSubtitle}
                                    numberOfLines={1}
                                  >
                                    {postCount > 0
                                      ? `${postCount} post${postCount !== 1 ? "s" : ""}`
                                      : "Topic"}
                                  </Text>
                                ) : itemType === "external" ? (
                                  <Text
                                    style={styles.cardSubtitle}
                                    numberOfLines={1}
                                  >
                                    {domain || "External link"}
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            {/* Title */}
                            <Text style={styles.cardTitle} numberOfLines={2}>
                              {label}
                            </Text>

                            {/* Excerpt or description */}
                            {bodyExcerpt ? (
                              <Text
                                style={styles.cardExcerpt}
                                numberOfLines={2}
                              >
                                {bodyExcerpt.slice(0, 100)}
                              </Text>
                            ) : null}

                            {/* External link image preview */}
                            {itemType === "external" && imageUrl ? (
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.cardLinkImage}
                                contentFit="cover"
                              />
                            ) : null}
                          </Pressable>
                        );
                      },
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Built Upon By */}
              {connections.builtUponBy.length > 0 && (
                <View style={styles.connectionSection}>
                  <Text style={styles.connectionHeader}>
                    Built upon by
                    {connections.builtUponBy.length > 0
                      ? ` (${connections.builtUponBy.length})`
                      : ""}
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.connectionScroll}
                    contentContainerStyle={styles.connectionScrollContent}
                  >
                    {connections.builtUponBy.map(
                      (item: Record<string, unknown>) => {
                        const itemId = String(item.id ?? "");
                        const title = String(
                          item.title || item.bodyExcerpt || "Post",
                        );
                        const bodyExcerpt =
                          typeof item.bodyExcerpt === "string"
                            ? item.bodyExcerpt
                            : "";
                        const authorHandle =
                          typeof item.authorHandle === "string"
                            ? item.authorHandle
                            : "";
                        const authorDisplayName =
                          typeof item.authorDisplayName === "string"
                            ? item.authorDisplayName
                            : "";
                        const authorAvatarKey =
                          typeof item.authorAvatarKey === "string"
                            ? item.authorAvatarKey
                            : null;

                        return (
                          <Pressable
                            key={`bub-${itemId}`}
                            style={({ pressed }: { pressed: boolean }) => [
                              styles.connectionCard,
                              pressed && {
                                opacity: 0.8,
                                transform: [{ scale: 0.98 }],
                              },
                            ]}
                            onPress={() =>
                              router.push(`/post/${itemId}/reading`)
                            }
                          >
                            <View style={styles.cardHeader}>
                              {authorAvatarKey ? (
                                <Image
                                  source={{
                                    uri:
                                      getAvatarUri({
                                        avatarKey: authorAvatarKey,
                                      }) ?? "",
                                  }}
                                  style={styles.cardAvatar}
                                  contentFit="cover"
                                />
                              ) : (
                                <View style={styles.cardAvatarPlaceholder}>
                                  <Text style={styles.cardAvatarLetter}>
                                    {(authorDisplayName || authorHandle || "?")
                                      .charAt(0)
                                      .toUpperCase()}
                                  </Text>
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={styles.cardSubtitle}
                                  numberOfLines={1}
                                >
                                  {authorDisplayName || `@${authorHandle}`}
                                </Text>
                              </View>
                            </View>
                            <Text style={styles.cardTitle} numberOfLines={2}>
                              {title}
                            </Text>
                            {bodyExcerpt && title !== bodyExcerpt ? (
                              <Text
                                style={styles.cardExcerpt}
                                numberOfLines={2}
                              >
                                {bodyExcerpt.slice(0, 100)}
                              </Text>
                            ) : null}
                          </Pressable>
                        );
                      },
                    )}
                  </ScrollView>
                </View>
              )}

              {/* In Topics — deep dive enabled */}
              {connections.topics.length > 0 && (
                <View style={styles.connectionSection}>
                  <Text style={styles.connectionHeader}>In topics</Text>
                  <View style={styles.topicPills}>
                    {connections.topics.map(
                      (topic: Record<string, unknown>) => {
                        const topicSlug = String(topic.slug ?? topic.id ?? "");
                        const topicTitle = String(topic.title ?? topicSlug);
                        const topicPostCount =
                          typeof topic.postCount === "number"
                            ? topic.postCount
                            : 0;
                        return (
                          <Pressable
                            key={`topic-${topicSlug}`}
                            style={({ pressed }: { pressed: boolean }) => [
                              styles.topicPill,
                              pressed && {
                                opacity: 0.7,
                                transform: [{ scale: 0.97 }],
                              },
                            ]}
                            onPress={() =>
                              router.push(
                                `/topic/${encodeURIComponent(topicSlug)}`,
                              )
                            }
                          >
                            <MaterialIcons
                              name="tag"
                              size={15}
                              color={COLORS.primary}
                            />
                            <Text style={styles.topicPillTitle}>
                              {topicTitle}
                            </Text>
                            {topicPostCount > 0 && (
                              <>
                                <Text style={styles.topicPillDot}>·</Text>
                                <Text style={styles.topicPillCount}>
                                  {topicPostCount} post
                                  {topicPostCount !== 1 ? "s" : ""}
                                </Text>
                              </>
                            )}
                            <MaterialIcons
                              name="chevron-right"
                              size={16}
                              color={COLORS.tertiary}
                            />
                          </Pressable>
                        );
                      },
                    )}
                  </View>
                </View>
              )}
            </View>
          )}
      </AnimatedScrollView>

      <AddToCollectionSheet ref={collectionSheetRef} />
      <ShareSheet ref={shareSheetRef} />
      <OptionsActionSheet
        visible={moreOptionsVisible}
        title={t("post.options", "Post Options")}
        options={[
          ...(isOwnPost
            ? [
                {
                  label: t("post.delete", "Delete Post"),
                  onPress: () => {
                    setMoreOptionsVisible(false);
                    setDeleteConfirmVisible(true);
                  },
                  destructive: true as const,
                  icon: "delete-outline" as const,
                },
              ]
            : []),
          {
            label: t("post.report", "Report Post"),
            onPress: () => {
              setMoreOptionsVisible(false);
              setReportVisible(true);
            },
            destructive: true,
            icon: "flag",
          },
        ]}
        cancelLabel={t("common.cancel")}
        onCancel={() => setMoreOptionsVisible(false)}
      />
      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onReport={handleReportSubmit}
        targetType="POST"
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
        icon="warning"
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteConfirmVisible(false)}
      />
    </View>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: "center", alignItems: "center" },
  scrollContent: { paddingBottom: 80 },
  overlayHeader: {
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
  solidBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: COLORS.ink,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.divider,
    zIndex: 11,
  },
  solidBarBtn: {
    padding: 8,
  },
  /* Full-width hero: 4:3 aspect, title overlay */
  heroImageWrap: {
    width: SCREEN_WIDTH,
    alignSelf: "center",
    marginBottom: SPACING.l,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    backgroundColor: COLORS.divider,
  },
  heroTitleOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.l,
    backgroundColor: COLORS.overlay,
  },
  heroTitleText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
  },

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

  article: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
  },
  /* author styles moved to shared PostAuthorHeader */
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
    marginBottom: SPACING.xl,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: SPACING.s,
    paddingRight: SPACING.l,
    paddingBottom: SPACING.s,
    marginTop: SPACING.xl,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: SPACING.xs,
  },
  actionCount: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  section: {
    marginTop: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  connectionSection: {
    marginBottom: SPACING.xl,
  },
  connectionHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.secondary,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.m,
  },
  connectionScroll: {
    marginHorizontal: -(LAYOUT.contentPaddingHorizontal as number),
  },
  connectionScrollContent: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal as number,
    gap: 10,
  },
  /* ── Redesigned connection cards ── */
  connectionCard: {
    width: 220,
    backgroundColor: COLORS.hover,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.divider,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.divider,
  },
  cardAvatarPlaceholder: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.badge,
    justifyContent: "center",
    alignItems: "center",
  },
  cardAvatarLetter: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  cardIconBg: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardSubtitle: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 19,
  },
  cardExcerpt: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  cardLinkImage: {
    width: "100%",
    height: 80,
    borderRadius: 8,
    backgroundColor: COLORS.divider,
    marginTop: 2,
  },
  /* ── Topic pills ── */
  topicPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  topicPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.hover,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: 5,
  },
  topicPillTitle: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  topicPillDot: {
    fontSize: 14,
    color: COLORS.tertiary,
    marginHorizontal: 1,
  },
  topicPillCount: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  errorText: { color: COLORS.error, fontSize: 16, fontFamily: FONTS.medium },
  deletedPlaceholder: {
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
  },
  deletedPlaceholderWrap: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
});
