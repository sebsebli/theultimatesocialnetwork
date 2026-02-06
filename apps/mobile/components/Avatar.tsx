import React, { useState, memo } from 'react';
import { View, Text, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, createStyles } from '../constants/theme';

export interface AvatarProps {
  size?: number;
  uri?: string | null;
  name?: string;
  style?: ViewStyle;
}

function AvatarInner({ size = 40, uri, name, style }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.4;
  const showImage = uri && !imageError;
  const accessibilityLabel = name ? `${name}'s avatar` : 'User avatar';

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.divider }, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => setImageError(true)}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View
      style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    >
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
}

export const Avatar = memo(AvatarInner as React.FunctionComponent<AvatarProps>) as (props: AvatarProps) => React.ReactElement | null;

const styles = createStyles({
  fallback: {
    backgroundColor: COLORS.hover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  text: {
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
