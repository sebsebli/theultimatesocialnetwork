import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";

export type SourceOrPostCardType = "post" | "topic" | "user" | "external";

export interface SourceOrPostCardProps {
  type: SourceOrPostCardType;
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
  /** For list key; optional if parent provides key */
  testID?: string;
  /** User: profile/avatar image. Topic: most recent post image. Shown instead of icon/initial when set. */
  imageUri?: string | null;
}

/** Accent color per source type – matches MarkdownText @/topic/post/link colors from design-tokens */
function getSourceAccentColor(type: SourceOrPostCardType): string {
  switch (type) {
    case "user":
      return COLORS.mention ?? COLORS.primary;
    case "topic":
      return COLORS.topic ?? COLORS.primary;
    case "external":
      return COLORS.link ?? COLORS.primary;
    case "post":
      return COLORS.postLink ?? COLORS.primary;
    default:
      return COLORS.primary;
  }
}

const AVATAR_SIZE = 40;

/**
 * Single shared card for sources and post references: icon/avatar/image + title + subtitle + chevron.
 * Uses design-tokens mention/topic/link/postLink for icon/avatar accent. Users show profile image when imageUri set; topics show latest post image.
 */
function SourceOrPostCardInner({
  type,
  title,
  subtitle,
  onPress,
  imageUri,
}: SourceOrPostCardProps) {
  const iconName =
    type === "post"
      ? "article"
      : type === "topic"
        ? "tag"
        : type === "external"
          ? "link"
          : "person";
  const showAvatar = type === "user";
  const showImage =
    (type === "user" || type === "topic") &&
    imageUri &&
    imageUri.trim().length > 0;
  const initial = (title || "?").charAt(0).toUpperCase();
  const accentColor = getSourceAccentColor(type);

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${type} ${title}${subtitle ? `, ${subtitle}` : ""}`}
    >
      <View style={styles.cardLeft}>
        {showAvatar || type === "topic" ? (
          <View
            style={[
              styles.avatar,
              !showImage && { backgroundColor: `${accentColor}22` },
            ]}
          >
            {showImage ? (
              <Image
                source={{ uri: imageUri! }}
                style={styles.avatarImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
              />
            ) : showAvatar ? (
              <Text style={[styles.avatarText, { color: accentColor }]}>
                {initial}
              </Text>
            ) : (
              <MaterialIcons
                name={iconName as keyof typeof MaterialIcons.glyphMap}
                size={HEADER.iconSize}
                color={accentColor}
              />
            )}
          </View>
        ) : (
          <View
            style={[styles.iconWrap, { backgroundColor: `${accentColor}22` }]}
          >
            <MaterialIcons
              name={iconName as keyof typeof MaterialIcons.glyphMap}
              size={HEADER.iconSize}
              color={accentColor}
            />
          </View>
        )}
        <View style={styles.cardText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <MaterialIcons
        name="chevron-right"
        size={HEADER.iconSize}
        color={COLORS.tertiary}
      />
    </Pressable>
  );
}

export const SourceOrPostCard = memo(
  SourceOrPostCardInner as React.FC<SourceOrPostCardProps>,
) as (props: SourceOrPostCardProps) => React.ReactElement | null;

const styles = createStyles({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  cardPressed: { opacity: 0.9 },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
    overflow: "hidden",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONTS.semiBold,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.m,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
