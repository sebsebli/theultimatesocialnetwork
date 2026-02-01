"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";
import { OverflowMenu } from "./overflow-menu";
import { useAuth } from "@/components/auth-provider";

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
}

interface ReplySectionProps {
  postId: string;
  replyCount: number;
  /** When true, viewer is not authenticated; show "Sign in to comment" and hide reply form */
  isPublic?: boolean;
}

export function ReplySection({ postId, replyCount, isPublic = false }: ReplySectionProps) {
  const { user } = useAuth();
  const canReply = Boolean(user) && !isPublic;
  const [replies, setReplies] = useState<Reply[]>([]);
  const [childrenByParent, setChildrenByParent] = useState<Record<string, Reply[]>>({});
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);

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
    [postId]
  );

  // Always load replies on mount so we show list or "No replies yet"; don't rely only on replyCount
  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    loadReplies()
      .then((data) => setReplies(data))
      .finally(() => setLoading(false));
  }, [postId, loadReplies]);

  // When logged in and no replies yet, show the reply box once so the input form is visible without clicking
  const didAutoShowReplyRef = useRef(false);
  useEffect(() => {
    if (canReply && replies.length === 0 && !loading && !didAutoShowReplyRef.current) {
      didAutoShowReplyRef.current = true;
      setShowReplyBox(true);
    }
  }, [canReply, replies.length, loading]);

  const loadChildren = useCallback(
    async (parentId: string) => {
      const children = await loadReplies(parentId);
      setChildrenByParent((prev) => ({ ...prev, [parentId]: children }));
      setExpandedParents((prev) => new Set(prev).add(parentId));
    },
    [loadReplies]
  );

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !user) return;

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
        body: JSON.stringify({ body, parentReplyId: parentReplyId || undefined }),
      });

      if (res.ok) {
        const saved = await res.json();
        if (parentReplyId) {
          setChildrenByParent((prev) => ({
            ...prev,
            [parentReplyId]: (prev[parentReplyId] || []).map((r) =>
              r.id === tempId ? saved : r
            ),
          }));
        } else {
          setReplies((prev) => prev.map((r) => (r.id === tempId ? saved : r)));
        }
      } else {
        throw new Error("Failed to post");
      }
    } catch {
      if (parentReplyId) {
        setChildrenByParent((prev) => ({
          ...prev,
          [parentReplyId]: (prev[parentReplyId] || []).filter((r) => r.id !== tempId),
        }));
      } else {
        setReplies((prev) => prev.filter((r) => r.id !== tempId));
      }
      setReplyText(body);
      setShowReplyBox(true);
      if (parentReplyId) setReplyingToReplyId(parentReplyId);
      alert("Failed to post reply. Please try again.");
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

  return (
    <section className="border-t border-divider pt-6" aria-label="Replies">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-paper">
          {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
        </h2>
        {canReply ? (
          <button
            type="button"
            onClick={() => {
              setShowReplyBox(!showReplyBox);
              setReplyingToReplyId(null);
            }}
            className="text-primary text-sm font-medium hover:underline"
            aria-label={showReplyBox && !replyingToReplyId ? "Cancel reply" : "Write a reply"}
          >
            {showReplyBox && !replyingToReplyId ? "Cancel" : "Reply"}
          </button>
        ) : (
          <span className="text-tertiary text-sm">Sign in to comment</span>
        )}
      </div>

      {canReply && showReplyBox && !replyingToReplyId && (
        <form onSubmit={handleSubmitReply} className="mb-6">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
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
              Reply
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">
          <p className="text-secondary text-sm">Loading replies...</p>
        </div>
      ) : replies.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-secondary text-sm">No replies yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies
            .filter((r) => !r.parentReplyId || r.parentReplyId === null)
            .map((reply) => (
              <div key={reply.id} className="pl-4 border-l-2 border-divider">
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
                          >
                            Reply
                          </button>
                        )}
                        <OverflowMenu
                          replyId={reply.id}
                          userId={reply.author.handle}
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
                {(reply.subreplyCount ?? 0) > 0 && (
                  <div className="mt-2">
                    {!expandedParents.has(reply.id) ? (
                      <button
                        type="button"
                        onClick={() => loadChildren(reply.id)}
                        className="text-primary text-xs font-medium hover:underline"
                      >
                        View {reply.subreplyCount} {reply.subreplyCount === 1 ? "reply" : "replies"}
                      </button>
                    ) : (
                      <div className="mt-3 space-y-3 pl-4 border-l-2 border-divider/70">
                        {(childrenByParent[reply.id] || []).map((child) => (
                          <div key={child.id}>
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
                                      >
                                        Reply
                                      </button>
                                    )}
                                    <OverflowMenu
                                      replyId={child.id}
                                      userId={child.author.handle}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-tertiary">
                                  @{child.author.handle} • {formatTime(child.createdAt)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-secondary leading-relaxed">
                              {child.body}
                            </p>
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
                      placeholder="Write a reply..."
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
                        Reply
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
