import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  type NativeSyntheticEvent,
  type TextInputSelectionChangeEventData,
} from "react-native";
import {
  useRouter,
  useLocalSearchParams,
  usePathname,
  useSegments,
} from "expo-router";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { api } from "../../../utils/api";
import {
  COLORS,
  SPACING,
  SIZES,
  FONTS,
  HEADER,
  LAYOUT,
  createStyles,
} from "../../../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../context/auth";
import { useToast } from "../../../context/ToastContext";
import { ScreenHeader } from "../../../components/ScreenHeader";
import { MarkdownText } from "../../../components/MarkdownText";
import { ReportModal } from "../../../components/ReportModal";
import { OptionsActionSheet } from "../../../components/OptionsActionSheet";
import { ConfirmModal } from "../../../components/ConfirmModal";
import {
  EmptyState,
  emptyStateCenterWrapStyle,
} from "../../../components/EmptyState";
import {
  CommentSkeleton,
  InlineSkeleton,
} from "../../../components/LoadingSkeleton";
import { useComposerSearch } from "../../../hooks/useComposerSearch";
import * as Haptics from "expo-haptics";

const COMMENT_MIN_LENGTH = 2;
const COMMENT_MAX_LENGTH = 1000;

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

function normalizeParam(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value || undefined;
  if (Array.isArray(value) && value.length > 0)
    return String(value[0]) || undefined;
  return undefined;
}

/** Get post id from pathname (e.g. /post/abc-123/comments or post/abc-123/comments -> abc-123). Nested dynamic routes may not receive params.id. */
function getPostIdFromPathname(pathname: string): string | undefined {
  if (!pathname || typeof pathname !== "string") return undefined;
  const match = pathname.match(/\/?post\/([^/]+)/);
  return match ? match[1] : undefined;
}

