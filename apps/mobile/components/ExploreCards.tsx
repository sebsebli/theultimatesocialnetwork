import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getImageUrl,
  getAvatarUri,
  getTopicRecentImageUri,
} from "../utils/api";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../constants/theme";

const TOPIC_THUMB_SIZE = 48;

/** Topic card in profile-suggestion style: left image/icon, title, excerpt of latest post, post count, follow. */
const TopicCardInner = ({
  item,
  onPress,
  onFollow,
}: {
  item: Record<string, unknown>;
  onPress: () => void;
  onFollow?: () => void;
}) => {
  const { t } = useTranslation();
  const typedItem = item as Record<string, unknown>;
  const recent = typedItem.recentPost as Record<string, unknown> | undefined;
  const imageUrl =
    getTopicRecentImageUri(typedItem) ||
    (typedItem.latestPostImageKey ? getImageUrl(typedItem.latestPostImageKey as string) : null) ||
    (typedItem.headerImageKey ? getImageUrl(typedItem.headerImageKey as string) : null) ||
    (typedItem.imageKey ? getImageUrl(typedItem.imageKey as string) : null) ||
    (typedItem.headerImageUrl as string | null | undefined) || null;
  const latestTitle = ((recent?.title as string | undefined) ?? "").trim() || null;
  const latestExcerpt =
    ((recent?.bodyExcerpt as string | undefined) ?? (typedItem.recentPostExcerpt as string | undefined) ?? "").trim() || null;
  const excerpt =
    latestTitle || latestExcerpt || ((typedItem.description as string | undefined) ?? "").trim() || null;
  const postCountText =
    typedItem.postCount != null
      ? `${typedItem.postCount} ${t("profile.posts", "posts").toLowerCase()}`
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.topicCard,
        pressed && styles.topicCardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`View topic ${typedItem.title as string}`}
    >
      <View style={styles.topicRow}>
        <View style={styles.topicThumb}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.topicThumbImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.topicThumbPlaceholder}>
              <MaterialIcons name="tag" size={24} color={COLORS.tertiary} />
            </View>
          )}
        </View>
        <View style={styles.topicInfo}>
          <Text style={styles.topicTitle} numberOfLines={1}>
            {typedItem.title as string}
          </Text>
          {excerpt ? (
            <Text style={styles.topicExcerpt} numberOfLines={2}>
              {excerpt}
            </Text>
          ) : null}
          {postCountText ? (
            <Text style={styles.topicMeta} numberOfLines={1}>
              {postCountText}
            </Text>
          ) : null}
        </View>
        {onFollow != null && (
          <Pressable
            style={[
              styles.topicFollowBtn,
              typedItem.isFollowing && styles.followingButton,
            ]}
            onPress={(e: { stopPropagation?: () => void }) => {
              e?.stopPropagation?.();
              onFollow();
            }}
            accessibilityRole="button"
            accessibilityLabel={typedItem.isFollowing ? t("profile.following") : t("profile.follow")}
          >
            <Text
              style={[
                styles.followButtonText,
                typedItem.isFollowing && styles.followingButtonText,
              ]}
            >
              {typedItem.isFollowing ? t("profile.following") : t("profile.follow")}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

type TopicCardProps = { item: Record<string, unknown>; onPress: () => void; onFollow?: () => void };
export const TopicCard = memo(
  TopicCardInner as React.FunctionComponent<TopicCardProps>,
) as (props: TopicCardProps) => React.ReactElement | null;

export interface PersonCardProps {
  item: Record<string, unknown>;
  onPress: () => void;
  onFollow?: () => void;
  fullWidth?: boolean;
}

function PersonCardInner({
  item,
  onPress,
  onFollow,
  fullWidth,
}: PersonCardProps) {
  const avatarUri = getAvatarUri(item);
  const displayName = item.displayName as string | undefined;
  const handle = item.handle as string | undefined;
  const initial = (displayName || handle || "?")
    .charAt(0)
    .toUpperCase();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.personCard, fullWidth && styles.personCardFullWidth]}
      accessibilityRole="button"
      accessibilityLabel={`View profile ${displayName || handle || ""}`}
    >
      <View style={styles.personRow}>
        <View style={styles.avatar}>
          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <Text style={styles.avatarText}>{initial}</Text>
          )}
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName} numberOfLines={1}>
            {displayName || handle}
          </Text>
          <Text style={styles.personHandle}>@{handle}</Text>
          {item.bio ? (
            <Text style={styles.personBio} numberOfLines={2}>
              {item.bio as string}
            </Text>
          ) : null}
        </View>
      </View>
      {onFollow != null ? (
        <View style={styles.personSecondRow}>
          <Pressable
            style={[
              styles.personFollowButton,
              item.isFollowing && styles.followingButton,
            ]}
            onPress={(e: { stopPropagation: () => void }) => {
              e.stopPropagation();
              onFollow();
            }}
            accessibilityRole="button"
            accessibilityLabel={item.isFollowing ? "FOLLOWING" : "FOLLOW"}
          >
            <Text
              style={[
                styles.personFollowButtonText,
                item.isFollowing && styles.followingButtonText,
              ]}
            >
              {item.isFollowing ? "FOLLOWING" : "FOLLOW"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

export const PersonCard = memo(
  PersonCardInner as React.FunctionComponent<PersonCardProps>,
) as (props: PersonCardProps) => React.ReactElement | null;

const styles = createStyles({
  topicCard: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  topicCardPressed: {
    opacity: 0.9,
  },
  topicRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  topicThumb: {
    width: TOPIC_THUMB_SIZE,
    height: TOPIC_THUMB_SIZE,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    marginRight: SPACING.m,
    overflow: "hidden",
  },
  topicThumbImage: {
    width: "100%",
    height: "100%",
  },
  topicThumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(110, 122, 138, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  topicInfo: {
    flex: 1,
    minWidth: 0,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  topicExcerpt: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 18,
  },
  topicMeta: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  topicFollowBtn: {
    marginLeft: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    flexShrink: 0,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  followingButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  followingButtonText: {
    color: COLORS.ink,
  },
  personCard: {
    padding: SPACING.xl, // p-5
    backgroundColor: COLORS.hover, // bg-white/5
    borderRadius: SIZES.borderRadius,
    marginHorizontal: LAYOUT.contentPaddingHorizontal,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: COLORS.divider, // border-white/10
  },
  personCardFullWidth: {
    marginHorizontal: 0,
    width: "100%",
  },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.l, // gap-4
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.divider,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 20, // text-xl
    fontWeight: "700", // font-bold
    color: COLORS.primary, // text-primary
    fontFamily: FONTS.semiBold,
  },
  personInfo: {
    flex: 1,
    minWidth: 0,
  },
  personSecondRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  personWhy: {
    flex: 1,
  },
  personName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  personHandle: {
    fontSize: 14,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  personBio: {
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 6,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    opacity: 0.95,
  },
  personFollowButton: {
    paddingHorizontal: SPACING.m,
    paddingVertical: 6,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: "center",
  },
  personFollowButtonText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
