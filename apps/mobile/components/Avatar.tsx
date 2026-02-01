import React, { useState, memo } from 'react';
import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { COLORS, FONTS, createStyles } from '../constants/theme';

export interface AvatarProps {
  size?: number;
  uri?: string | null;
  name?: string;
  style?: unknown;
}

function AvatarInner({ size = 40, uri, name, style }: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  const fontSize = size * 0.4;
  const showImage = uri && !imageError;

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.hover }, style]}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
}

export const Avatar = memo(AvatarInner as React.FunctionComponent<AvatarProps>) as (props: AvatarProps) => React.ReactElement | null;

const styles = createStyles({
  fallback: {
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  text: {
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
