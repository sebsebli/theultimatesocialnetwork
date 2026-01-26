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

  const [fontSize, setFontSize] = useState(18);

  const toggleTextSize = () => {
    setFontSize(prev => prev >= 24 ? 16 : prev + 2);
  };

  const printToPdf = async () => {
    const html = `
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap');
            body { font-family: 'Source Serif 4', 'Georgia', serif; padding: 60px; color: #1a1a1a; line-height: 1.7; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 36px; margin-bottom: 12px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.2; }
            .meta { font-size: 15px; color: #666; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 24px; font-family: sans-serif; }
            .content { font-size: 19px; color: #333; }
            .content p { margin-bottom: 1.5em; }
            .footer { margin-top: 60px; font-size: 13px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 24px; font-family: sans-serif; }
          </style>
        </head>
        <body>
          <h1>${post.title || 'Untitled Post'}</h1>
          <div class="meta">
            By ${post.author?.displayName || post.author?.handle} • ${new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div class="content">
            ${post.body.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
          </div>
          <div class="footer">
            Archived via CITE (https://cite.app/post/${post.id})
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  };

  // ... inside render
      <View style={styles.article}>
        {post.title && <Text style={styles.title}>{post.title}</Text>}
        <View style={styles.authorLine}>
          <View style={styles.authorAvatar}>
             <Text style={styles.avatarText}>{post.author?.displayName?.charAt(0) || '?'}</Text>
          </View>
          <View>
            <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle}</Text>
            <Text style={styles.readTime}>Published {new Date(post.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>
        <MarkdownText fontSize={fontSize}>{post.body}</MarkdownText>
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
  authorAvatar: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  authorName: { fontSize: 14, color: COLORS.paper, fontFamily: FONTS.medium },
  readTime: { fontSize: 14, color: COLORS.tertiary, fontFamily: FONTS.regular },
  bottomBar: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.xl, paddingVertical: SPACING.l, borderTopWidth: 1, borderTopColor: COLORS.divider },
  bottomBarButton: { padding: SPACING.s },
});