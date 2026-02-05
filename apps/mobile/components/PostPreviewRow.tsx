import React, { memo, useCallback } from "react";
import { Text, View, Pressable, Image } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { getAvatarUri, getPostHeaderImageUri } from "../utils/api";
import { Avatar } from "./Avatar";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";

const THUMB_ASPECT = 4 / 3;
const THUMB_WIDTH = 80;

interface PostPreviewRowProps {
  post: {
    id: string;
    title?: string | null;
    body?: string | null;
    headerImageKey?: string | null;
    headerImageUrl?: string | null;
    author?: {
      displayName?: string;
      handle?: string;
      avatarKey?: string | null;
      avatarUrl?: string | null;
    } | null;
    viewerCanSeeContent?: boolean;
  };
  /** When true, card uses full width (no horizontal margin), e.g. in reading Sources/Quoted section */
  fullWidth?: boolean;
  /** When true, show blurred overlay with "Private" over the preview */
  isPrivateForViewer?: boolean;
}

/** Small post preview for "Quoted by" and similar lists: thumb + title + author + one-line body. */
function PostPreviewRowInner({
  post,
  fullWidth = false,
  isPrivateForViewer,
}: PostPreviewRowProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const thumbHeight = Math.round(THUMB_WIDTH / THUMB_ASPECT);
  const imageUri = getPostHeaderImageUri(
    post as { headerImageUrl?: string | null; headerImageKey?: string | null },
  );
  const showPrivateOverlay =
    isPrivateForViewer === true || post.viewerCanSeeContent === false;

  const handlePress = useCallback(() => {
    if (post.title) router.push(`/post/${post.id}/reading`);
    else router.push(`/post/${post.id}`);
  }, [post.id, post.title, router]);

  const bodyPreview = (post.body ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  const authorName = post.author?.displayName || post.author?.handle || "";
  const authorAvatarUri = getAvatarUri(post.author ?? undefined);
  const displayTitle = showPrivateOverlay
    ? t("common.private", "Private")
    : post.title || bodyPreview || "Post";

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        fullWidth && styles.rowFullWidth,
        pressed && styles.rowPressed,
      ]}
      onPress={handlePress}
    >
      <View style={styles.thumbWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={[styles.thumb, { width: THUMB_WIDTH, height: thumbHeight }]}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.thumbPlaceholder,
              { width: THUMB_WIDTH, height: thumbHeight },
            ]}
          >
            <MaterialIcons
              name="article"
              size={HEADER.iconSize}
              color={COLORS.tertiary}
            />
          </View>
        )}
        {showPrivateOverlay && (
          <View
            style={[
              styles.privateOverlay,
              { width: THUMB_WIDTH, height: thumbHeight },
            ]}
          >
            <MaterialIcons name="lock" size={20} color={COLORS.paper} />
            <Text style={styles.privateOverlayText}>
              {t("common.private", "Private")}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        <View style={styles.authorRow}>
          <Avatar
            size={24}
            uri={authorAvatarUri}
            name={authorName || undefined}
            style={styles.authorAvatar}
          />
          {authorName ? (
            <Text style={styles.author} numberOfLines={1}>
              {authorName}
            </Text>
          ) : null}
        </View>
        {!showPrivateOverlay && bodyPreview && !post.title ? (
          <Text style={styles.bodyLine} numberOfLines={1}>
            {bodyPreview}
          </Text>
        ) : null}
      </View>
      <MaterialIcons
        name="chevron-right"
        size={HEADER.iconSize}
        color={COLORS.tertiary}
      />
    </Pressable>
  );
}

export const PostPreviewRow = memo(
  PostPreviewRowInner as React.FunctionComponent<PostPreviewRowProps>,
) as (props: PostPreviewRowProps) => React.ReactElement | null;

const styles = createStyles({
  row: {
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
  rowFullWidth: {
    marginHorizontal: 0,
    marginBottom: SPACING.s,
  },
  rowPressed: { opacity: 0.8 },
  thumbWrap: { position: "relative" },
  thumb: { borderRadius: SIZES.borderRadius, backgroundColor: COLORS.divider },
  privateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderRadius: SIZES.borderRadius,
    justifyContent: "center",
    alignItems: "center",
  },
  privateOverlayText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginTop: 4,
  },
  thumbPlaceholder: {
    borderRadius: SIZES.borderRadius,
    backgroundColor: "rgba(110, 122, 138, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginVertical: 2,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginBottom: 2,
  },
  authorAvatar: { marginRight: 0 },
  author: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    flex: 1,
  },
  bodyLine: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
});
