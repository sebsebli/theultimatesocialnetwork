import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../../../utils/api";
import { ActionButton } from "../../../../components/ActionButton";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../../../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../../context/auth";
import { useToast } from "../../../../context/ToastContext";
import { ScreenHeader } from "../../../../components/ScreenHeader";
import { MarkdownText } from "../../../../components/MarkdownText";
import { ReportModal } from "../../../../components/ReportModal";
import { OptionsActionSheet } from "../../../../components/OptionsActionSheet";
import { ConfirmModal } from "../../../../components/ConfirmModal";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../../../components/EmptyState";
import {
  CommentSkeleton,
  InlineSkeleton,
} from "../../../../components/LoadingSkeleton";
import * as Haptics from "expo-haptics";

const COMMENT_MIN_LENGTH = 2;
const COMMENT_MAX_LENGTH = 1000;

function normalizeParam(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value || undefined;
  if (Array.isArray(value) && value.length > 0)
    return String(value[0]) || undefined;
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
  subreplyCount?: number;
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
  const [commentDraft, setCommentDraft] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportReplyId, setReportReplyId] = useState<string | null>(null);
  const [replyMenuReplyId, setReplyMenuReplyId] = useState<string | null>(null);
  const [replyToDeleteId, setReplyToDeleteId] = useState<string | null>(null);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);

  const likedSet = useMemo(() => {
    const liked = new Set<string>();
    replies.forEach((r: Reply) => {
      if (r.isLiked) {
        liked.add(r.id);
      }
    });
    return liked;
  }, [replies]);

  const loadParentAndReplies = useCallback(async () => {
    if (!postId || !parentReplyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [parentData, repliesData] = await Promise.all([
        api.get<Reply>(`/posts/${postId}/replies/${parentReplyId}`),
        api.get<Reply[] | { items?: Reply[] }>(
          `/posts/${postId}/replies?parentReplyId=${parentReplyId}`,
        ),
      ]);
      setParentReply(parentData);
      const list = Array.isArray(repliesData)
        ? repliesData
        : repliesData &&
          typeof repliesData === "object" &&
          "items" in repliesData &&
          Array.isArray((repliesData as { items?: Reply[] }).items)
          ? ((repliesData as { items?: Reply[] }).items ?? [])
          : [];
      setReplies(list);
      const likedIds = new Set<string>();
      list.forEach((r: Reply) => {
        if (r.isLiked) {
          likedIds.add(r.id);
        }
      });
      setLikedReplies(likedIds);
    } catch (e) {
      if (__DEV__) console.error("Failed to load replies", e);
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
      const raw = await api.get<Reply[] | { items?: Reply[] }>(
        `/posts/${postId}/replies?parentReplyId=${parentReplyId}`,
      );
      const list = Array.isArray(raw) ? raw : (raw?.items ?? []);
      setReplies(list);
      const likedIds = new Set<string>();
      list.forEach((r: Reply) => {
        if (r.isLiked) {
          likedIds.add(r.id);
        }
      });
      setLikedReplies(likedIds);
    } catch (e) {
      if (__DEV__) console.error("Failed to load replies", e);
    }
  }, [postId, parentReplyId]);

  const submitComment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const body = commentDraft.trim();
    if (!body || !isAuthenticated) return;
    if (body.length < COMMENT_MIN_LENGTH) {
      showError(
        t(
          "post.commentTooShort",
          "Comment must be at least {{min}} characters.",
          { min: COMMENT_MIN_LENGTH },
        ),
      );
      return;
    }
    if (body.length > COMMENT_MAX_LENGTH) {
      showError(
        t(
          "post.commentTooLong",
          "Comment must be at most {{max}} characters.",
          { max: COMMENT_MAX_LENGTH },
        ),
      );
      return;
    }
    setSubmittingComment(true);
    try {
      await api.post(`/posts/${postId}/replies`, { body, parentReplyId });
      setCommentDraft("");
      showSuccess(t("post.commentPosted", "Comment posted"));
      await loadReplies();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: unknown) {
      if (__DEV__) console.error("Failed to post reply", error);
      const apiErr = error as { data?: { message?: string }; message?: string } | undefined;
      const message =
        apiErr?.data?.message ?? apiErr?.message ?? t("post.commentFailed");
      showError(
        typeof message === "string" ? message : t("post.commentFailed"),
      );
      setCommentDraft(body);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeReply = async (replyId: string, currentlyLiked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      showError(t("post.reportError", "Failed"));
    }
  };

  const handleReportSubmit = async (
    replyId: string,
    reason: string,
    comment?: string,
  ) => {
    try {
      await api.post("/safety/report", {
        targetId: replyId,
        targetType: "REPLY",
        reason,
        comment,
      });
      showSuccess(t("post.reportSuccess", "Report submitted"));
    } catch (e) {
      showError(t("post.reportError", "Failed to report"));
      throw e;
    }
  };

  const handleDeleteReply = async () => {
    if (!replyToDeleteId || !postId) return;
    try {
      await api.delete(`/posts/${postId}/replies/${replyToDeleteId}`);
      setReplies((prev) => prev.filter((r) => r.id !== replyToDeleteId));
      showSuccess(t("post.commentDeleted", "Comment deleted"));
    } catch (e: unknown) {
      const apiErr = e as { data?: { message?: string }; message?: string } | undefined;
      const msg =
        apiErr?.data?.message ??
        apiErr?.message ??
        t("post.commentDeleteFailed", "Failed to delete comment");
      showError(
        typeof msg === "string"
          ? msg
          : t("post.commentDeleteFailed", "Failed to delete comment"),
      );
    } finally {
      setReplyToDeleteId(null);
    }
  };

  if (!postId || !parentReplyId) {
    return (
      <View style={[styles.container, styles.center]}>
        <ScreenHeader
          title={t("post.repliesToComment", "Replies")}
          paddingTop={insets.top}
        />
        <Text style={styles.errorText}>
          {t("post.replyNotFound", "Comment not found")}
        </Text>
        <Pressable
          style={styles.backLink}
          onPress={() => router.back()}
          onLongPress={() => router.replace("/(tabs)" as any)}
          delayLongPress={400}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Go back")}
        >
          <Text style={styles.backLinkText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading && !parentReply) {
    return (
      <View style={styles.container}>
        <ScreenHeader
          title={t("post.reply", "Reply")}
          paddingTop={insets.top}
        />
        <View style={styles.commentSkeletonList}>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </View>
      </View>
    );
  }

  if (!parentReply && !loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>
          {t("post.replyNotFound", "Comment not found")}
        </Text>
        <Pressable
          style={styles.backLink}
          onPress={() => router.back()}
          onLongPress={() => router.replace("/(tabs)" as any)}
          delayLongPress={400}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Go back")}
        >
          <Text style={styles.backLinkText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <ScreenHeader
        title={t("post.repliesToComment", "Replies")}
        paddingTop={insets.top}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
          replies.length === 0 && { flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {parentReply && (
          <View style={styles.parentCommentSection}>
            <Text style={styles.sectionLabel}>
              {t("post.parentComment", "Comment")}
            </Text>
            <View style={styles.commentRow}>
              <View style={styles.commentAuthorRow}>
                <Pressable
                  onPress={() =>
                    parentReply.author?.handle &&
                    router.push(`/user/${parentReply.author.handle}`)
                  }
                  style={styles.commentAuthorLeft}
                  accessibilityRole="button"
                  accessibilityLabel={
                    parentReply.author?.displayName
                      ? t("common.viewProfile", "View profile") +
                      ` ${parentReply.author.displayName}`
                      : t("common.viewProfile", "View author")
                  }
                >
                  <View style={styles.commentAvatar}>
                    <Text style={styles.avatarTextSmall}>
                      {parentReply.author?.displayName?.charAt(0) ||
                        parentReply.author?.handle?.charAt(0) ||
                        "?"}
                    </Text>
                  </View>
                  <Text style={styles.commentAuthorName} numberOfLines={1}>
                    {parentReply.author?.displayName ||
                      parentReply.author?.handle ||
                      t("post.unknownUser")}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.commentMeta}>
                <Text style={styles.commentTime}>
                  {new Date(parentReply.createdAt).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
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
            ? t("post.replies", "Replies")
            : t("post.replyCountLabel", "{{count}} replies", {
              count: replies.length,
            })}
        </Text>

        {replies.length === 0 ? (
          <View style={emptyStateCenterWrapStyle}>
            <EmptyState
              icon="chat-bubble-outline"
              headline={
                isAuthenticated
                  ? t("post.noRepliesYet", "No replies yet. Be the first.")
                  : t("post.signInToComment", "Sign in to reply")
              }
              subtext={
                isAuthenticated
                  ? t("post.addReplyBelow", "Add a reply below.")
                  : undefined
              }
            />
          </View>
        ) : null}
        {(Array.isArray(replies) ? replies : []).map((reply) => (
          <View key={reply.id} style={styles.commentRow}>
            <View style={styles.commentAuthorRow}>
              <Pressable
                onPress={() =>
                  reply.author?.handle &&
                  router.push(`/user/${reply.author.handle}`)
                }
                style={styles.commentAuthorLeft}
                accessibilityRole="button"
                accessibilityLabel={
                  reply.author?.displayName
                    ? t("common.viewProfile", "View profile") +
                    ` ${reply.author.displayName}`
                    : t("common.viewProfile", "View author")
                }
              >
                <View style={styles.commentAvatar}>
                  <Text style={styles.avatarTextSmall}>
                    {reply.author?.displayName?.charAt(0) ||
                      reply.author?.handle?.charAt(0) ||
                      "?"}
                  </Text>
                </View>
                <Text style={styles.commentAuthorName} numberOfLines={1}>
                  {reply.author?.displayName ||
                    reply.author?.handle ||
                    t("post.unknownUser")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setReplyMenuReplyId(reply.id)}
                hitSlop={12}
                style={styles.menuButton}
                accessibilityRole="button"
                accessibilityLabel={t("common.options", "More options")}
              >
                <MaterialIcons
                  name="more-horiz"
                  size={HEADER.iconSize}
                  color={COLORS.tertiary}
                />
              </Pressable>
            </View>
            <View style={styles.commentMeta}>
              <Text style={styles.commentTime}>
                {new Date(reply.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.commentBodyWrap}>
              <MarkdownText>{reply.body}</MarkdownText>
              <View style={styles.commentActionsRow}>
                {userId && (
                  <ActionButton
                    icon="favorite-border"
                    activeIcon="favorite"
                    active={likedReplies.has(reply.id)}
                    activeColor={COLORS.like}
                    onPress={() =>
                      handleLikeReply(reply.id, likedReplies.has(reply.id))
                    }
                    label={
                      likedReplies.has(reply.id)
                        ? t("post.unlike", "Unlike")
                        : t("post.like", "Like")
                    }
                    count={
                      (reply.authorId === userId ||
                        reply.author?.id === userId) &&
                        reply.privateLikeCount !== undefined &&
                        reply.privateLikeCount > 0
                        ? reply.privateLikeCount
                        : undefined
                    }
                    size="sm"
                  />
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View
        style={[
          styles.commentInputBar,
          { paddingBottom: insets.bottom + SPACING.m },
        ]}
      >
        {isAuthenticated ? (
          <>
            <View style={styles.commentInputWrap}>
              <TextInput
                style={styles.commentInput}
                placeholder={t("post.addReply", "Add a reply...")}
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
                (commentDraft.trim().length < COMMENT_MIN_LENGTH ||
                  commentDraft.length > COMMENT_MAX_LENGTH ||
                  submittingComment) &&
                styles.commentPostBtnDisabled,
              ]}
              onPress={submitComment}
              disabled={
                commentDraft.trim().length < COMMENT_MIN_LENGTH ||
                commentDraft.length > COMMENT_MAX_LENGTH ||
                submittingComment
              }
              accessibilityRole="button"
              accessibilityLabel={t("post.postComment", "Post reply")}
            >
              {submittingComment ? (
                <InlineSkeleton />
              ) : (
                <Text style={styles.commentPostBtnText}>
                  {t("post.postComment")}
                </Text>
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.commentInputPlaceholder}
            onPress={() => router.push("/(tabs)/profile")}
            accessibilityRole="button"
            accessibilityLabel={t("post.signInToComment", "Sign in to reply")}
          >
            <MaterialIcons
              name="chat-bubble-outline"
              size={HEADER.iconSize}
              color={COLORS.tertiary}
              style={styles.commentPlaceholderIcon}
            />
            <Text style={styles.commentInputPlaceholderText}>
              {t("post.signInToComment")}
            </Text>
          </Pressable>
        )}
      </View>

      <OptionsActionSheet
        visible={!!replyMenuReplyId}
        title={t("post.commentActions", "Comment")}
        options={[
          ...(replyMenuReplyId &&
            userId &&
            (replies.find((r) => r.id === replyMenuReplyId)?.authorId ===
              userId ||
              replies.find((r) => r.id === replyMenuReplyId)?.author?.id ===
              userId)
            ? [
              {
                label: t("post.deleteComment", "Delete comment"),
                onPress: () => {
                  setReplyToDeleteId(replyMenuReplyId);
                  setReplyMenuReplyId(null);
                },
                destructive: true as const,
              },
            ]
            : []),
          // Only show report for other users' comments, not own
          ...(replyMenuReplyId &&
            userId &&
            replies.find((r) => r.id === replyMenuReplyId)?.authorId !== userId &&
            replies.find((r) => r.id === replyMenuReplyId)?.author?.id !== userId
            ? [
              {
                label: t("post.reportComment", "Report"),
                onPress: () => {
                  const id = replyMenuReplyId;
                  setReplyMenuReplyId(null);
                  // Delay so options sheet dismisses before report modal opens
                  setTimeout(() => { if (id) setReportReplyId(id); }, 600);
                },
                icon: "flag" as const,
              },
            ]
            : []),
        ]}
        cancelLabel={t("common.cancel")}
        onCancel={() => setReplyMenuReplyId(null)}
      />
      <ReportModal
        visible={!!reportReplyId}
        onClose={() => setReportReplyId(null)}
        onReport={(reason: string, comment: string) =>
          reportReplyId
            ? handleReportSubmit(reportReplyId, reason, comment)
            : Promise.resolve()
        }
        title={t("post.reportTitle", "Report Comment")}
        targetType="REPLY"
      />
      <ConfirmModal
        visible={!!replyToDeleteId}
        title={t("post.deleteComment", "Delete comment")}
        message={t(
          "post.deleteCommentConfirm",
          "Are you sure you want to delete this comment? This cannot be undone.",
        )}
        confirmLabel={t("post.deleteComment", "Delete comment")}
        cancelLabel={t("common.cancel")}
        destructive
        onConfirm={handleDeleteReply}
        onCancel={() => setReplyToDeleteId(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = createStyles({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: "center", alignItems: "center" },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.l,
  },
  commentSkeletonList: { flex: 1, paddingVertical: SPACING.s },
  errorText: { color: COLORS.tertiary, fontSize: 16, fontFamily: FONTS.medium },
  backLink: { marginTop: SPACING.m },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  parentCommentSection: { marginBottom: SPACING.xl },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.tertiary,
    textTransform: "uppercase",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  commentAuthorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    flex: 1,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.hover,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarTextSmall: {
    fontSize: 12,
    fontWeight: "600",
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
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.l,
    marginTop: SPACING.xs,
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.s,
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.s,
    backgroundColor: COLORS.ink,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.divider,
  },
  commentInputWrap: { flex: 1, position: "relative" },
  commentInput: {
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: COLORS.hover,
    borderRadius: 20,
    paddingHorizontal: SPACING.m,
    paddingTop: 10,
    paddingBottom: 24,
    fontSize: 15,
    color: COLORS.paper,
    fontFamily: FONTS.regular,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  commentCharCount: {
    position: "absolute",
    bottom: 6,
    right: SPACING.m,
    fontSize: 11,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentInputPlaceholder: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    backgroundColor: COLORS.hover,
    borderRadius: 20,
    paddingHorizontal: SPACING.m,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  commentPlaceholderIcon: { marginRight: SPACING.s },
  commentInputPlaceholderText: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentPostBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
    marginBottom: 2,
  },
  commentPostBtnDisabled: { opacity: 0.4 },
  commentPostBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
});
