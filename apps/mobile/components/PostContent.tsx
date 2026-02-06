import React, { useMemo, memo } from "react";
import {
  Text,
  View,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { useOpenExternalLink } from "../hooks/useOpenExternalLink";
import { MarkdownText } from "./MarkdownText";
import { Avatar } from "./Avatar";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";
import { getAvatarUri, getPostHeaderImageUri } from "../utils/api";

import { Post } from "../types";

type SourceItem =
  | { type: "external"; url: string; title: string | null; icon: string }
  | { type: "post"; id: string; title: string; icon: string }
  | { type: "topic"; title: string; slug: string; alias?: string; icon: string }
  | { type: "user"; handle: string; title: string; icon: string };

interface PostContentProps {
  post: Partial<Post> & Pick<Post, "id" | "body" | "createdAt">;
  onMenuPress?: () => void;
  disableNavigation?: boolean;
  headerImageUri?: string | null;
  showSources?: boolean;
  referenceMetadata?: Record<string, { title?: string }>;
  /** When set, body is truncated to this many lines with a gradient fade overlay (no ellipsis). */
  maxBodyLines?: number;
  /** When true, show blurred overlay with "Private" over the content (author row stays visible). */
  isPrivateForViewer?: boolean;
}

const HEADER_IMAGE_ASPECT = 4 / 3;

function PostContentInner({
  post,
  onMenuPress,
  disableNavigation = false,
  headerImageUri,
  showSources = false,
  referenceMetadata = {},
  maxBodyLines,
  isPrivateForViewer,
}: PostContentProps) {
  const showPrivateOverlay =
    isPrivateForViewer === true || post.viewerCanSeeContent === false;
  const router = useRouter();
  const { t } = useTranslation();
  const { openExternalLink } = useOpenExternalLink();
  const { width: screenWidth } = useWindowDimensions();
  const headerImageHeight = Math.round(screenWidth * (1 / HEADER_IMAGE_ASPECT));

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return t("common.time.now", "now");
    if (minutes < 60) return `${minutes}${t("common.time.minutes", "m")}`;
    if (hours < 24) return `${hours}${t("common.time.hours", "h")}`;
    if (days < 7) return `${days}${t("common.time.days", "d")}`;
    return d.toLocaleDateString();
  };

  const handleAuthorPress = () => {
    if (!disableNavigation && post.author?.handle) {
      router.push(`/user/${post.author.handle}`);
    }
  };

  const handlePostPress = () => {
    if (!disableNavigation) {
      if (post.title) {
        router.push(`/post/${post.id}/reading`);
      } else {
        router.push(`/post/${post.id}`);
      }
    }
  };

  const handleSourcePress = async (source: SourceItem) => {
    if (disableNavigation) return;
    if (source.type === "external") {
      await openExternalLink(source.url);
    } else if (source.type === "post") {
      router.push(`/post/${source.id}`);
    } else if (source.type === "topic") {
      router.push(
        `/topic/${encodeURIComponent(source.slug ?? source.title ?? "")}`,
      );
    } else if (source.type === "user") {
      router.push(`/user/${source.handle}`);
    }
  };

  // Strip title from body if it matches the header (guard: body can be undefined from API)
  const body = post.body ?? "";
  const hasExplicitTitle = post.title != null && post.title !== "";
  const fullDisplayBody =
    hasExplicitTitle && body.startsWith(`# ${post.title}`)
      ? body.substring(body.indexOf("\n") + 1).trim()
      : body;

  // When post has no title, use first line of body as headline so preview looks the same as titled posts
  const noTitleUseBodyHeadline =
    !hasExplicitTitle && fullDisplayBody.trim().length > 0;
  const bodyHeadline = noTitleUseBodyHeadline
    ? (fullDisplayBody.includes("\n")
      ? fullDisplayBody.slice(0, fullDisplayBody.indexOf("\n")).trim()
      : fullDisplayBody.trim()
    ).slice(0, 120)
    : "";
  const bodyAfterHeadline =
    noTitleUseBodyHeadline && fullDisplayBody.includes("\n")
      ? fullDisplayBody.substring(fullDisplayBody.indexOf("\n") + 1).trim()
      : noTitleUseBodyHeadline
        ? ""
        : fullDisplayBody;

  const bodyForTruncation = noTitleUseBodyHeadline
    ? bodyAfterHeadline
    : fullDisplayBody;
  const lines = bodyForTruncation.split("\n");
  const hasMoreLines = maxBodyLines != null && lines.length > maxBodyLines;
  const MAX_LAST_LINE_CHARS = 72;
  const ELLIPSIS = " …";
  let displayBody: string;
  if (hasMoreLines) {
    const take = lines.slice(0, maxBodyLines);
    const lastLine = take[take.length - 1] ?? "";
    const truncatedLast =
      lastLine.length > MAX_LAST_LINE_CHARS
        ? lastLine.slice(0, MAX_LAST_LINE_CHARS - 3) + "…"
        : lastLine;
    const bodyWithoutEllipsis =
      take.length === 1
        ? truncatedLast
        : take.slice(0, -1).join("\n") + "\n" + truncatedLast;
    displayBody = bodyWithoutEllipsis + ELLIPSIS;
  } else {
    displayBody = bodyForTruncation;
  }

  // Prefer API-provided headerImageUrl, then build from headerImageKey; allow explicit headerImageUri override (e.g. local)
  const postHeaderUri = getPostHeaderImageUri(
    post as { headerImageUrl?: string | null; headerImageKey?: string | null },
  );
  const imageSource = headerImageUri
    ? { uri: headerImageUri }
    : postHeaderUri
      ? { uri: postHeaderUri }
      : null;

  // Extract sources (deduplicated by canonical key)
  const sources = useMemo(() => {
    const list: SourceItem[] = [];
    if (!post.body) return list;
    const seen = new Set<string>();

    const add = (item: SourceItem, key: string) => {
      if (seen.has(key)) return;
      seen.add(key);
      list.push(item);
    };

    // External links: [text](url) or [url](text) (Cite format)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(post.body)) !== null) {
      const a = (match[1] ?? "").trim();
      const b = (match[2] ?? "").trim();
      const isUrl = (s: string) =>
        s.startsWith("http://") || s.startsWith("https://");
      let url: string;
      let title: string | null;
      if (isUrl(b)) {
        url = b;
        title = a || null;
      } else if (isUrl(a)) {
        url = a;
        title = b || null;
      } else continue;
      add({ type: "external", title, url, icon: "link" } as SourceItem, `ext-${url}`);
    }

    // Post links [[post:id|alias]]
    const postRegex = /\[\[post:([^\]]+?)(?:\|([^\]]+?))?\]\]/g;
    while ((match = postRegex.exec(post.body)) !== null) {
      const id = match[1];
      const alias = match[2];
      const resolvedTitle =
        referenceMetadata[id]?.title ??
        referenceMetadata[id?.toLowerCase?.() ?? ""]?.title;
      add(
        {
          type: "post",
          id,
          title: alias || resolvedTitle || t("post.referencedPost", "Referenced Post"),
          icon: "description",
        } as SourceItem,
        `post-${id}`,
      );
    }

    // Topic links [[Topic]]
    const topicRegex = /\[\[([^\]:]+?)\]\]/g;
    while ((match = topicRegex.exec(post.body)) !== null) {
      if (!match[1].startsWith("post:")) {
        const parts = match[1].split("|");
        const slug = parts[0].trim().toLowerCase();
        add(
          {
            type: "topic",
            title: parts[0],
            slug,
            alias: parts[1],
            icon: "tag",
          } as SourceItem,
          `topic-${slug}`,
        );
      }
    }

    // Mentions @handle
    const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
    while ((match = mentionRegex.exec(post.body)) !== null) {
      const handle = match[1];
      add(
        { type: "user", handle, title: `@${handle}`, icon: "person" } as SourceItem,
        `user-${handle}`,
      );
    }

    return list;
  }, [post.body, referenceMetadata]);

  if (!post.author) return null;

  return (
    <View style={styles.container}>
      {/* Author Header */}
      <Pressable
        style={({ pressed }: { pressed: boolean }) => [
          styles.authorRow,
          pressed && !disableNavigation && { opacity: 0.7 },
        ]}
        onPress={handleAuthorPress}
        disabled={disableNavigation}
        accessibilityLabel={
          post.author?.displayName ||
          post.author?.handle ||
          t("post.unknownUser", "Unknown")
        }
        accessibilityRole="button"
      >
        <Avatar
          name={post.author.displayName}
          size={40}
          uri={getAvatarUri(
            post.author as {
              avatarKey?: string | null;
              avatarUrl?: string | null;
            },
          )}
        />
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>
              {post.author.displayName || t("post.unknownUser", "Unknown")}
            </Text>
            <MaterialIcons
              name="circle"
              size={4}
              color={COLORS.tertiary}
              style={styles.dotIcon}
            />
            <Text style={styles.metaText}>{formatTime(post.createdAt)}</Text>
          </View>
        </View>
        {onMenuPress && (
          <Pressable
            onPress={onMenuPress}
            hitSlop={12}
            style={({ pressed }: { pressed: boolean }) => [
              { padding: 4 },
              pressed && { opacity: 0.5 },
            ]}
            accessibilityLabel={t("post.options", "More options")}
            accessibilityRole="button"
          >
            <MaterialIcons
              name="more-horiz"
              size={HEADER.iconSize}
              color={COLORS.tertiary}
            />
          </Pressable>
        )}
      </Pressable>

      {/* Content: whole card tappable to open post (body links still receive touches first) */}
      <View style={styles.contentWrap}>
        <Pressable
          onPress={handlePostPress}
          disabled={disableNavigation}
          style={({ pressed }: { pressed: boolean }) => [
            styles.content,
            pressed && !disableNavigation && { opacity: 0.95 },
          ]}
          accessibilityLabel={t("common.viewProfile", "View post") || "View post"}
          accessibilityRole="button"
        >
          <View style={styles.headerTappable}>
            {imageSource ? (
              <View
                style={[styles.headerImageWrap, { height: headerImageHeight }]}
              >
                <Image
                  source={imageSource}
                  style={[styles.headerImage, { height: headerImageHeight }]}
                  contentFit="cover"
                  transition={300}
                  placeholder={post.headerImageBlurhash}
                  placeholderContentFit="cover"
                  cachePolicy="memory-disk"
                />
                {post.title != null && post.title !== "" && (
                  <View style={styles.headerImageOverlay}>
                    <Text style={styles.headerImageTitle} numberOfLines={2}>
                      {post.title}
                    </Text>
                  </View>
                )}
              </View>
            ) : hasExplicitTitle ? (
              <Text style={styles.title}>{post.title}</Text>
            ) : bodyHeadline ? (
              <Text style={styles.title} numberOfLines={2}>
                {bodyHeadline}
              </Text>
            ) : !imageSource ? (
              <Text style={styles.readPostLink}>
                {t("post.readArticle", "Read")}
              </Text>
            ) : null}
          </View>
          {maxBodyLines != null ? (
            <View
              style={[styles.bodyClipWrap, { maxHeight: maxBodyLines * 26 }]}
              collapsable={false}
            >
              <MarkdownText referenceMetadata={referenceMetadata}>
                {displayBody}
              </MarkdownText>
              <LinearGradient
                colors={["transparent", COLORS.ink]}
                style={styles.bodyFadeGradient}
                pointerEvents="none"
              />
            </View>
          ) : (
            <MarkdownText referenceMetadata={referenceMetadata}>
              {displayBody}
            </MarkdownText>
          )}
        </Pressable>

        {showPrivateOverlay && (
          <View style={styles.privateOverlay} pointerEvents="none">
            <View style={styles.privateOverlayInner}>
              <MaterialIcons
                name="lock"
                size={32}
                color={COLORS.paper}
                style={styles.privateOverlayIcon}
              />
              <Text style={styles.privateOverlayText}>
                {t("common.private", "Private")}
              </Text>
              <Text style={styles.privateOverlaySubtext}>
                {t(
                  "post.privateOnlyFollowers",
                  "Only followers can see this post",
                )}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Sources Section */}
      {showSources && sources.length > 0 && !showPrivateOverlay && (
        <View style={styles.sourcesSection}>
          <Text style={styles.sourcesHeader}>
            {t("post.sources", "Sources")}
          </Text>
          {sources.map((source, index) => (
            <Pressable
              key={
                source.type === "external"
                  ? `ext-${source.url}`
                  : source.type === "post"
                    ? `post-${source.id}`
                    : source.type === "topic"
                      ? `topic-${source.slug}`
                      : `user-${source.handle}`
              }
              style={({ pressed }: { pressed: boolean }) => [
                styles.sourceItem,
                pressed && { backgroundColor: COLORS.hover },
              ]}
              onPress={() => handleSourcePress(source)}
              accessibilityLabel={t("post.source", "View source") || "View source"}
              accessibilityRole="button"
            >
              <Text style={styles.sourceNumber}>{index + 1}</Text>
              <View style={styles.sourceIcon}>
                <Text style={styles.sourceIconText}>
                  {source.type === "external" && source.url
                    ? new URL(source.url).hostname.charAt(0).toUpperCase()
                    : (source.title ?? "?").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.sourceContent}>
                <Text style={styles.sourceDomain}>
                  {source.type === "external" && source.url
                    ? new URL(source.url).hostname
                    : source.type === "user"
                      ? t("common.user", "User")
                      : t("common.topicOrPost", "Topic/Post")}
                </Text>
                <Text style={styles.sourceText} numberOfLines={1}>
                  {source.type === "topic" && source.alias
                    ? source.alias
                    : source.type === "user"
                      ? source.handle
                      : source.title ?? ""}
                </Text>
              </View>
              <MaterialIcons
                name="open-in-new"
                size={HEADER.iconSize}
                color={COLORS.tertiary}
              />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = createStyles({
  container: {
    gap: SPACING.m,
  },
  contentWrap: {
    position: "relative",
  },
  privateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.overlayHeavy,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: SIZES.borderRadius,
    minHeight: 120,
  },
  privateOverlayInner: {
    alignItems: "center",
    paddingHorizontal: SPACING.l,
  },
  privateOverlayIcon: {
    marginBottom: SPACING.s,
  },
  privateOverlayText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: SPACING.xs,
  },
  privateOverlaySubtext: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  dotIcon: {
    marginHorizontal: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  content: {
    gap: SPACING.m,
  },
  headerTappable: {
    gap: SPACING.m,
  },
  readPostLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  bodyClipWrap: {
    position: "relative",
    overflow: "hidden",
  },
  bodyFadeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  moreIndicator: {
    fontSize: 18,
    lineHeight: 28,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.paper,
    lineHeight: 36,
    fontFamily: FONTS.semiBold,
    letterSpacing: -0.5,
  },
  headerImageWrap: {
    width: "100%",
    marginTop: SPACING.m,
    borderRadius: SIZES.borderRadius,
    overflow: "hidden",
    position: "relative",
  },
  headerImage: {
    width: "100%",
    backgroundColor: COLORS.divider,
  },
  headerImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.m,
    backgroundColor: COLORS.overlay,
  },
  headerImageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 32,
  },
  sourcesSection: {
    marginTop: SPACING.m,
    paddingTop: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.s,
  },
  sourcesHeader: {
    width: "100%",
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.tertiary,
    marginBottom: SPACING.s,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  sourceItem: {
    width: "48%", // Grid of 2
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.s,
  },
  sourceNumber: {
    display: "none", // Hide number in card view
  },
  sourceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  sourceIconText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  sourceContent: {
    flex: 1,
    gap: 0,
  },
  sourceDomain: {
    fontSize: 11,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  sourceText: {
    fontSize: 13,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
});

export const PostContent = memo(
  PostContentInner as React.FunctionComponent<PostContentProps>,
) as (props: PostContentProps) => React.ReactElement | null;
