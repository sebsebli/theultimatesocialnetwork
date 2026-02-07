import React, { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../constants/theme";
import { getCollectionPreviewImageUri } from "../utils/api";

const COLLECTION_THUMB_SIZE = 48;

export interface CollectionCardItem {
  id: string;
  title: string;
  description?: string | null;
  itemCount: number;
  previewImageKey?: string | null;
  previewImageUrl?: string | null;
  recentPost?: {
    id?: string;
    title?: string | null;
    bodyExcerpt?: string | null;
    headerImageKey?: string | null;
    headerImageUrl?: string | null;
  } | null;
}

interface CollectionCardProps {
  item: CollectionCardItem;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

function CollectionCardInner({
  item,
  onPress,
  onLongPress,
  onMenuPress,
  showMenu = false,
}: CollectionCardProps) {
  const { t } = useTranslation();
  const imageUrl = getCollectionPreviewImageUri(item);
  const latestTitle = (item.recentPost?.title ?? "").trim() || null;
  const latestExcerpt = (item.recentPost?.bodyExcerpt ?? "").trim() || null;
  const excerpt =
    latestTitle || latestExcerpt || (item.description ?? "").trim() || null;
  const countText = t("collections.itemCount", { count: item.itemCount });

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.row}>
        <View style={styles.thumb}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialIcons name="folder" size={24} color={COLORS.tertiary} />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {showMenu && (
              <Pressable
                hitSlop={12}
                style={({ pressed }: { pressed: boolean }) => [
                  styles.menuBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={(e: { stopPropagation: () => void }) => {
                  e.stopPropagation();
                  onMenuPress?.();
                }}
                accessibilityLabel="Options"
                accessibilityRole="button"
              >
                <MaterialIcons
                  name="more-horiz"
                  size={HEADER.iconSize}
                  color={COLORS.tertiary}
                />
              </Pressable>
            )}
          </View>
          {excerpt ? (
            <Text style={styles.excerpt} numberOfLines={2}>
              {excerpt}
            </Text>
          ) : null}
          <Text style={styles.count} numberOfLines={1}>
            {countText}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const CollectionCard = memo(
  CollectionCardInner as React.FunctionComponent<CollectionCardProps>,
) as (props: CollectionCardProps) => React.ReactElement | null;

const styles = createStyles({
  card: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    paddingVertical: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
  },
  cardPressed: {
    opacity: 0.9,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumb: {
    width: COLLECTION_THUMB_SIZE,
    height: COLLECTION_THUMB_SIZE,
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    marginRight: SPACING.m,
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.badge,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  menuBtn: {
    padding: SPACING.xs,
  },
  excerpt: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 2,
    lineHeight: 18,
  },
  count: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
});
