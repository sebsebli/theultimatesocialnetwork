import React, { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../constants/theme';

export type SourceOrPostCardType = 'post' | 'topic' | 'user' | 'external';

export interface SourceOrPostCardProps {
  type: SourceOrPostCardType;
  title: string;
  subtitle?: string | null;
  onPress?: () => void;
  /** For list key; optional if parent provides key */
  testID?: string;
}

/**
 * Single shared card for sources and post references: icon/avatar + title + subtitle + chevron.
 * Used in Sources section, Referenced by, Quoted by, and Quotes list so layout is consistent everywhere.
 */
function SourceOrPostCardInner({ type, title, subtitle, onPress }: SourceOrPostCardProps) {
  const iconName =
    type === 'post' ? 'article' : type === 'topic' ? 'tag' : type === 'external' ? 'link' : 'person';
  const showAvatar = type === 'user';
  const initial = (title || '?').charAt(0).toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardLeft}>
        {showAvatar ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        ) : (
          <View style={styles.iconWrap}>
            <MaterialIcons name={iconName as any} size={HEADER.iconSize} color={COLORS.primary} />
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
      <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
    </Pressable>
  );
}

export const SourceOrPostCard = memo(SourceOrPostCardInner);

const styles = createStyles({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  cardPressed: { opacity: 0.9 },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  cardText: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
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
