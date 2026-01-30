import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';
import { getApiBaseUrl } from '../utils/api';

const PREVIEW_ASPECT = 16 / 9;

export interface CollectionCardItem {
  id: string;
  title: string;
  description?: string | null;
  itemCount: number;
  previewImageKey?: string | null;
}

interface CollectionCardProps {
  item: CollectionCardItem;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  showMenu?: boolean;
}

export function CollectionCard({
  item,
  onPress,
  onLongPress,
  onMenuPress,
  showMenu = false,
}: CollectionCardProps) {
  const imageUri = item.previewImageKey
    ? `${getApiBaseUrl()}/images/${encodeURIComponent(item.previewImageKey)}`
    : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={styles.previewWrap}>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.previewImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.previewPlaceholder}>
            <MaterialIcons name="folder" size={48} color={COLORS.tertiary} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          {showMenu && (
            <Pressable
              hitSlop={12}
              style={({ pressed: p }) => [styles.menuBtn, p && { opacity: 0.7 }]}
              onPress={(e) => {
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
        <Text style={styles.count}>
          {t('collections.itemCount', { count: item.itemCount })}
        </Text>
        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  previewWrap: {
    width: '100%',
    aspectRatio: PREVIEW_ASPECT,
    backgroundColor: COLORS.divider,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.l,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
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
  count: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  description: {
    fontSize: 14,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    lineHeight: 20,
  },
});
