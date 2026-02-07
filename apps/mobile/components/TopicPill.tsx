import React from "react";
import { Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  FONTS,
  createStyles,
} from "../constants/theme";

export interface TopicPillProps {
  title: string;
  slug: string;
  postCount?: number;
  /** Show shared-post count badge instead of postCount */
  sharedPosts?: number;
  /** When false, pill is not pressable (e.g. composer preview) */
  navigable?: boolean;
  /** Show chevron arrow */
  showChevron?: boolean;
}

export function TopicPill({
  title,
  slug,
  postCount,
  sharedPosts,
  navigable = true,
  showChevron = true,
}: TopicPillProps): React.JSX.Element {
  const router = useRouter();

  const count = sharedPosts ?? postCount ?? 0;
  const countLabel =
    sharedPosts != null && sharedPosts > 0
      ? `${sharedPosts}`
      : count > 0
        ? `${count} post${count !== 1 ? "s" : ""}`
        : null;

  const inner = (
    <>
      <MaterialIcons name="tag" size={15} color={COLORS.primary} />
      <Text style={styles.title}>{title}</Text>
      {countLabel != null && (
        <>
          <Text style={styles.dot}>·</Text>
          <Text style={styles.count}>{countLabel}</Text>
        </>
      )}
      {showChevron && navigable && (
        <MaterialIcons name="chevron-right" size={16} color={COLORS.tertiary} />
      )}
    </>
  );

  if (!navigable) {
    return <View style={styles.pill}>{inner}</View>;
  }

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.pill,
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
      onPress={() => router.push(`/topic/${encodeURIComponent(slug)}`)}
    >
      {inner}
    </Pressable>
  );
}

const styles = createStyles({
  pill: {
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
  title: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  dot: {
    fontSize: 14,
    color: COLORS.tertiary,
    marginHorizontal: 1,
  },
  count: {
    fontSize: 12,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
});
