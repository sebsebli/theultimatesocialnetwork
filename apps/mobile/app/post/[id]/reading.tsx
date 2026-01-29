import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Alert, ActivityIndicator, Linking, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { api } from '../../../utils/api';
import { MarkdownText } from '../../../components/MarkdownText';
import { COLORS, SPACING, SIZES, FONTS } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/auth';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';

interface Post {
  id: string;
  title?: string;
  body: string;
  createdAt: string;
  headerImageKey?: string | null;
  author?: {
    displayName?: string;
    handle?: string;
  };
}

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  author?: { id: string; handle?: string; displayName?: string };
  parentReplyId?: string | null;
}

export default function ReadingModeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const postId = params.id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadReplies = useCallback(async () => {
    try {
      const list = await api.get<Reply[]>(`/posts/${postId}/replies`);
      setReplies(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load comments', e);
      setReplies([]);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const [postData, sourcesData, repliesData] = await Promise.all([
        api.get(`/posts/${postId}`),
        api.get(`/posts/${postId}/sources`).catch(() => []),
        api.get(`/posts/${postId}/replies`).catch(() => []),
      ]);
      setPost(postData);
      setSources(sourcesData);
      setReplies(Array.isArray(repliesData) ? repliesData : []);
    } catch (error) {
      console.error('Failed to load post', error);
      Alert.alert(t('common.error'), t('post.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || !isAuthenticated) return;
    setSubmittingComment(true);
    try {
      await api.post(`/posts/${postId}/replies`, { body });
      setCommentDraft('');
      await loadReplies();
    } catch (error) {
      console.error('Failed to post comment', error);
      Alert.alert(t('common.error'), t('post.commentFailed'));
    } finally {
      setSubmittingComment(false);
    }
  };


  const printToPdf = async () => {
    if (!post) return;

    try {
      const html = `
        <html>
          <head>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Serif:wght@400;600&display=swap');
              body { 
                font-family: 'IBM Plex Serif', serif; 
                padding: 40px; 
                color: #1a1a1a; 
                line-height: 1.6; 
                max-width: 800px; 
                margin: 0 auto; 
              }
              h1 { font-size: 32px; margin-bottom: 8px; font-weight: 600; line-height: 1.2; }
              .meta { font-size: 14px; color: #666; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee; font-family: sans-serif; }
              .content { font-size: 18px; color: #333; }
              .content p { margin-bottom: 1.4em; }
              .footer { margin-top: 50px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; font-family: sans-serif; }
            </style>
          </head>
          <body>
            <h1>${post.title || 'Untitled Post'}</h1>
            <div class="meta">
              By ${post.author?.displayName || post.author?.handle} • ${new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <div class="content">
              ${post.body.split('\n').map((p: string) => p.trim() ? `<p>${p}</p>` : '').join('')}
            </div>
            <div class="footer">
              Archived via CITE (https://cite.app/post/${post.id})
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF generation failed', error);
      Alert.alert(t('common.error'), 'Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={24} color={COLORS.secondary} />
        </Pressable>
        <View style={styles.headerRight}>
          <Pressable onPress={toggleTextSize} style={styles.iconButton}>
            <MaterialIcons name="format-size" size={22} color={COLORS.secondary} />
          </Pressable>
          <Pressable onPress={printToPdf} style={styles.iconButton}>
            <MaterialIcons name="print" size={22} color={COLORS.secondary} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              Alert.alert(
                t('post.reportTitle', 'Report Post'),
                t('post.reportMessage', 'Are you sure you want to report this post?'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('post.report', 'Report'),
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await api.post('/safety/report', { targetId: post.id, targetType: 'POST', reason: 'Reported from reading view' });
                        Alert.alert(t('common.success', 'Done'), t('post.reportSuccess', 'Post reported successfully'));
                      } catch (e) {
                        console.error(e);
                        Alert.alert(t('common.error'), t('post.reportError', 'Failed to report post'));
                      }
                    },
                  },
                ]
              );
            }}
          >
            <MaterialIcons name="flag" size={22} color={COLORS.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.article}>
          {/* Hero image first (full width) */}
          {(post.headerImageKey != null && post.headerImageKey !== '') && (
            <View style={styles.heroImageWrap}>
              <Image
                source={{ uri: `${API_BASE}/images/${post.headerImageKey}` }}
                style={styles.heroImage}
                contentFit="cover"
              />
            </View>
          )}
          {/* Title below image */}
          {post.title != null && post.title !== '' ? (
            <Text style={styles.title}>{post.title}</Text>
          ) : null}
          {/* Author line */}
          <Pressable
            style={styles.authorLine}
            onPress={() => post.author?.handle && router.push(`/user/${post.author.handle}`)}
          >
            <View style={styles.authorAvatar}>
              <Text style={styles.avatarText}>{post.author?.displayName?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.authorName}>{post.author?.displayName || post.author?.handle}</Text>
              <Text style={styles.readTime}>{new Date(post.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            </View>
          </Pressable>

          <MarkdownText>{post.body}</MarkdownText>

          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/post/compose', params: { replyTo: post.id } })}>
              <MaterialIcons name="chat-bubble-outline" size={22} color={COLORS.tertiary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => router.push({ pathname: '/post/compose', params: { quote: post.id } })}>
              <MaterialIcons name="format-quote" size={22} color={COLORS.tertiary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => { }}>
              <MaterialIcons name="bookmark-border" size={22} color={COLORS.tertiary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(`https://cite.app/post/${post.id}`).catch(() => { })}>
              <MaterialIcons name="share" size={22} color={COLORS.tertiary} />
            </Pressable>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('post.comments')} {replies.length > 0 ? `(${replies.length})` : ''}
          </Text>
          {replies.length === 0 && !isAuthenticated && (
            <Text style={styles.emptyText}>{t('post.signInToComment')}</Text>
          )}
          {replies.length === 0 && isAuthenticated && (
            <Text style={styles.emptyText}>{t('post.noComments')}</Text>
          )}
          {replies.map((reply) => (
            <View key={reply.id} style={styles.commentRow}>
              <View style={styles.commentAuthorRow}>
                <Pressable
                  onPress={() => reply.author?.handle && router.push(`/user/${reply.author.handle}`)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.s, flex: 1 }}
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarTextSmall}>
                      {reply.author?.displayName?.charAt(0) || reply.author?.handle?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <Text style={styles.commentAuthorName} numberOfLines={1}>
                    {reply.author?.displayName || reply.author?.handle || t('post.unknownUser')}
                  </Text>
                </Pressable>
                <Text style={styles.commentTime}>
                  {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={styles.commentBody}>{reply.body}</Text>
            </View>
          ))}
          {isAuthenticated && (
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('post.addComment')}
                placeholderTextColor={COLORS.tertiary}
                value={commentDraft}
                onChangeText={setCommentDraft}
                multiline
                maxLength={2000}
                editable={!submittingComment}
              />
              <Pressable
                style={[styles.commentPostBtn, (!commentDraft.trim() || submittingComment) && styles.commentPostBtnDisabled]}
                onPress={submitComment}
                disabled={!commentDraft.trim() || submittingComment}
              >
                <Text style={styles.commentPostBtnText}>
                  {submittingComment ? t('common.loading') : t('post.postComment')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Sources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sources</Text>
          {sources.length === 0 ? (
            <Text style={styles.emptyText}>No external sources found.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {sources.map((source: any, index: number) => {
                const handleSourcePress = () => {
                  if (source.type === 'external' && source.url) Linking.openURL(source.url).catch(() => { });
                  else if (source.type === 'post' && source.id) router.push(`/post/${source.id}`);
                  else if (source.type === 'user' && source.handle) router.push(`/user/${source.handle}`);
                  else if (source.type === 'topic' && source.slug) router.push(`/topic/${source.slug}`);
                };
                let label = 'Source';
                if (source.type === 'external' && source.url) {
                  try { label = new URL(source.url).hostname.replace('www.', ''); } catch { label = 'Link'; }
                } else if (source.type === 'post') label = 'Post';
                else if (source.type === 'user') label = 'User';
                else if (source.type === 'topic') label = 'Topic';
                return (
                  <Pressable key={source.id || index} style={styles.sourceItem} onPress={handleSourcePress}>
                    <Text style={styles.sourceIndex}>{index + 1}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sourceDomain}>{label}</Text>
                      <Text style={styles.sourceTitle} numberOfLines={2}>
                        {source.title || source.url || source.handle || source.slug || ''}
                      </Text>
                    </View>
                    <MaterialIcons name="north-east" size={16} color={COLORS.tertiary} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar: share */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 10 }]}>
        <Pressable style={styles.bottomBarButton} onPress={() => Linking.openURL(`https://cite.app/post/${post.id}`).catch(() => { })}>
          <MaterialIcons name="share" size={24} color={COLORS.tertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: SPACING.l, paddingBottom: 100 },
  heroImageWrap: {
    width: '100%',
    marginHorizontal: -SPACING.l,
    marginBottom: SPACING.m,
  },
  heroImage: {
    width: '100%',
    height: 220,
    backgroundColor: COLORS.divider,
  },
  article: {
    marginTop: SPACING.l,
    marginBottom: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: SPACING.l },
  iconButton: { padding: SPACING.xs },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.paper,
    marginBottom: SPACING.l,
    fontFamily: FONTS.serifSemiBold,
    lineHeight: 34,
  },
  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.m,
    marginBottom: SPACING.xl,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(110, 122, 138, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  authorName: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.medium
  },
  readTime: {
    fontSize: 13,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular
  },

  section: {
    marginTop: SPACING.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.paper,
    marginBottom: SPACING.m,
    fontFamily: FONTS.semiBold,
  },
  emptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
  },
  commentRow: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    marginBottom: SPACING.xs,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.hover,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTextSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  commentAuthorName: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.semiBold,
    flex: 1,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentBody: {
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    lineHeight: 22,
    paddingLeft: 36,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.m,
    marginTop: SPACING.l,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  commentPostBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: SIZES.borderRadius,
    justifyContent: 'center',
    minHeight: 44,
  },
  commentPostBtnDisabled: {
    opacity: 0.5,
  },
  commentPostBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 8,
  },
  sourceIndex: {
    color: COLORS.tertiary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
  },
  sourceDomain: {
    color: COLORS.primary,
    fontSize: 12,
    marginBottom: 2,
    fontFamily: FONTS.medium,
    textTransform: 'uppercase',
  },
  sourceTitle: {
    color: COLORS.secondary,
    fontSize: 16,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingTop: SPACING.l,
    paddingBottom: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionBtn: { padding: SPACING.s },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xxxl,
    paddingTop: SPACING.l,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider
  },
  bottomBarButton: { alignItems: 'center', padding: SPACING.s },
  bottomBarLabel: { color: COLORS.tertiary, fontSize: 12, marginTop: 2 },
  errorText: { color: COLORS.error, fontSize: 16, fontFamily: FONTS.medium },
});
