import React, { useCallback } from "react";
import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Avatar } from "./Avatar";
import { getAvatarUri } from "../utils/api";
import { formatRelativeTime } from "../utils/formatTime";
import {
  COLORS,
  SPACING,
  FONTS,
  HEADER,
  createStyles,
} from "../constants/theme";

export interface PostAuthorHeaderProps {
  /** "compact" = feed cards (relative time, 1-line bio). "full" = reading mode / preview (full date, 2-line bio). */
  variant?: "compact" | "full";
  author: {
    id?: string;
    handle?: string;
    displayName?: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  };
  createdAt: string;
  readingTimeMinutes?: number | null;
  /** When true, tapping the author navigates to their profile */
  navigable?: boolean;
  /** Optional menu button callback (shown on right side) */
  onMenuPress?: () => void;
}

export function PostAuthorHeader({
  variant = "compact",
  author,
  createdAt,
  readingTimeMinutes,
  navigable = true,
  onMenuPress,
}: PostAuthorHeaderProps): React.JSX.Element {
  const router = useRouter();
  const isFull = variant === "full";

  const avatarUri = getAvatarUri(
    author as { avatarKey?: string | null; avatarUrl?: string | null },
  );

  const handleAuthorPress = useCallback(() => {
    if (navigable && author.handle) {
      router.push(`/user/${author.handle}`);
    }
  }, [navigable, author.handle, router]);

  const displayName = author.displayName || author.handle || "Unknown";

  // Reading time display — compact clock-style (no "read" word)
  const readingTimeText =
    readingTimeMinutes != null && readingTimeMinutes > 0
      ? readingTimeMinutes < 1
        ? "< 1 min"
        : readingTimeMinutes >= 10
          ? "10+ min"
          : `${readingTimeMinutes} min`
      : null;

  // Date display — always relative (7h, 2d, 1y …)
  const dateText = formatRelativeTime(createdAt);

  const bio =
    typeof author.bio === "string" && author.bio.trim() !== ""
      ? author.bio.trim()
      : null;

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        pressed && navigable && { opacity: 0.7 },
      ]}
      onPress={handleAuthorPress}
      disabled={!navigable}
      accessibilityLabel={displayName}
      accessibilityRole="button"
    >
      {/* Avatar */}
      <Avatar name={displayName} size={isFull ? 42 : 40} uri={avatarUri} />

      {/* Author info */}
      <View style={styles.info}>
        {/* Top row: name · reading time (full) or name · date · reading time (compact) */}
        <View style={styles.nameRow}>
          <Text
            style={isFull ? styles.nameFull : styles.nameCompact}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          {/* Date + reading time always on one line for both variants */}
          <Text style={styles.dot}>·</Text>
          <Text style={styles.meta}>{dateText}</Text>
          {readingTimeText != null && (
            <>
              <Text style={styles.dot}>·</Text>
              <View style={styles.readingTimeWrap}>
                <MaterialIcons
                  name="schedule"
                  size={11}
                  color={COLORS.secondary}
                />
                <Text style={styles.meta}>{readingTimeText}</Text>
              </View>
            </>
          )}
        </View>

        {/* Bio */}
        {bio != null && (
          <Text style={styles.bio} numberOfLines={isFull ? 2 : 1}>
            {bio}
          </Text>
        )}
      </View>

      {/* Menu button */}
      {onMenuPress != null && (
        <Pressable
          onPress={onMenuPress}
          hitSlop={12}
          style={({ pressed }: { pressed: boolean }) => [
            styles.menuBtn,
            pressed && { opacity: 0.5 },
          ]}
          accessibilityLabel="More options"
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
  );
}

const styles = createStyles({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.m,
  },
  info: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  nameCompact: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
  },
  nameFull: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.medium,
    flexShrink: 1,
  },
  dot: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginHorizontal: 6,
  },
  meta: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  readingTimeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  bio: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  menuBtn: {
    padding: 4,
  },
});
