import React, { memo } from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { useRouter } from "expo-router";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";

export interface ConnectionCardProps {
  type: "post" | "topic" | "external" | "user";
  id: string;
  label: string;
  subtitle?: string;
  bodyExcerpt?: string; // for posts
  replyCount?: number; // for posts
  // Post-specific
  authorHandle?: string;
  authorDisplayName?: string;
  authorAvatarKey?: string;
  quoteCount?: number;
  // Topic-specific
  slug?: string;
  postCount?: number;
  // External-specific
  url?: string;
  domain?: string;
}

function ConnectionCardInner({
  type,
  id,
  label,
  subtitle,
  bodyExcerpt,
  replyCount,
  authorHandle,
  quoteCount,
  slug,
  postCount,
  url,
  domain,
}: ConnectionCardProps) {
  const router = useRouter();

  const handlePress = () => {
    if (type === "post") {
      router.push(`/post/${id}/reading`);
    } else if (type === "topic") {
      router.push(`/topic/${slug || label}`);
    } else if (type === "user") {
      router.push(`/user/${authorHandle || id}`);
    } else if (type === "external" && url) {
      Linking.openURL(url).catch(() => {
        // Handle error silently
      });
    }
  };

  const typeLabel =
    type === "external"
      ? domain || "Link"
      : type === "topic"
        ? "Topic"
        : type === "user"
          ? "Profile"
          : authorHandle
            ? `@${authorHandle}`
            : "Post";

  const excerpt = bodyExcerpt || subtitle;
  const showConnectionBadge =
    type === "post" && quoteCount != null && quoteCount > 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        type === "topic" && styles.cardTopic,
        type === "external" && styles.cardExternal,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel}: ${label}`}
    >
      <Text style={styles.typeLabel} numberOfLines={1}>
        {typeLabel}
      </Text>
      <Text style={styles.mainLabel} numberOfLines={2}>
        {label}
      </Text>
      {type === "post" && excerpt && (
        <Text style={styles.excerpt} numberOfLines={2}>
          {excerpt}
        </Text>
      )}
      <View style={styles.footer}>
        {type === "topic" && postCount != null && postCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeIcon}>#</Text>
            <Text style={styles.badgeText}>{postCount}</Text>
          </View>
        )}
        {showConnectionBadge && (
          <View style={styles.connectionBadge}>
            <Text style={styles.connectionBadgeText}>{quoteCount} cites</Text>
          </View>
        )}
        {type === "external" && domain && (
          <Text style={styles.domainLabel} numberOfLines={1}>
            {domain}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const ConnectionCard = memo(
  ConnectionCardInner as React.FC<ConnectionCardProps>,
) as (props: ConnectionCardProps) => React.ReactElement | null;

const styles = createStyles({
  card: {
    width: 200,
    minHeight: 110,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.xs,
    justifyContent: "space-between",
  },
  cardTopic: {
    borderColor: COLORS.primary, // Subtle primary tint
  },
  cardExternal: {
    borderColor: COLORS.divider,
  },
  cardPressed: {
    opacity: 0.8,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 20,
    flexShrink: 1,
  },
  excerpt: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 16,
    marginTop: SPACING.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.xs,
    flexWrap: "wrap",
    gap: SPACING.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeIcon: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FONTS.mono,
  },
  badgeText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  connectionBadge: {
    backgroundColor: COLORS.hover,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: SIZES.borderRadiusPill,
  },
  connectionBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  domainLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
    flex: 1,
  },
});
