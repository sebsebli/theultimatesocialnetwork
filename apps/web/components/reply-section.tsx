"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Avatar } from "./avatar";
import { OverflowMenu } from "./overflow-menu";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  parentReplyId?: string | null;
  parentReply?: Reply;
  subreplyCount?: number;
  isLiked?: boolean;
  likeCount?: number;
  /** Shown only to reply author */
  privateLikeCount?: number;
}

export interface ReplySectionProps {
  postId: string;
  replyCount: number;
  /** When true, viewer is not authenticated; show "Sign in to comment" and hide reply form */
  isPublic?: boolean;
  /** When set, scroll to and highlight this reply (e.g. /post/:id?highlightReply=replyId) */
  highlightReplyId?: string | null;
}

function ReplySectionInner({
  postId,
  isPublic = false,
  highlightReplyId,
}: ReplySectionProps) {
  const t = useTranslations("post");
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const canReply = Boolean(user) && !isPublic;
  const [replies, setReplies] = useState<Reply[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<
    Record<string, Reply[]>
  >({});
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(
    null,
  );
  const [likedReplyIds, setLikedReplyIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    return initial;
  });
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  const loadReplies = useCallback(
    async (parentReplyId?: string | null) => {
      const url = parentReplyId
        ? `/api/posts/${postId}/replies?parentReplyId=${encodeURIComponent(parentReplyId)}`
        : `/api/posts/${postId}/replies`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        return data as Reply[];
      }
      return [];
    },
    [postId],
  );

  // Always load replies on mount so we show list or "No replies yet"; don't rely only on replyCount
  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    loadReplies()
      .then((data) => setReplies(data))
      .finally(() => setLoading(false));
  }, [postId, loadReplies]);

  // Scroll to and highlight reply when highlightReplyId is set (e.g. from notification link)
  useEffect(() => {
    if (!highlightReplyId || loading) return;
    const el = document.getElementById(`reply-${highlightReplyId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-primary", "ring-offset-2", "ring-offset-ink");
      const t = setTimeout(() => {
        el.classList.remove("ring-2", "ring-primary", "ring-offset-2", "ring-offset-ink");
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [highlightReplyId, loading]);

  // Sync like state from loaded replies
  useEffect(() => {
    const liked = new Set<string>();
    const counts: Record<string, number> = {};
    const sync = (list: Reply[]) => {
      list.forEach((r) => {
        if (r.isLiked) liked.add(r.id);
        const c = r.privateLikeCount ?? r.likeCount ?? 0;
        if (c > 0) counts[r.id] = c;
      });
    };
    sync(replies);
    Object.values(childrenByParent).flat().forEach((r) => sync([r]));
    setLikedReplyIds(liked);
    setLikeCounts(counts);
  }, [replies, childrenByParent]);

  // When logged in and no replies yet, show the reply box once so the input form is visible without clicking
  const didAutoShowReplyRef = useRef(false);
  useEffect(() => {
    if (
      canReply &&
      replies.length === 0 &&
      !loading &&
      !didAutoShowReplyRef.current
    ) {
      didAutoShowReplyRef.current = true;
      setShowReplyBox(true);
    }
  }, [canReply, replies.length, loading]);

  const handleLikeReply = useCallback(
    async (replyId: string, currentlyLiked: boolean) => {
      if (!user || !postId) return;
      setLikedReplyIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(replyId);
        else next.add(replyId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [replyId]: Math.max(0, (prev[replyId] ?? 0) + (currentlyLiked ? -1 : 1)),
      }));
      try {
        const res = await fetch(
          `/api/posts/${postId}/replies/${replyId}/like`,
          { method: currentlyLiked ? "DELETE" : "POST", credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed");
      } catch {
        setLikedReplyIds((prev) => {
          const next = new Set(prev);
          if (currentlyLiked) next.add(replyId);
          else next.delete(replyId);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [replyId]: Math.max(0, (prev[replyId] ?? 0) + (currentlyLiked ? 1 : -1)),
        }));
        toastError("Failed to update like");
      }
    },
    [postId, user, toastError],
  );

  const handleDeleteReply = useCallback(
    async (replyId: string, parentReplyId: string | null) => {
      if (!postId) return;
      try {
        const res = await fetch(
          `/api/posts/${postId}/replies/${replyId}`,
          { method: "DELETE", credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed");
        if (parentReplyId) {
          setChildrenByParent((prev) => ({
            ...prev,
            [parentReplyId]: (prev[parentReplyId] || []).filter((r) => r.id !== replyId),
          }));
        } else {
          setReplies((prev) => prev.filter((r) => r.id !== replyId));
        }
      } catch {
        toastError("Failed to delete comment");
      }
    },
    [postId, toastError],
  );

  const loadChildren = useCallback(
    async (parentId: string) => {
      const children = await loadReplies(parentId);
      setChildrenByParent((prev) => ({ ...prev, [parentId]: children }));
      setExpandedParents((prev) => new Set(prev).add(parentId));
    },
    [loadReplies],
  );

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user || !postId) return;

    const body = replyText;
    const parentReplyId = replyingToReplyId || undefined;
    setReplyText("");
    setShowReplyBox(false);
    setReplyingToReplyId(null);

    const tempId = `temp-${Date.now()}`;
    const newReply: Reply = {
      id: tempId,
      body,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id as string,
        handle: user.handle as string,
        displayName: user.displayName as string,
      },
      parentReplyId: parentReplyId ?? null,
      subreplyCount: 0,
    };

    if (parentReplyId) {
      setChildrenByParent((prev) => ({
        ...prev,
        [parentReplyId]: [newReply, ...(prev[parentReplyId] || [])],
      }));
    } else {
      setReplies((prev) => [newReply, ...prev]);
    }

    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          parentReplyId: parentReplyId || undefined,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        const savedWithAuthor = {
          ...saved,
          author:
            saved.author ??
            (user
              ? {
                id: user.id,
                handle: user.handle ?? "",
                displayName: user.displayName ?? "",
                avatarKey: user.avatarKey ?? null,
                avatarUrl: user.avatarUrl ?? null,
              }
              : saved.author),
        };
        if (parentReplyId) {
          setChildrenByParent((prev) => ({
            ...prev,
            [parentReplyId]: (prev[parentReplyId] || []).map((r) =>
              r.id === tempId ? savedWithAuthor : r,
            ),
          }));
        } else {
          setReplies((prev) =>
            prev.map((r) => (r.id === tempId ? savedWithAuthor : r)),
          );
        }
        // Refresh top-level list from server so counts and order stay in sync
        if (!parentReplyId) {
          loadReplies().then((data) => {
            if (Array.isArray(data)) setReplies(data);
          });
        }
      } else {
        throw new Error("Failed to post");
      }
    } catch {
      if (parentReplyId) {
        setChildrenByParent((prev) => ({
          ...prev,
          [parentReplyId]: (prev[parentReplyId] || []).filter(
            (r) => r.id !== tempId,
          ),
        }));
      } else {
        setReplies((prev) => prev.filter((r) => r.id !== tempId));
      }
      setReplyText(body);
      setShowReplyBox(true);
      if (parentReplyId) setReplyingToReplyId(parentReplyId);
      toastError(t("commentFailed"));
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString();
  };

  const rootReplies = useMemo(
    () => replies.filter((r) => !r.parentReplyId || r.parentReplyId === null),
    [replies],
  );

  return (
    <section
      className="border-t border-divider pt-6"
      aria-label={t("comments")}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-paper">
          {replies.length} {replies.length === 1 ? t("comment") : t("comments")}
        </h2>
        {canReply ? (
          <button
            type="button"
            onClick={() => {
              setShowReplyBox(!showReplyBox);
              setReplyingToReplyId(null);
            }}
            className="text-primary text-sm font-medium hover:underline"
            aria-label={
              showReplyBox && !replyingToReplyId ? "Cancel" : t("writeComment")
            }
          >
            {showReplyBox && !replyingToReplyId ? "Cancel" : t("comment")}
          </button>
        ) : (
          <span className="text-tertiary text-sm">{t("signInToComment")}</span>
        )}
      </div>

      {canReply && showReplyBox && !replyingToReplyId && (
        <form onSubmit={handleSubmitReply} className="mb-6">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={t("writeComment")}
            className="w-full min-h-[100px] px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setShowReplyBox(false);
                setReplyText("");
              }}
              className="px-4 py-2 text-secondary hover:text-paper transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!replyText.trim()}
              className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("postComment")}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary text-sm">{t("loadingComments")}</p>
        </div>
      ) : replies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-secondary text-sm">{t("noCommentsYet")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rootReplies.map((reply) => (
              <div
                key={reply.id}
                id={`reply-${reply.id}`}
                className="pl-4 border-l-2 border-divider rounded-r transition-[box-shadow]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Link href={`/user/${reply.author.handle}`}>
                    <Avatar
                      avatarKey={reply.author.avatarKey}
                      avatarUrl={reply.author.avatarUrl}
                      displayName={reply.author.displayName}
                      handle={reply.author.handle}
                      size="sm"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <Link href={`/user/${reply.author.handle}`}>
                        <span className="text-sm font-semibold text-paper hover:text-primary">
                          {reply.author.displayName}
                        </span>
                      </Link>
                      <div className="flex items-center gap-2">
                        {user && (
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingToReplyId(reply.id);
                              setShowReplyBox(true);
                            }}
                            className="text-primary text-xs font-medium hover:underline"
                            aria-label={`Reply to ${reply.author.displayName}`}
                          >
                            {t("comment")}
                          </button>
                        )}
                        <OverflowMenu
                          replyId={reply.id}
                          userId={reply.author.id}
                          userHandle={reply.author.handle}
                          isAuthor={user?.id === reply.author.id}
                          onDelete={
                            user?.id === reply.author.id
                              ? () => handleDeleteReply(reply.id, null)
                              : undefined
                          }
                        />
                      </div>
                    </div>
                    <span className="text-xs text-tertiary ml-2 -mt-1 block">
                      @{reply.author.handle} • {formatTime(reply.createdAt)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-secondary leading-relaxed">
                  {reply.body}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  {user && (
                    <button
                      type="button"
                      onClick={() =>
                        handleLikeReply(
                          reply.id,
                          likedReplyIds.has(reply.id) ?? reply.isLiked ?? false,
                        )
                      }
                      className="flex items-center gap-1 text-tertiary hover:text-paper text-xs"
                      aria-label={
                        likedReplyIds.has(reply.id) || reply.isLiked
                          ? "Unlike reply"
                          : "Like reply"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill={
                          likedReplyIds.has(reply.id) || reply.isLiked
                            ? "currentColor"
                            : "none"
                        }
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span>
                        {likeCounts[reply.id] ??
                          reply.privateLikeCount ??
                          reply.likeCount ??
                          0}
                      </span>
                    </button>
                  )}
                </div>
                {(reply.subreplyCount ?? 0) > 0 && (
                  <div className="mt-2">
                    {!expandedParents.has(reply.id) ? (
                      <button
                        type="button"
                        onClick={() => loadChildren(reply.id)}
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        {t("viewComments", { count: reply.subreplyCount ?? 0 })}
                      </button>
                    ) : (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-divider/70">
                        {(childrenByParent[reply.id] || []).map((child) => (
                          <div key={child.id} id={`reply-${child.id}`} className="rounded transition-[box-shadow]">
                            <div className="flex items-center gap-3 mb-1">
                              <Link href={`/user/${child.author.handle}`}>
                                <Avatar
                                  avatarKey={child.author.avatarKey}
                                  avatarUrl={child.author.avatarUrl}
                                  displayName={child.author.displayName}
                                  handle={child.author.handle}
                                  size="sm"
                                />
                              </Link>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <Link href={`/user/${child.author.handle}`}>
                                    <span className="text-sm font-semibold text-paper hover:text-primary">
                                      {child.author.displayName}
                                    </span>
                                  </Link>
                                  <div className="flex items-center gap-2">
                                    {user && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplyingToReplyId(child.id);
                                          setShowReplyBox(true);
                                        }}
                                        className="text-primary text-xs font-medium hover:underline"
                                        aria-label={`Reply to ${child.author.displayName}`}
                                      >
                                        {t("comment")}
                                      </button>
                                    )}
                                    <OverflowMenu
                                      replyId={child.id}
                                      userId={child.author.id}
                                      userHandle={child.author.handle}
                                      isAuthor={user?.id === child.author.id}
                                      onDelete={
                                        user?.id === child.author.id
                                          ? () =>
                                            handleDeleteReply(
                                              child.id,
                                              reply.id,
                                            )
                                          : undefined
                                      }
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-tertiary">
                                  @{child.author.handle} •{" "}
                                  {formatTime(child.createdAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-secondary leading-relaxed">
                              {child.body}
                            </p>
                            {user && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLikeReply(
                                    child.id,
                                    likedReplyIds.has(child.id) ??
                                    child.isLiked ??
                                    false,
                                  )
                                }
                                className="flex items-center gap-1 text-tertiary hover:text-paper text-xs mt-1"
                                aria-label={
                                  likedReplyIds.has(child.id) || child.isLiked
                                    ? "Unlike reply"
                                    : "Like reply"
                                }
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill={
                                    likedReplyIds.has(child.id) || child.isLiked
                                      ? "currentColor"
                                      : "none"
                                  }
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                  />
                                </svg>
                                <span>
                                  {likeCounts[child.id] ??
                                    child.privateLikeCount ??
                                    child.likeCount ??
                                    0}
                                </span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {replyingToReplyId === reply.id && showReplyBox && (
                  <form onSubmit={handleSubmitReply} className="mt-3">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={t("writeComment")}
                      className="w-full min-h-[80px] px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowReplyBox(false);
                          setReplyingToReplyId(null);
                          setReplyText("");
                        }}
                        className="text-secondary text-sm hover:text-paper"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="px-3 py-1.5 bg-primary text-white rounded-full text-sm disabled:opacity-50"
                      >
                        {t("postComment")}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ))}
        </div>
      )}
    </section>
  );
}

export const ReplySection = memo(ReplySectionInner);
