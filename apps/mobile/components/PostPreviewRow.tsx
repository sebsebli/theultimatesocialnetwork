import React, { memo, useCallback } from 'react';
import { Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { getImageUrl } from '../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER, createStyles } from '../constants/theme';

const THUMB_ASPECT = 4 / 3;
const THUMB_WIDTH = 80;

interface PostPreviewRowProps {
  post: {
    id: string;
    title?: string | null;
    body?: string | null;
    headerImageKey?: string | null;
    headerImageUrl?: string | null;
    author?: { displayName?: string; handle?: string } | null;
  };
}

/** Small post preview for "Quoted by" and similar lists: thumb + title + author + one-line body. */
function PostPreviewRowInner({ post }: PostPreviewRowProps) {
  const router = useRouter();
  const thumbHeight = Math.round(THUMB_WIDTH / THUMB_ASPECT);
  const imageUri = (post.headerImageKey ? getImageUrl(post.headerImageKey) : null)
    || (post as { headerImageUrl?: string }).headerImageUrl;

  const handlePress = useCallback(() => {
    if (post.title) router.push(`/post/${post.id}/reading`);
    else router.push(`/post/${post.id}`);
  }, [post.id, post.title, router]);

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

export const PostPreviewRow = memo(PostPreviewRowInner as React.FunctionComponent<PostPreviewRowProps>) as (props: PostPreviewRowProps) => React.ReactElement | null;

const styles = createStyles({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    marginHorizontal: SPACING.l,
    marginBottom: SPACING.s,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    gap: SPACING.m,
  },
  rowPressed: { opacity: 0.8 },
  thumb: { borderRadius: SIZES.borderRadius, backgroundColor: COLORS.divider },
  thumbPlaceholder: {
    borderRadius: SIZES.borderRadius,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  author: { fontSize: 13, color: COLORS.tertiary, fontFamily: FONTS.regular, marginBottom: 2 },
  bodyLine: { fontSize: 13, color: COLORS.secondary, fontFamily: FONTS.regular },
});
