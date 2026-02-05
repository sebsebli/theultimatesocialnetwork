import React, { useEffect, useRef, memo } from "react";
import { View, Animated, ViewStyle } from "react-native";
import {
  COLORS,
  SPACING,
  SIZES,
  LAYOUT,
  HEADER,
  createStyles,
} from "../constants/theme";

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
  borderRadius?: number;
}

function SkeletonInner({
  width = "100%",
  height = 20,
  style,
  borderRadius = 4,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, []);

  const AnimatedView = Animated.View as any;
  return (
    <AnimatedView
      style={[styles.skeleton, { width, height, borderRadius, opacity }, style]}
    />
  );
}

export const Skeleton = memo(
  SkeletonInner as React.FunctionComponent<SkeletonProps>,
) as (props: SkeletonProps) => React.ReactElement | null;

export function PostSkeleton() {
  return (
    <View style={styles.postContainer}>
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      <View style={styles.body}>
        <Skeleton width="90%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={16} />
      </View>
      <View style={styles.footer}>
        <Skeleton width={20} height={20} />
        <Skeleton width={20} height={20} />
        <Skeleton width={20} height={20} />
      </View>
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <Skeleton
          width={96}
          height={96}
          borderRadius={48}
          style={{ marginBottom: 16 }}
        />
        <Skeleton width={180} height={24} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={16} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={16} style={{ marginBottom: 24 }} />
        <View style={styles.statsRow}>
          <View style={styles.statsSkeletonWrap}>
            <Skeleton width="100%" height={40} />
          </View>
          <View style={styles.statsSkeletonWrap}>
            <Skeleton width="100%" height={40} />
          </View>
          <View style={styles.statsSkeletonWrap}>
            <Skeleton width="100%" height={40} />
          </View>
        </View>
      </View>
    </View>
  );
}

/** Multiple post skeletons for feed loading */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.feedContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <PostSkeleton key={i} />
      ))}
    </View>
  );
}

/** User/list row: avatar + 2 lines (connections, suggestions) */
export function UserCardSkeleton() {
  return (
    <View style={styles.userCardRow}>
      <Skeleton width={48} height={48} borderRadius={24} />
      <View style={styles.userCardText}>
        <Skeleton width={140} height={16} style={{ marginBottom: 6 }} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
}

/** Conversation list row: avatar + 2 lines */
export function MessageRowSkeleton() {
  return (
    <View style={styles.messageRow}>
      <Skeleton width={52} height={52} borderRadius={26} />
      <View style={styles.messageRowText}>
        <Skeleton width={120} height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={14} />
      </View>
    </View>
  );
}

/** List of message rows for messages screen */
export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, i) => (
        <MessageRowSkeleton key={i} />
      ))}
    </View>
  );
}

/** Comment: avatar + lines */
export function CommentSkeleton() {
  return (
    <View style={styles.commentRow}>
      <Skeleton width={36} height={36} borderRadius={18} />
      <View style={styles.commentText}>
        <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
        <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={14} />
      </View>
    </View>
  );
}

/** Settings/list row: icon + 2 lines */
export function SettingsRowSkeleton() {
  return (
    <View style={styles.settingsRow}>
      <Skeleton width={24} height={24} borderRadius={6} />
      <View style={styles.settingsRowText}>
        <Skeleton width={160} height={16} style={{ marginBottom: 4 }} />
        <Skeleton width={100} height={14} />
      </View>
    </View>
  );
}

/** Pill for loading button */
export function ButtonSkeleton({
  width = 120,
  height = 44,
}: {
  width?: number;
  height?: number;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={22}
      style={styles.buttonSkeleton}
    />
  );
}

/** Small inline shimmer (replaces spinner in search bar, etc.) */
export function InlineSkeleton() {
  return (
    <View style={styles.inlineSkeletonWrap}>
      <Skeleton width={20} height={20} borderRadius={10} />
    </View>
  );
}

/** Footer row for list load more */
export function ListFooterSkeleton() {
  return (
    <View style={styles.footerSkeleton}>
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

/** Centered full-screen placeholder (app init, auth) */
export function FullScreenSkeleton() {
  return (
    <View style={styles.fullScreen}>
      <Skeleton
        width={64}
        height={64}
        borderRadius={32}
        style={{ marginBottom: SPACING.l }}
      />
      <Skeleton width={120} height={20} style={{ marginBottom: 8 }} />
      <Skeleton width={80} height={16} />
    </View>
  );
}

/** Topic/card row: image + title + meta */
export function TopicCardSkeleton() {
  return (
    <View style={styles.topicCardRow}>
      <Skeleton width={56} height={56} borderRadius={8} />
      <View style={styles.topicCardText}>
        <Skeleton width={140} height={18} style={{ marginBottom: 6 }} />
        <Skeleton width={80} height={14} />
      </View>
    </View>
  );
}

const styles = createStyles({
  skeleton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  postContainer: {
    padding: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  headerText: {
    marginLeft: SPACING.m,
  },
  body: {
    marginBottom: SPACING.l,
  },
  footer: {
    flexDirection: "row",
    gap: SPACING.xl,
  },
  profileContainer: {
    marginTop: Number(HEADER.iconCircleSize) + Number(HEADER.barPaddingBottom),
    padding: SPACING.l,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    width: "100%",
    alignItems: "center",
    alignSelf: "stretch",
  },
  profileHeader: {
    alignItems: "center",
    width: "100%",
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.m,
    marginTop: SPACING.l,
    width: "100%",
  },
  statsSkeletonWrap: {
    flex: 1,
    minWidth: 0,
  },
  feedContainer: {
    paddingVertical: SPACING.s,
  },
  userCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  userCardText: {
    marginLeft: SPACING.m,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  messageRowText: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  listContainer: {
    paddingVertical: SPACING.s,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  commentText: {
    marginLeft: SPACING.m,
    flex: 1,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  settingsRowText: {
    marginLeft: SPACING.m,
  },
  buttonSkeleton: {
    alignSelf: "center",
  },
  inlineSkeletonWrap: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSkeleton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.ink,
  },
  topicCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  topicCardText: {
    marginLeft: SPACING.m,
  },
});
