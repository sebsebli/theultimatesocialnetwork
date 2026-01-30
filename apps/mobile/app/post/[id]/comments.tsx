import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialIcons } from '@expo/vector-icons';
import { api } from '../../../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER } from '../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/auth';
import { useToast } from '../../../context/ToastContext';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { MarkdownText } from '../../../components/MarkdownText';
import { ReportModal } from '../../../components/ReportModal';

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  author?: { id: string; handle?: string; displayName?: string };
  authorId?: string;
  parentReplyId?: string | null;
  privateLikeCount?: number;
  isLiked?: boolean;
}

export default function PostCommentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const { showSuccess, showError } = useToast();
  const postId = params.id as string;
  const [replies, setReplies] = useState<Reply[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [reportReplyId, setReportReplyId] = useState<string | null>(null);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  const loadReplies = useCallback(async () => {
    try {
      const raw = await api.get<Reply[] | { items?: Reply[] }>(`/posts/${postId}/replies`);
      const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
      setReplies(list);
      setLikedReplies(new Set(list.filter((r: Reply) => r.isLiked).map((r: Reply) => r.id)));
    } catch (e) {
      console.error('Failed to load comments', e);
      setReplies([]);
    }
  }, [postId]);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const [postData, repliesData] = await Promise.all([
        api.get<{ title?: string }>(`/posts/${postId}`),
        api.get<Reply[] | { items?: Reply[] }>(`/posts/${postId}/replies`),
      ]);
      setPostTitle(postData?.title ?? null);
      const list = Array.isArray(repliesData)
        ? repliesData
        : (repliesData && typeof repliesData === 'object' && 'items' in repliesData && Array.isArray((repliesData as any).items))
          ? (repliesData as any).items
          : [];
      setReplies(list);
      setLikedReplies(new Set(list.filter((r: Reply) => r.isLiked).map((r: Reply) => r.id)));
    } catch (error) {
      console.error('Failed to load comments', error);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);


  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || !isAuthenticated) return;
    setSubmittingComment(true);
    try {
      await api.post(`/posts/${postId}/replies`, { body });
      setCommentDraft('');
      showSuccess(t('post.commentPosted', 'Comment posted'));
      await loadReplies();
    } catch (error) {
      console.error('Failed to post comment', error);
      showError(t('post.commentFailed'));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeReply = async (replyId: string, currentlyLiked: boolean) => {
    if (!isAuthenticated) return;
    setLikedReplies((prev) => {
      const next = new Set(prev);
      if (currentlyLiked) next.delete(replyId);
      else next.add(replyId);
      return next;
    });
    try {
      if (currentlyLiked) {
        await api.delete(`/posts/${postId}/replies/${replyId}/like`);
      } else {
        await api.post(`/posts/${postId}/replies/${replyId}/like`);
      }
      await loadReplies();
    } catch (e) {
      setLikedReplies((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.add(replyId);
        else next.delete(replyId);
        return next;
      });
      showError(t('post.reportError', 'Failed'));
    }
  };

  const handleReportCommentSubmit = async (replyId: string, reason: string, comment?: string) => {
    try {
      await api.post('/safety/report', {
        targetId: replyId,
        targetType: 'REPLY',
        reason,
        comment,
      });
      showSuccess(t('post.reportSuccess', 'Post reported successfully'));
    } catch (e) {
      showError(t('post.reportError', 'Failed to report post'));
      throw e;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScreenHeader
        title={`${t('post.comments')}${replies.length > 0 ? ` (${replies.length})` : ''}`}
        paddingTop={insets.top}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {postTitle ? (
          <Text style={styles.postTitleLabel} numberOfLines={1}>
            {postTitle}
          </Text>
        ) : null}

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
                style={styles.commentAuthorLeft}
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
              <Pressable
                onPress={() => setReportReplyId(reply.id)}
                hitSlop={12}
                style={styles.menuButton}
              >
                <MaterialIcons name="more-horiz" size={HEADER.iconSize} color={COLORS.tertiary} />
              </Pressable>
            </View>
            <View style={styles.commentMeta}>
              <Text style={styles.commentTime}>
                {new Date(reply.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
            <View style={styles.commentBodyWrap}>
              <MarkdownText>{reply.body}</MarkdownText>
              {/* Any user can like any comment; like count is visible only to the comment author */}
              {userId && (
                <View style={styles.commentLikeRow}>
                  <Pressable
                    style={styles.commentLikeBtn}
                    onPress={() => handleLikeReply(reply.id, likedReplies.has(reply.id))}
                  >
                    <MaterialIcons
                      name={likedReplies.has(reply.id) ? 'favorite' : 'favorite-border'}
                      size={HEADER.iconSize}
                      color={likedReplies.has(reply.id) ? COLORS.like : COLORS.tertiary}
                    />
                    <Text style={styles.commentLikeLabel}>
                      {(reply.authorId === userId || reply.author?.id === userId) &&
                        reply.privateLikeCount !== undefined &&
                        reply.privateLikeCount > 0
                        ? t('post.privateLikedBy', { count: reply.privateLikeCount, defaultValue: `Liked by ${reply.privateLikeCount}` })
                        : t('post.like')}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add comment - fixed at bottom */}
      {isAuthenticated && (
        <View style={[styles.commentInputBar, { paddingBottom: insets.bottom + SPACING.m }]}>
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
            style={[
              styles.commentPostBtn,
              (!commentDraft.trim() || submittingComment) && styles.commentPostBtnDisabled,
            ]}
            onPress={submitComment}
            disabled={!commentDraft.trim() || submittingComment}
          >
            <Text style={styles.commentPostBtnText}>
              {submittingComment ? t('common.loading') : t('post.postComment')}
            </Text>
          </Pressable>
        </View>
      )}

      <ReportModal
        visible={!!reportReplyId}
        onClose={() => setReportReplyId(null)}
        onReport={(reason: string, comment: string) =>
          reportReplyId
            ? handleReportCommentSubmit(reportReplyId, reason, comment)
            : Promise.resolve()
        }
        title={t('post.reportTitle', 'Report Comment')}
        targetType="REPLY"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.l, paddingTop: SPACING.l },
  postTitleLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginBottom: SPACING.m,
    fontFamily: FONTS.regular,
  },
  emptyText: {
    color: COLORS.secondary,
    fontFamily: FONTS.regular,
    fontStyle: 'italic',
    paddingVertical: SPACING.xl,
  },
  commentRow: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  commentAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.s,
    flex: 1,
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
  menuButton: { padding: SPACING.xs },
  commentMeta: { marginBottom: SPACING.xs },
  commentTime: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
    marginLeft: 36,
  },
  commentBodyWrap: {
    marginLeft: 36,
  },
  commentLikeRow: {
    marginTop: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingRight: SPACING.s,
  },
  commentLikeLabel: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentInputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: SPACING.m,
    paddingHorizontal: SPACING.l,
    paddingTop: SPACING.m,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
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
  commentPostBtnDisabled: { opacity: 0.5 },
  commentPostBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
});
