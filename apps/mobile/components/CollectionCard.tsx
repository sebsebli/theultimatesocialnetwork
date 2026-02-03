import React, { memo } from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../constants/theme';
import { getImageUrl } from '../utils/api';

const COLLECTION_HEADER_ASPECT = 16 / 9;

export interface CollectionCardItem {
  id: string;
  title: string;
  description?: string | null;
  itemCount: number;
  previewImageKey?: string | null;
  recentPost?: {
    id?: string;
    title?: string | null;
    bodyExcerpt?: string | null;
    headerImageKey?: string | null;
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
  const imageUrl =
    (item.recentPost?.headerImageKey ? getImageUrl(item.recentPost.headerImageKey) : null) ||
    (item.previewImageKey ? getImageUrl(item.previewImageKey) : null) ||
    null;
  const latestTitle = (item.recentPost?.title ?? '').trim() || null;
  const latestExcerpt = (item.recentPost?.bodyExcerpt ?? '').trim() || null;
  const lastArticlePreview = latestTitle || latestExcerpt || (item.description ?? '').trim() || null;

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[styles.headerWrap, { aspectRatio: COLLECTION_HEADER_ASPECT }]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.headerImage} resizeMode="cover" />
        ) : (
          <View style={styles.headerPlaceholder}>
            <MaterialIcons name="folder" size={28} color={COLORS.tertiary} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {showMenu && (
            <Pressable
              hitSlop={12}
              style={({ pressed }: { pressed: boolean }) => [styles.menuBtn, pressed && { opacity: 0.7 }]}
              onPress={(e: { stopPropagation: () => void }) => {
                e.stopPropagation();
                onMenuPress?.();
              }}
              accessibilityLabel="Options"
              accessibilityRole="button"
            >
              <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={COLORS.tertiary} />
            </Pressable>
          )}
        </View>
        {lastArticlePreview ? (
          <Text style={styles.lastArticle} numberOfLines={2}>
            {lastArticlePreview}
          </Text>
        ) : null}
      </View>
      <View style={styles.footer}>
        <Text style={styles.count}>
          {t('collections.itemCount', { count: item.itemCount })}
        </Text>
      </View>
    </Pressable>
  );
}

export const CollectionCard = memo(CollectionCardInner as React.FunctionComponent<CollectionCardProps>) as (props: CollectionCardProps) => React.ReactElement | null;

const styles = createStyles({
  card: {
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius * 1.5,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: 'hidden',
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.m,
  },
  cardPressed: {
    opacity: 0.9,
  },
  headerWrap: {
    width: '100%',
    backgroundColor: COLORS.divider,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(110, 122, 138, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: SPACING.l,
    paddingBottom: SPACING.s,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  menuBtn: {
    padding: SPACING.xs,
  },
  lastArticle: {
    fontSize: 13,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  count: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
});
