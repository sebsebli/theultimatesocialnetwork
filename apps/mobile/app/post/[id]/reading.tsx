import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../utils/api';
import { MarkdownText } from '../../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';

export default function ReadingModeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const postId = params.id as string;
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await api.get(`/posts/${postId}`);
      setPost(data);
    } catch (error) {
      console.error('Failed to load post', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !post) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable 
          onPress={() => router.back()}
          accessibilityLabel="Done"
          accessibilityRole="button"
        >
          <Text style={styles.doneButton}>Done</Text>
        </Pressable>
        <Pressable 
          style={styles.textSizeButton}
          accessibilityLabel="Text size"
          accessibilityRole="button"
        >
          <Text style={styles.textSizeIcon}>TT</Text>
        </Pressable>
      </View>

      <View style={styles.article}>
        {post.title && (
          <Text style={styles.title}>{post.title}</Text>
        )}
        <View style={styles.authorLine}>
          <View style={styles.authorAvatar} />
          <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle}</Text>
          <Text style={styles.readTime}>8 min read</Text>
        </View>
        <MarkdownText>{post.body}</MarkdownText>
        {post.headerImageKey && (
          <View style={styles.headerImage}>
            <Text style={styles.imagePlaceholder}>{t('post.headerImage')}</Text>
          </View>
        )}
      </View>

      <View style={styles.sourcesSection}>
        <Pressable style={styles.sourceButton}>
          <Text style={styles.sourceLabel}>SOURCES</Text>
          <Text style={styles.sourceCount}>3</Text>
          <MaterialIcons name="add" size={20} color={COLORS.tertiary} />
        </Pressable>
        <Pressable style={styles.sourceButton}>
          <Text style={styles.sourceLabel}>REFERENCED BY</Text>
          <Text style={styles.sourceCount}>12</Text>
          <MaterialIcons name="add" size={20} color={COLORS.tertiary} />
        </Pressable>
      </View>

      <View style={styles.bottomBar}>
        <Pressable style={styles.bottomBarButton}>
          <MaterialIcons name="bookmark-border" size={20} color={COLORS.tertiary} />
        </Pressable>
        <Pressable style={styles.bottomBarButton}>
          <MaterialIcons name="share" size={20} color={COLORS.tertiary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.ink,
  },
  content: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.header,
    paddingBottom: SPACING.l,
    paddingHorizontal: SPACING.l,
  },
  doneButton: {
    fontSize: 16,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  textSizeButton: {
    padding: SPACING.xs,
  },
  textSizeIcon: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
  },
  article: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.paper,
    lineHeight: 40,
    marginBottom: SPACING.l,
    fontFamily: FONTS.serifSemiBold, // IBM Plex Serif for content
    letterSpacing: -0.5,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.xxl,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.secondary,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.secondary,
    fontFamily: FONTS.medium,
  },
  readTime: {
    fontSize: 15,
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
  },
  headerImage: {
    width: '100%',
    height: 300,
    backgroundColor: COLORS.divider,
    borderRadius: SIZES.borderRadius,
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  sourcesSection: {
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.l,
    gap: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    marginTop: SPACING.xxl,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.m,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  sourceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: FONTS.semiBold,
  },
  sourceCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    marginLeft: 'auto',
    marginRight: SPACING.s,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.l,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    backgroundColor: COLORS.ink,
    gap: SPACING.xxl,
  },
  bottomBarButton: {
    padding: SPACING.s,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: SPACING.xxxl,
    fontFamily: FONTS.regular,
  },
});
