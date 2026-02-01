import { useState, useEffect, useCallback } from 'react';
import {
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
import { api } from '../../../../utils/api';
import { COLORS, SPACING, SIZES, FONTS, HEADER, LAYOUT, createStyles } from '../../../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../../context/auth';
import { useToast } from '../../../../context/ToastContext';
import { ScreenHeader } from '../../../../components/ScreenHeader';
import { MarkdownText } from '../../../../components/MarkdownText';
import { ReportModal } from '../../../../components/ReportModal';
import { EmptyState } from '../../../../components/EmptyState';

const COMMENT_MIN_LENGTH = 2;
const COMMENT_MAX_LENGTH = 1000;

function normalizeParam(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value || undefined;
  if (Array.isArray(value) && value.length > 0) return String(value[0]) || undefined;
  return undefined;
}

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

export default function SubcommentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const { showSuccess, showError } = useToast();
  const postId = normalizeParam(params.id);
  const parentReplyId = normalizeParam(params.replyId);
  const [parentReply, setParentReply] = useState<Reply | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportReplyId, setReportReplyId] = useState<string | null>(null);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());

  const loadParentAndReplies = useCallback(async () => {
    if (!postId || !parentReplyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [parentData, repliesData] = await Promise.all([
        api.get<Reply>(`/posts/${postId}/replies/${parentReplyId}`),
        api.get<Reply[] | { items?: Reply[] }>(`/posts/${postId}/replies?parentReplyId=${parentReplyId}`),
      ]);
      setParentReply(parentData);
      const list = Array.isArray(repliesData)
        ? repliesData
        : (repliesData && typeof repliesData === 'object' && 'items' in repliesData && Array.isArray((repliesData as any).items))
          ? (repliesData as any).items
          : [];
      setReplies(list);
      setLikedReplies(new Set(list.filter((r: Reply) => r.isLiked).map((r: Reply) => r.id)));
    } catch (e) {
      console.error('Failed to load replies', e);
      setParentReply(null);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [postId, parentReplyId]);

  useEffect(() => {
    loadParentAndReplies();
  }, [loadParentAndReplies]);

  const loadReplies = useCallback(async () => {
    if (!postId || !parentReplyId) return;
    try {
      const raw = await api.get<Reply[] | { items?: Reply[] }>(`/posts/${postId}/replies?parentReplyId=${parentReplyId}`);
      const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
      setReplies(list);
      setLikedReplies(new Set(list.filter((r: Reply) => r.isLiked).map((r: Reply) => r.id)));
    } catch (e) {
      console.error('Failed to load replies', e);
    }
  }, [postId, parentReplyId]);

  const submitComment = async () => {
    const body = commentDraft.trim();
    if (!body || !isAuthenticated) return;
    if (body.length < COMMENT_MIN_LENGTH) {
      showError(t('post.commentTooShort', 'Comment must be at least {{min}} characters.', { min: COMMENT_MIN_LENGTH }));
      return;
    }
    if (body.length > COMMENT_MAX_LENGTH) {
      showError(t('post.commentTooLong', 'Comment must be at most {{max}} characters.', { max: COMMENT_MAX_LENGTH }));
      return;
    }
    setSubmittingComment(true);
    try {
      await api.post(`/posts/${postId}/replies`, { body, parentReplyId });
      setCommentDraft('');
      showSuccess(t('post.commentPosted', 'Comment posted'));
      await loadReplies();
    } catch (error) {
      console.error('Failed to post reply', error);
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

  const handleReportSubmit = async (replyId: string, reason: string, comment?: string) => {
    try {
      await api.post('/safety/report', {
        targetId: replyId,
        targetType: 'REPLY',
        reason,
        comment,
      });
      showSuccess(t('post.reportSuccess', 'Report submitted'));
    } catch (e) {
      showError(t('post.reportError', 'Failed to report'));
      throw e;
    }
  };

  if (!postId || !parentReplyId) {
    return (
      <View style={[styles.container, styles.center]}>
        <ScreenHeader title={t('post.repliesToComment', 'Replies')} paddingTop={insets.top} />
        <Text style={styles.errorText}>{t('post.replyNotFound', 'Comment not found')}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>{t('common.close')}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !parentReply) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!parentReply && !loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{t('post.replyNotFound', 'Comment not found')}</Text>
        <Pressable style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>{t('common.close')}</Text>
        </Pressable>
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
        title={t('post.repliesToComment', 'Replies')}
        paddingTop={insets.top}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        {parentReply && (
          <View style={styles.parentCommentSection}>
            <Text style={styles.sectionLabel}>{t('post.parentComment', 'Comment')}</Text>
            <View style={styles.commentRow}>
              <View style={styles.commentAuthorRow}>
                <Pressable
                  onPress={() => parentReply.author?.handle && router.push(`/user/${parentReply.author.handle}`)}
                  style={styles.commentAuthorLeft}
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarTextSmall}>
                      {parentReply.author?.displayName?.charAt(0) || parentReply.author?.handle?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <Text style={styles.commentAuthorName} numberOfLines={1}>
                    {parentReply.author?.displayName || parentReply.author?.handle || t('post.unknownUser')}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.commentMeta}>
                <Text style={styles.commentTime}>
                  {new Date(parentReply.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <View style={styles.commentBodyWrap}>
                <MarkdownText>{parentReply.body}</MarkdownText>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionLabel}>
          {replies.length === 0
            ? t('post.replies', 'Replies')
            : t('post.replyCountLabel', '{{count}} replies', { count: replies.length })}
        </Text>

        {replies.length === 0 ? (
          <EmptyState
            icon="chat-bubble-outline"
            headline={isAuthenticated ? t('post.noRepliesYet', 'No replies yet. Be the first.') : t('post.signInToComment', 'Sign in to reply')}
            subtext={isAuthenticated ? t('post.addReplyBelow', 'Add a reply below.') : undefined}
          />
        ) : null}
        {(Array.isArray(replies) ? replies : []).map((reply) => (
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

      <View style={[styles.commentInputBar, { paddingBottom: insets.bottom + SPACING.m }]}>
        {isAuthenticated ? (
          <>
            <View style={styles.commentInputWrap}>
              <TextInput
                style={styles.commentInput}
                placeholder={t('post.addReply', 'Add a reply...')}
                placeholderTextColor={COLORS.tertiary}
                value={commentDraft}
                onChangeText={setCommentDraft}
                multiline
                maxLength={COMMENT_MAX_LENGTH}
                editable={!submittingComment}
              />
              <Text style={styles.commentCharCount}>
                {commentDraft.length}/{COMMENT_MAX_LENGTH}
              </Text>
            </View>
            <Pressable
              style={[
                styles.commentPostBtn,
                (commentDraft.trim().length < COMMENT_MIN_LENGTH || commentDraft.length > COMMENT_MAX_LENGTH || submittingComment) && styles.commentPostBtnDisabled,
              ]}
              onPress={submitComment}
              disabled={commentDraft.trim().length < COMMENT_MIN_LENGTH || commentDraft.length > COMMENT_MAX_LENGTH || submittingComment}
            >
              <Text style={styles.commentPostBtnText}>
                {submittingComment ? t('common.loading') : t('post.postComment')}
              </Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.commentInputPlaceholder}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <MaterialIcons name="chat-bubble-outline" size={HEADER.iconSize} color={COLORS.tertiary} style={styles.commentPlaceholderIcon} />
            <Text style={styles.commentInputPlaceholderText}>{t('post.signInToComment')}</Text>
          </Pressable>
        )}
      </View>

      <ReportModal
        visible={!!reportReplyId}
        onClose={() => setReportReplyId(null)}
        onReport={(reason: string, comment: string) =>
          reportReplyId ? handleReportSubmit(reportReplyId, reason, comment) : Promise.resolve()
        }
        title={t('post.reportTitle', 'Report Comment')}
        targetType="REPLY"
      />
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: LAYOUT.contentPaddingHorizontal, paddingTop: SPACING.l },
  errorText: { color: COLORS.tertiary, fontSize: 16, fontFamily: FONTS.medium },
  backLink: { marginTop: SPACING.m },
  backLinkText: { color: COLORS.primary, fontSize: 16, fontFamily: FONTS.semiBold },
  parentCommentSection: { marginBottom: SPACING.xl },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.s,
    fontFamily: FONTS.semiBold,
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
  commentBodyWrap: { marginLeft: 36 },
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
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  commentInputWrap: { flex: 1, position: 'relative' },
  commentInput: {
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    paddingBottom: 28,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  commentCharCount: {
    position: 'absolute',
    bottom: 6,
    right: SPACING.m,
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentInputPlaceholder: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  commentPlaceholderIcon: { marginRight: SPACING.s },
  commentInputPlaceholderText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentPostBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
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
