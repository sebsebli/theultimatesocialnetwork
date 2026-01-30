import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../constants/theme';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const THUMB_ASPECT = 4 / 3;
const THUMB_WIDTH = 80;

/** Small post preview for "Quoted by" and similar lists: thumb + title + author + one-line body. */
export function PostPreviewRow({ post }: { post: any }) {
  const router = useRouter();
  const thumbHeight = Math.round(THUMB_WIDTH / THUMB_ASPECT);
  const imageUri = (post as any).headerImageUrl
    || (post.headerImageKey ? `${API_BASE}/images/${post.headerImageKey}` : null);

  const handlePress = () => {
    if (post.title) router.push(`/post/${post.id}/reading`);
    else router.push(`/post/${post.id}`);
  };

  const bodyPreview = (post.body ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const authorName = post.author?.displayName || post.author?.handle || '';

  return (
    <Pressable
      style={({ pressed }: { pressed: boolean }) => [styles.row, pressed && styles.rowPressed]}
      onPress={handlePress}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.thumb, { width: THUMB_WIDTH, height: thumbHeight }]}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbPlaceholder, { width: THUMB_WIDTH, height: thumbHeight }]}>
          <MaterialIcons name="article" size={HEADER.iconSize} color={COLORS.tertiary} />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{post.title || bodyPreview || 'Post'}</Text>
        {authorName ? <Text style={styles.author} numberOfLines={1}>{authorName}</Text> : null}
        {bodyPreview && !post.title ? <Text style={styles.bodyLine} numberOfLines={1}>{bodyPreview}</Text> : null}
      </View>
      <MaterialIcons name="chevron-right" size={HEADER.iconSize} color={COLORS.tertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    backgroundColor: COLORS.ink,
    gap: SPACING.m,
  },
  rowPressed: { backgroundColor: COLORS.hover },
  thumb: { borderRadius: SIZES.borderRadius, backgroundColor: COLORS.divider },
  thumbPlaceholder: {
    borderRadius: SIZES.borderRadius,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  author: { fontSize: 13, color: COLORS.tertiary, fontFamily: FONTS.regular, marginTop: 2 },
  bodyLine: { fontSize: 13, color: COLORS.secondary, fontFamily: FONTS.regular, marginTop: 2 },
});
