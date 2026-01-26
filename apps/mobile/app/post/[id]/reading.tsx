import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

  const printToPdf = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Georgia', serif; padding: 40px; color: black; line-height: 1.6; }
            h1 { font-size: 28px; margin-bottom: 10px; font-weight: normal; }
            .meta { font-size: 14px; color: #666; margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .content { font-size: 18px; }
            .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>${post.title || 'Untitled Post'}</h1>
          <div class="meta">
            By ${post.author?.displayName || post.author?.handle} • ${new Date(post.createdAt).toLocaleDateString()}
          </div>
          <div class="content">
            ${post.body}
          </div>
          <div class="footer">
            Archived on Cite (https://cite.app/post/${post.id})
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  if (loading || !post) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.doneButton}>Done</Text>
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={printToPdf} style={styles.iconButton}>
            <MaterialIcons name="picture-as-pdf" size={22} color={COLORS.paper} />
          </Pressable>
          <Pressable style={styles.textSizeButton}>
            <Text style={styles.textSizeIcon}>TT</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.article}>
        {post.title && <Text style={styles.title}>{post.title}</Text>}
        <View style={styles.authorLine}>
          <View style={styles.authorAvatar} />
          <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle}</Text>
          <Text style={styles.readTime}>8 min read</Text>
        </View>
        <MarkdownText>{post.body}</MarkdownText>
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
  container: { flex: 1, backgroundColor: COLORS.ink },
  content: { paddingHorizontal: SPACING.xxl, paddingBottom: SPACING.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.header, paddingBottom: SPACING.l, paddingHorizontal: SPACING.l },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m },
  iconButton: { padding: SPACING.xs },
  doneButton: { fontSize: 16, color: COLORS.secondary, fontFamily: FONTS.regular },
  textSizeButton: { padding: SPACING.xs },
  textSizeIcon: { fontSize: 16, fontWeight: '600', color: COLORS.paper, fontFamily: FONTS.semiBold },
  article: { maxWidth: 600, alignSelf: 'center', width: '100%' },
  loadingText: { color: COLORS.paper, textAlign: 'center', marginTop: SPACING.xxl },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.paper, marginBottom: SPACING.l, fontFamily: FONTS.semiBold },
  authorLine: { flexDirection: 'row', alignItems: 'center', gap: SPACING.m, marginBottom: SPACING.xl },
  authorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.hover },
  authorName: { fontSize: 14, color: COLORS.paper, fontFamily: FONTS.medium },
  readTime: { fontSize: 14, color: COLORS.tertiary, fontFamily: FONTS.regular },
  bottomBar: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, paddingVertical: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.divider },
  bottomBarButton: { padding: SPACING.s },
});