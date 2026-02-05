import React, { memo } from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  createStyles,
  toDimensionValue,
} from "../constants/theme";
import { HeaderIconButton } from "./HeaderIconButton";

export type TopicCollectionType = "topic" | "collection";

const HERO_ASPECT = 3 / 4;

export interface TopicCollectionHeaderProps {
  type: TopicCollectionType;
  title: string;
  description?: string | null;
  /** Header/hero image URI (most recent post's header image). */
  headerImageUri?: string | null;
  onBack: () => void;
  onAction?: () => void;
  actionLabel?: string;
  isActionActive?: boolean;
  /** Topic: post count & contributor count. Collection: optional. */
  metrics?: {
    postCount?: number;
    contributorCount?: number;
    itemCount?: number;
  };
  /** Show search icon (topic), more menu (collection), or nothing. */
  rightAction?: "search" | "more" | null;
  onRightAction?: () => void;
  children?: React.ReactNode;
}

/**
 * Shared header for Topic and Collection screens:
 * - Optional hero image (from a random post when available)
 * - Title and optional description
 * - Back button, optional primary action (Follow / Share)
 * - Optional metrics row
 * - Children e.g. tabs (topic) or extra content
 */
function TopicCollectionHeaderInner({
  type,
  title,
  description,
  headerImageUri,
  onBack,
  onAction,
  actionLabel,
  isActionActive,
  metrics,
  rightAction,
  onRightAction,
  children,
}: TopicCollectionHeaderProps) {
  const hasHero = !!headerImageUri;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, hasHero && styles.wrapperRelative]}>
      {hasHero ? (
        <View style={styles.heroContainer}>
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: headerImageUri! }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            {/* Title overlay: same pattern as post reading – bar at bottom of hero */}
            <View style={styles.heroTitleOverlay} pointerEvents="box-none">
              <View style={styles.heroTitleRow}>
                <View style={styles.heroTitleContent}>
                  <Text style={styles.heroTitleText} numberOfLines={2}>
                    {title}
                  </Text>
                  {metrics &&
                    (metrics.postCount != null ||
                      metrics.contributorCount != null ||
                      metrics.itemCount != null) && (
                      <View style={styles.metricsRow}>
                        {(metrics.postCount != null ||
                          metrics.itemCount != null) && (
                          <Text style={styles.heroMetricText}>
                            {(
                              metrics.postCount ??
                              metrics.itemCount ??
                              0
                            ).toLocaleString()}{" "}
                            {type === "collection" ? "items" : "posts"}
                          </Text>
                        )}
                        {metrics.contributorCount != null && (
                          <>
                            {(metrics.postCount != null ||
                              metrics.itemCount != null) && (
                              <Text style={styles.heroMetricText}> • </Text>
                            )}
                            <Text style={styles.heroMetricText}>
                              {metrics.contributorCount.toLocaleString()}{" "}
                              contributors
                            </Text>
                          </>
                        )}
                      </View>
                    )}
                </View>
                {onAction && actionLabel && (
                  <Pressable
                    style={[
                      styles.heroActionButton,
                      isActionActive && styles.actionButtonActive,
                    ]}
                    onPress={onAction}
                  >
                    <Text
                      style={[
                        styles.actionButtonText,
                        isActionActive && styles.actionButtonTextActive,
                      ]}
                    >
                      {actionLabel}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          <View
            style={[styles.overlayBar, { paddingTop: insets.top + SPACING.s }]}
            pointerEvents="box-none"
          >
            <HeaderIconButton
              onPress={onBack}
              icon="arrow-back"
              accessibilityLabel="Go back"
            />
            <View style={styles.headerBarSpacer} />
            {rightAction === "search" && onRightAction && (
              <HeaderIconButton
                onPress={onRightAction}
                icon="search"
                accessibilityLabel={type === "topic" ? "Search" : "Search"}
              />
            )}
            {rightAction === "more" && onRightAction && (
              <HeaderIconButton
                onPress={onRightAction}
                icon="more-horiz"
                accessibilityLabel="More options"
              />
            )}
          </View>
        </View>
      ) : null}
      {!hasHero ? (
        <View style={styles.header}>
          <View style={styles.headerBar}>
            <HeaderIconButton
              onPress={onBack}
              icon="arrow-back"
              accessibilityLabel="Go back"
            />
            <View style={styles.headerBarSpacer} />
            {rightAction === "search" && onRightAction && (
              <HeaderIconButton
                onPress={onRightAction}
                icon="search"
                accessibilityLabel={type === "topic" ? "Search" : "Search"}
              />
            )}
            {rightAction === "more" && onRightAction && (
              <HeaderIconButton
                onPress={onRightAction}
                icon="more-horiz"
                accessibilityLabel="More options"
              />
            )}
          </View>
          <View style={styles.overlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.title}>{title}</Text>
              {metrics &&
                (metrics.postCount != null ||
                  metrics.contributorCount != null ||
                  metrics.itemCount != null) && (
                  <View style={styles.metricsRow}>
                    {(metrics.postCount != null ||
                      metrics.itemCount != null) && (
                      <Text style={styles.metricText}>
                        {(
                          metrics.postCount ??
                          metrics.itemCount ??
                          0
                        ).toLocaleString()}{" "}
                        {type === "collection" ? "items" : "posts"}
                      </Text>
                    )}
                    {metrics.contributorCount != null && (
                      <>
                        {(metrics.postCount != null ||
                          metrics.itemCount != null) && (
                          <Text style={styles.metricText}> • </Text>
                        )}
                        <Text style={styles.metricText}>
                          {metrics.contributorCount.toLocaleString()}{" "}
                          contributors
                        </Text>
                      </>
                    )}
                  </View>
                )}
            </View>
            {onAction && actionLabel && (
              <Pressable
                style={[
                  styles.actionButton,
                  isActionActive && styles.actionButtonActive,
                ]}
                onPress={onAction}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    isActionActive && styles.actionButtonTextActive,
                  ]}
                >
                  {actionLabel}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : null}

      {description ? (
        <View style={styles.descriptionBlock}>
          <View style={styles.descriptionBorder} />
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      ) : null}

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

export const TopicCollectionHeader = memo(
  TopicCollectionHeaderInner as React.FunctionComponent<TopicCollectionHeaderProps>,
) as (props: TopicCollectionHeaderProps) => React.ReactElement | null;

const styles = createStyles({
  wrapper: {
    backgroundColor: COLORS.ink,
    marginBottom: SPACING.m,
  },
  wrapperRelative: {
    position: "relative",
  },
  heroContainer: {
    position: "relative",
  },
  overlayBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingTop: SPACING.s,
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
    zIndex: 10,
  },
  heroWrap: {
    width: "100%",
    aspectRatio: 1 / HERO_ASPECT,
    backgroundColor: COLORS.divider,
    position: "relative",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  /* Title overlay at bottom of hero – same as post reading (heroTitleOverlay / heroTitleText) */
  heroTitleOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.l,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: SPACING.m,
  },
  heroTitleContent: {
    flex: 1,
    minWidth: 0,
  },
  heroTitleText: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    lineHeight: 34,
  },
  heroMetricText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  heroActionButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
  },
  header: {
    width: "100%",
    paddingHorizontal: toDimensionValue(HEADER.barPaddingHorizontal),
    paddingTop: SPACING.s,
    paddingBottom: toDimensionValue(HEADER.barPaddingBottom),
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.m,
  },
  headerBarSpacer: {
    flex: 1,
  },
  overlay: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  overlayContent: {
    flex: 1,
    marginRight: SPACING.m,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  metricsRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  metricText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  actionButton: {
    paddingHorizontal: SPACING.l,
    paddingVertical: 8,
    borderRadius: SIZES.borderRadiusPill,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: "transparent",
  },
  actionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  actionButtonTextActive: {
    color: COLORS.ink,
  },
  descriptionBlock: {
    flexDirection: "row",
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  descriptionBorder: {
    width: 2,
    backgroundColor: COLORS.primary,
    marginRight: SPACING.m,
  },
  descriptionText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.paper,
    lineHeight: 22,
    fontFamily: FONTS.regular,
  },
  children: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
});