export default function PostCommentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const pathname = usePathname();
  const segments = useSegments();
  const replyIdFromParams =
    typeof params.replyId === "string"
      ? params.replyId
      : Array.isArray(params.replyId)
        ? params.replyId[0]
        : undefined;
  const { t } = useTranslation();
  const { isAuthenticated, userId } = useAuth();
  const { showSuccess, showError } = useToast();
  // postId: pathname/params can be missing for nested routes; also use URL segments (e.g. ['post', 'xyz', 'comments'])
  const segs = segments as string[];
  const postIdFromSegments =
    Array.isArray(segs) &&
      segs.length >= 3 &&
      segs[0] === "post" &&
      segs[1] &&
      segs[2] === "comments"
      ? String(segs[1])
      : undefined;
  const postId =
    getPostIdFromPathname(pathname ?? "") ??
    normalizeParam(params.id) ??
    postIdFromSegments;
  const [replies, setReplies] = useState<Reply[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [postTitle, setPostTitle] = useState<string | null>(null);
  const [reportReplyId, setReportReplyId] = useState<string | null>(null);
  const [replyMenuReplyId, setReplyMenuReplyId] = useState<string | null>(null);
  const [replyToDeleteId, setReplyToDeleteId] = useState<string | null>(null);
  const [likedReplies, setLikedReplies] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const hasScrolledToReply = useRef(false);
  const {
    results: mentionResults,
    search: searchMentions,
    isSearching: mentionSearching,
  } = useComposerSearch();
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const likedSet = useMemo(() => {
    const liked = new Set<string>();
    replies.forEach((r: Reply) => {
      if (r.isLiked) {
        liked.add(r.id);
      }
    });
    return liked;
  }, [replies]);

  const loadReplies = useCallback(async () => {
    if (!postId) return;
    try {
      const raw = await api.get<Reply[] | { items?: Reply[] }>(
        `/posts/${postId}/replies`,
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
      if (__DEV__) console.error("Failed to load comments", e);
      setReplies([]);
    }
  }, [postId]);

  const loadPost = useCallback(async () => {
    if (!postId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [postData, repliesData] = await Promise.all([
        api.get<{ title?: string }>(`/posts/${postId}`),
        api.get<Reply[] | { items?: Reply[] }>(`/posts/${postId}/replies`),
      ]);
      setPostTitle(postData?.title ?? null);
      const list = Array.isArray(repliesData)
        ? repliesData
        : repliesData &&
          typeof repliesData === "object" &&
          "items" in repliesData &&
          Array.isArray((repliesData as { items?: Reply[] }).items)
          ? (repliesData as { items?: Reply[] }).items ?? []
          : [];
      setReplies(list);
      setLikedReplies(
        new Set(list.filter((r: Reply) => r.isLiked).map((r: Reply) => r.id)),
      );
    } catch (error) {
      if (__DEV__) console.error("Failed to load comments", error);
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  // Parse @ mention: when user types @ or @query before cursor, show mention dropdown
  useEffect(() => {
    const beforeCursor = commentDraft.slice(0, selection.start);
    const lastAt = beforeCursor.lastIndexOf("@");
    if (
      lastAt !== -1 &&
      (lastAt === 0 || /[\s\n]/.test(beforeCursor[lastAt - 1] ?? ""))
    ) {
      const afterAt = beforeCursor.slice(lastAt + 1);
      const segment = (afterAt.split(/[\s\n]/)[0] ?? "").slice(0, 50);
      if (!segment.includes(" ")) {
        setMentionQuery(segment);
        searchMentions(segment, "mention");
        return;
      }
    }
    setMentionQuery(null);
  }, [commentDraft, selection.start]);

  const handleMentionSelect = useCallback(
    (item: { handle?: string }) => {
      if (!item.handle) return;
      const beforeCursor = commentDraft.slice(0, selection.start);
      const lastAt = beforeCursor.lastIndexOf("@");
      if (lastAt === -1) {
        setMentionQuery(null);
        return;
      }
      const afterAt = beforeCursor.slice(lastAt + 1);
      const segment = afterAt.split(/[\s\n]/)[0] ?? "";
      const insertion = `@${item.handle} `;
      const newDraft =
        commentDraft.slice(0, lastAt) +
        insertion +
        commentDraft.slice(selection.start);
      setCommentDraft(newDraft);
      setMentionQuery(null);
      setSelection({
        start: lastAt + insertion.length,
        end: lastAt + insertion.length,
      });
    },
    [commentDraft, selection.start],
  );

  const submitComment = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const body = commentDraft.trim();
    if (!body || !isAuthenticated || !postId) return;
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
      const created = await api.post<Reply>(`/posts/${postId}/replies`, {
        body,
      });
      setCommentDraft("");
      showSuccess(t("post.commentPosted", "Comment posted"));
      // Optimistic: prepend new reply so list updates immediately
      if (created && typeof created === "object" && "id" in created) {
        const r = created as Reply;
        setReplies((prev) => [
          ...prev,
          {
            ...r,
            author: r.author ?? {
              id: userId ?? "",
              displayName: "",
              handle: "",
            },
            authorId: r.authorId ?? userId ?? undefined,
          },
        ]);
      }
      await loadReplies();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: unknown) {
      if (__DEV__) console.error("Failed to post comment", error);
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

  const handleReportCommentSubmit = async (
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
      showSuccess(t("post.reportSuccess", "Post reported successfully"));
    } catch (e) {
      showError(t("post.reportError", "Failed to report post"));
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

  if (!postId) {
    return (
      <View style={[styles.container, styles.center]}>
        <ScreenHeader title={t("post.comments")} paddingTop={insets.top} />
        <Text style={styles.errorText}>
          {t("post.postNotFound", "Post not found")}
        </Text>
        <Pressable
          style={styles.backLink}
          onPress={() => router.back()}
          onLongPress={() => router.replace("/(tabs)" as "/")}
          delayLongPress={400}
        >
          <Text style={styles.backLinkText}>{t("common.close")}</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title={t("post.comments")} paddingTop={insets.top} />
        <View style={styles.commentSkeletonList}>
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </View>
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
        title={`${t("post.comments")}${replies.length > 0 ? ` (${replies.length})` : ""}`}
        showBack={true}
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
        {postTitle ? (
          <Text style={styles.postTitleLabel} numberOfLines={1}>
            {postTitle}
          </Text>
        ) : null}

        {replies.length === 0 ? (
          <View style={emptyStateCenterWrapStyle}>
            <EmptyState
              icon="chat-bubble-outline"
              headline={
                isAuthenticated
                  ? t("post.noComments", "No comments yet. Be the first.")
                  : t("post.signInToComment", "Sign in to comment")
              }
              subtext={
                isAuthenticated
                  ? t(
                    "post.noCommentsSubtext",
                    "Add a comment below to start the discussion.",
                  )
                  : t(
                    "post.signInToCommentSubtext",
                    "Sign in to join the discussion and add a comment.",
                  )
              }
              actionLabel={
                !isAuthenticated ? t("common.signIn", "Sign in") : undefined
              }
              onAction={
                !isAuthenticated
                  ? () => router.push("/(tabs)/profile")
                  : undefined
              }
            />
          </View>
        ) : null}
        {(Array.isArray(replies) ? replies : []).map((reply) => (
          <View
            key={reply.id}
            style={[
              styles.commentRow,
              replyIdFromParams === reply.id && styles.commentRowHighlight,
            ]}
            onLayout={
              replyIdFromParams === reply.id && !hasScrolledToReply.current
                ? (e: { nativeEvent: { layout: { y: number } } }) => {
                  hasScrolledToReply.current = true;
                  const y = e.nativeEvent.layout.y;
                  scrollRef.current?.scrollTo({
                    y: Math.max(0, y - 80),
                    animated: true,
                  });
                }
                : undefined
            }
          >
            <View style={styles.commentAuthorRow}>
              <Pressable
                onPress={() =>
                  reply.author?.handle &&
                  router.push(`/user/${reply.author.handle}`)
                }
                style={styles.commentAuthorLeft}
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
                  <View style={styles.commentLikeRow}>
                    <Pressable
                      style={styles.commentLikeBtn}
                      onPress={() =>
                        handleLikeReply(reply.id, likedReplies.has(reply.id))
                      }
                    >
                      <MaterialIcons
                        name={
                          likedReplies.has(reply.id)
                            ? "favorite"
                            : "favorite-border"
                        }
                        size={HEADER.iconSize}
                        color={
                          likedReplies.has(reply.id)
                            ? COLORS.like
                            : COLORS.tertiary
                        }
                      />
                      <Text style={styles.commentLikeLabel}>
                        {(reply.authorId === userId ||
                          reply.author?.id === userId) &&
                          reply.privateLikeCount !== undefined &&
                          reply.privateLikeCount > 0
                          ? t("post.privateLikedBy", {
                            count: reply.privateLikeCount,
                            defaultValue: `Liked by ${reply.privateLikeCount}`,
                          })
                          : t("post.like")}
                      </Text>
                    </Pressable>
                  </View>
                )}
                <Pressable
                  style={styles.repliesLink}
                  onPress={() =>
                    router.push(`/post/${postId}/comments/${reply.id}`)
                  }
                  accessibilityLabel={
                    (reply.subreplyCount ?? 0) > 0
                      ? t("post.viewReplies", "View {{count}} replies", {
                        count: reply.subreplyCount,
                      })
                      : t("post.reply", "Reply")
                  }
                >
                  <MaterialIcons
                    name="chat-bubble-outline"
                    size={HEADER.iconSize}
                    color={COLORS.primary}
                  />
                  <Text style={styles.repliesLinkText}>
                    {(reply.subreplyCount ?? 0) > 0
                      ? t("post.replyCountLabel", "{{count}} replies", {
                        count: reply.subreplyCount,
                      })
                      : t("post.reply", "Reply")}
                  </Text>
                  <MaterialIcons
                    name="chevron-right"
                    size={HEADER.iconSize}
                    color={COLORS.tertiary}
                  />
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add comment - fixed at bottom; always visible so users see where to comment */}
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
                placeholder={t("post.addComment")}
                placeholderTextColor={COLORS.tertiary}
                value={commentDraft}
                onChangeText={setCommentDraft}
                onSelectionChange={(
                  e: NativeSyntheticEvent<TextInputSelectionChangeEventData>,
                ) => setSelection(e.nativeEvent.selection)}
                multiline
                maxLength={COMMENT_MAX_LENGTH}
                editable={!submittingComment}
              />
              {mentionQuery !== null && (
                <View style={styles.mentionDropdown}>
                  {mentionSearching ? (
                    <InlineSkeleton />
                  ) : (
                    mentionResults
                      .filter(
                        (r: Record<string, unknown>) => r.type === "mention" && r.id !== userId,
                      )
                      .slice(0, 8)
                      .map((item: Record<string, unknown>) => (
                        <Pressable
                          key={item.id}
                          style={({ pressed }: { pressed: boolean }) => [
                            styles.mentionItem,
                            pressed && styles.mentionItemPressed,
                          ]}
                          onPress={() => handleMentionSelect(item)}
                        >
                          <View style={styles.mentionItemAvatar}>
                            <Text
                              style={styles.mentionItemAvatarText}
                              numberOfLines={1}
                            >
                              {((item.displayName || item.handle) as string | undefined)?.charAt(0)}
                            </Text>
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text
                              style={styles.mentionItemLabel}
                              numberOfLines={1}
                            >
                              {(item.displayName || item.handle) as string | undefined}
                            </Text>
                            <Text
                              style={styles.mentionItemHandle}
                              numberOfLines={1}
                            >
                              @{item.handle as string | undefined}
                            </Text>
                          </View>
                        </Pressable>
                      ))
                  )}
                </View>
              )}
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
            accessibilityLabel={t("post.signInToComment")}
            accessibilityRole="button"
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
          {
            label: t("post.reportComment", "Report"),
            onPress: () => {
              if (replyMenuReplyId) setReportReplyId(replyMenuReplyId);
              setReplyMenuReplyId(null);
            },
            icon: "flag" as const,
          },
        ]}
        cancelLabel={t("common.cancel")}
        onCancel={() => setReplyMenuReplyId(null)}
      />
      <ReportModal
        visible={!!reportReplyId}
        onClose={() => setReportReplyId(null)}
        onReport={(reason: string, comment: string) =>
          reportReplyId
            ? handleReportCommentSubmit(reportReplyId, reason, comment)
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
  commentSkeletonList: {
    flex: 1,
    paddingVertical: SPACING.s,
  },
  errorText: {
    color: COLORS.tertiary,
    fontSize: 16,
    fontFamily: FONTS.medium,
    textAlign: "center",
    marginHorizontal: SPACING.l,
  },
  backLink: { marginTop: SPACING.m },
  backLinkText: {
    color: COLORS.primary,
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  postTitleLabel: {
    fontSize: 13,
    color: COLORS.tertiary,
    marginBottom: SPACING.m,
    fontFamily: FONTS.regular,
  },
  commentRow: {
    paddingVertical: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  commentRowHighlight: {
    backgroundColor: COLORS.hover,
  },
  mentionDropdown: {
    marginTop: SPACING.xs,
    maxHeight: 220,
    backgroundColor: COLORS.hover,
    borderRadius: SIZES.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.divider,
    overflow: "hidden",
  },
  mentionDropdownLoader: {
    padding: SPACING.m,
  },
  mentionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.s,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  mentionItemPressed: {
    backgroundColor: COLORS.pressed,
  },
  mentionItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.divider,
    justifyContent: "center",
    alignItems: "center",
  },
  mentionItemAvatarText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
  mentionItemLabel: {
    fontSize: 14,
    color: COLORS.paper,
    fontFamily: FONTS.medium,
  },
  mentionItemHandle: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
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
  commentBodyWrap: {
    marginLeft: 36,
  },
  commentLikeRow: {
    marginTop: SPACING.s,
    flexDirection: "row",
    alignItems: "center",
  },
  commentLikeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingRight: SPACING.s,
  },
  commentLikeLabel: {
    fontSize: 12,
    color: COLORS.tertiary,
    fontFamily: FONTS.regular,
  },
  commentActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: SPACING.m,
    marginTop: SPACING.s,
  },
  repliesLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
    paddingRight: SPACING.s,
  },
  repliesLinkText: {
    fontSize: 12,
    color: COLORS.primary,
    fontFamily: FONTS.medium,
  },
  commentInputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: SPACING.m,
    paddingHorizontal: LAYOUT.contentPaddingHorizontal,
    paddingTop: SPACING.m,
    backgroundColor: COLORS.ink,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  commentInputWrap: {
    flex: 1,
    position: "relative",
  },
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
    justifyContent: "center",
    minHeight: 44,
  },
  commentPostBtnDisabled: { opacity: 0.5 },
  commentPostBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.ink,
    fontFamily: FONTS.semiBold,
  },
});
