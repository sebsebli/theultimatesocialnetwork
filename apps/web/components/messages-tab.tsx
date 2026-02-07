"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRealtime } from "@/context/realtime-provider";
import { useAuth } from "@/components/auth-provider";
import { useUnreadMessages } from "@/context/unread-messages-context";
import { Avatar } from "./avatar";
import { useToast } from "./ui/toast";

interface Thread {
  id: string;
  otherUser: {
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  lastMessage?: {
    body: string;
    createdAt: string;
  };
  unreadCount: number;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  threadId?: string;
}

interface MessagesTabProps {
  /** When present (e.g. from /inbox?thread=...), open this thread on load */
  initialThreadId?: string | null;
  /** Pre-fill message input */
  initialMessage?: string;
}

interface ChatSearchHit {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  otherUser: {
    id: string;
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
}

interface UserOption {
  id: string;
  handle: string;
  displayName?: string;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

export function MessagesTab({
  initialThreadId,
  initialMessage,
}: MessagesTabProps = {}) {
  const { user } = useAuth();
  const { refresh: refreshUnread } = useUnreadMessages();
  const { success, error: toastError } = useToast();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(
    initialThreadId || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState(initialMessage || "");
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [chatSearchResults, setChatSearchResults] = useState<ChatSearchHit[]>(
    [],
  );
  const [chatSearchLoading, setChatSearchLoading] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessageQuery, setNewMessageQuery] = useState("");
  const [newMessageSuggestions, setNewMessageSuggestions] = useState<
    UserOption[]
  >([]);
  const [newMessageSearchResults, setNewMessageSearchResults] = useState<
    UserOption[]
  >([]);
  const [newMessageLoading, setNewMessageLoading] = useState(false);
  const [threadMenuOpen, setThreadMenuOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [refreshingThreads, setRefreshingThreads] = useState(false);
  const chatSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const newMessageSearchTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const loadThreadsCancelledRef = useRef(false);
  const loadMessagesCancelledRef = useRef(false);
  const { on, off } = useRealtime();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setThreadMenuOpen(false);
      }
    };
    if (threadMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [threadMenuOpen]);

  const loadThreads = useCallback(async () => {
    if (loadThreadsCancelledRef.current) return;
    setLoading(true);
    try {
      const res = await fetch("/api/messages/threads");
      if (loadThreadsCancelledRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!loadThreadsCancelledRef.current) {
          setThreads(data);
        }
      }
      if (!loadThreadsCancelledRef.current) {
        refreshUnread();
      }
    } catch {
      // ignore
    } finally {
      if (!loadThreadsCancelledRef.current) {
        setLoading(false);
      }
    }
  }, [refreshUnread]);

  const handleRefreshThreads = useCallback(async () => {
    setRefreshingThreads(true);
    try {
      const res = await fetch("/api/messages/threads");
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
      refreshUnread();
    } catch {
      // ignore
    } finally {
      setRefreshingThreads(false);
    }
  }, [refreshUnread]);

  const loadMessages = useCallback(async (threadId: string) => {
    if (loadMessagesCancelledRef.current) return;
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`);
      if (loadMessagesCancelledRef.current) return;
      if (res.ok) {
        const data = await res.json();
        if (!loadMessagesCancelledRef.current) {
          setMessages(data);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadThreadsCancelledRef.current = false;
    loadThreads().catch(() => {
      // ignore errors
    });
    return () => {
      loadThreadsCancelledRef.current = true;
    };
  }, [loadThreads]);

  useEffect(() => {
    if (initialThreadId && threads.length > 0 && !selectedThread) {
      const exists = threads.some((t) => t.id === initialThreadId);
      if (exists) setSelectedThread(initialThreadId);
    }
  }, [initialThreadId, threads, selectedThread]);

  useEffect(() => {
    const handleMessage = (data: unknown) => {
      const message = data as Message;
      // Reload threads to update sidebar (last message, unread count)
      loadThreads();

      // If viewing this thread, append message
      if (selectedThread && message.threadId === selectedThread) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    on("message", handleMessage);
    return () => {
      off("message", handleMessage);
    };
  }, [on, off, selectedThread, loadThreads]);

  useEffect(() => {
    if (selectedThread) {
      loadMessagesCancelledRef.current = false;
      loadMessages(selectedThread).catch(() => {
        // ignore errors
      });
      return () => {
        loadMessagesCancelledRef.current = true;
      };
    }
  }, [selectedThread, loadMessages]);

  // Chat search (within messages)
  useEffect(() => {
    const q = chatSearchQuery.trim();
    if (q.length < 2) {
      setChatSearchResults([]);
      return;
    }
    if (chatSearchTimeoutRef.current)
      clearTimeout(chatSearchTimeoutRef.current);
    chatSearchTimeoutRef.current = setTimeout(async () => {
      setChatSearchLoading(true);
      try {
        const res = await fetch(
          `/api/messages/search?q=${encodeURIComponent(q)}&limit=15`,
        );
        if (res.ok) {
          const data = await res.json();
          setChatSearchResults(Array.isArray(data) ? data : []);
        }
      } catch {
        setChatSearchResults([]);
      } finally {
        setChatSearchLoading(false);
      }
    }, 300);
    return () => {
      if (chatSearchTimeoutRef.current)
        clearTimeout(chatSearchTimeoutRef.current);
    };
  }, [chatSearchQuery]);

  // New message: load suggested on open
  useEffect(() => {
    if (!showNewMessage) return;
    let cancelled = false;
    setNewMessageLoading(true);
    fetch("/api/users/suggested?limit=10")
      .then((res) => (res.ok ? res.json() : []))
      .then((list: UserOption[]) => {
        if (!cancelled) {
          setNewMessageSuggestions(
            (Array.isArray(list) ? list : []).filter(
              (u) => !u.handle?.startsWith?.("__pending_"),
            ),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setNewMessageSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setNewMessageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showNewMessage]);

  // New message: search users
  useEffect(() => {
    const q = newMessageQuery.trim();
    if (q.length < 2) {
      setNewMessageSearchResults([]);
      return;
    }
    if (newMessageSearchTimeoutRef.current)
      clearTimeout(newMessageSearchTimeoutRef.current);
    newMessageSearchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/users?q=${encodeURIComponent(q)}&limit=12`,
        );
        if (res.ok) {
          const data = await res.json();
          const hits = data.hits || data;
          setNewMessageSearchResults(
            (Array.isArray(hits) ? hits : []).filter(
              (u: UserOption) => !u.handle?.startsWith?.("__pending_"),
            ),
          );
        }
      } catch {
        setNewMessageSearchResults([]);
      }
    }, 300);
    return () => {
      if (newMessageSearchTimeoutRef.current)
        clearTimeout(newMessageSearchTimeoutRef.current);
    };
  }, [newMessageQuery]);

  const startConversation = async (otherUser: UserOption) => {
    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: otherUser.id }),
      });
      if (res.ok) {
        const thread = await res.json();
        setShowNewMessage(false);
        setNewMessageQuery("");
        setNewMessageSearchResults([]);
        await loadThreads();
        setSelectedThread(thread.id);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(
          err.error ||
          "Could not start conversation. You may need to follow each other.",
        );
      }
    } catch {
      alert("Could not start conversation. Please try again.");
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedThread || !user) return;

    const body = messageText;
    setMessageText("");

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      body,
      senderId: user.id as string,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newMessage]);

    try {
      const res = await fetch(
        `/api/messages/threads/${selectedThread}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        },
      );

      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic message with saved one
        setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
        loadThreads(); // Update sidebar in background
      } else {
        throw new Error("Failed to send");
      }
    } catch {
      // ignore
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessageText(body); // Restore text
      alert("Failed to send message. Please try again.");
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

  const handleMarkUnread = async () => {
    if (!selectedThread) return;
    setThreadMenuOpen(false);
    try {
      const res = await fetch(
        `/api/messages/threads/${selectedThread}/read`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ read: false }),
        },
      );
      if (res.ok) {
        setSelectedThread(null);
        await loadThreads();
        refreshUnread();
        success("Marked as unread");
      } else {
        toastError("Failed to update");
      }
    } catch {
      toastError("Failed to update");
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedThread) return;
    setThreadMenuOpen(false);
    setDeleteConfirmOpen(false);
    try {
      const res = await fetch(
        `/api/messages/threads/${selectedThread}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setSelectedThread(null);
        setMessages([]);
        await loadThreads();
        refreshUnread();
        success("Conversation deleted");
      } else {
        toastError("Failed to delete conversation");
      }
    } catch {
      toastError("Failed to delete conversation");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-sm">Loading messages...</p>
      </div>
    );
  }

  if (threads.length === 0 && !showNewMessage) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-secondary text-sm">No messages yet.</p>
        <button
          type="button"
          onClick={() => setShowNewMessage(true)}
          className="px-6 py-2 bg-primary text-white rounded-full font-medium hover:opacity-90 transition-colors"
        >
          Start a conversation
        </button>
      </div>
    );
  }

  if (selectedThread) {
    const thread = threads.find((t) => t.id === selectedThread);
    if (!thread) return null;

    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-divider">
          <button
            onClick={() => setSelectedThread(null)}
            className="text-tertiary hover:text-paper"
            aria-label="Back to messages"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <Link href={`/user/${thread.otherUser.handle}`}>
            <Avatar
              avatarKey={thread.otherUser.avatarKey}
              avatarUrl={thread.otherUser.avatarUrl}
              displayName={thread.otherUser.displayName}
              handle={thread.otherUser.handle}
              size="md"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/user/${thread.otherUser.handle}`}>
              <div className="font-semibold text-paper truncate">
                {thread.otherUser.displayName}
              </div>
            </Link>
            <div className="text-xs text-tertiary truncate">
              @{thread.otherUser.handle}
            </div>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setThreadMenuOpen((o) => !o)}
              className="p-2 text-tertiary hover:text-paper rounded-lg"
              aria-label="Thread options"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {threadMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-ink border border-divider rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={handleMarkUnread}
                  className="w-full px-4 py-3 text-left text-sm text-paper hover:bg-white/10"
                >
                  Mark as unread
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setThreadMenuOpen(false);
                    setDeleteConfirmOpen(true);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-white/10"
                >
                  Delete conversation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Delete confirm modal */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-ink border border-divider rounded-xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="text-lg font-semibold text-paper mb-2">
                Delete conversation?
              </h3>
              <p className="text-secondary text-sm mb-6">
                This will permanently delete the conversation for both
                participants.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 text-paper hover:bg-white/10 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConversation}
                  className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === thread.otherUser.id ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-lg ${msg.senderId === thread.otherUser.id
                  ? "bg-white/5 text-paper"
                  : "bg-primary text-white"
                  }`}
              >
                <p className="text-sm">{msg.body}</p>
                <p
                  className={`text-xs mt-1 ${msg.senderId === thread.otherUser.id
                    ? "text-tertiary"
                    : "text-primary/70"
                    }`}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form
          onSubmit={sendMessage}
          className="px-6 py-4 border-t border-divider"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border-b border-divider text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* New message modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 bg-ink/90 backdrop-blur-sm flex items-start justify-center p-4 pt-12">
          <div className="w-full max-w-md bg-ink border border-divider rounded-xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <h2 className="text-lg font-semibold text-paper">New message</h2>
              <button
                type="button"
                onClick={() => {
                  setShowNewMessage(false);
                  setNewMessageQuery("");
                  setNewMessageSearchResults([]);
                }}
                className="text-tertiary hover:text-paper"
                aria-label="Close new message"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 border-b border-divider">
              <input
                type="text"
                value={newMessageQuery}
                onChange={(e) => setNewMessageQuery(e.target.value)}
                placeholder="Search people..."
                className="w-full px-4 py-2 border-b border-divider text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {newMessageQuery.trim().length >= 2 ? (
                newMessageSearchResults.length === 0 ? (
                  <p className="text-secondary text-sm">No users found.</p>
                ) : (
                  <div className="space-y-1">
                    {newMessageSearchResults
                      .filter((u) => u.id !== (user as { id?: string })?.id)
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => startConversation(u)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left"
                        >
                          <Avatar
                            avatarKey={u.avatarKey}
                            avatarUrl={u.avatarUrl}
                            displayName={u.displayName || u.handle}
                            handle={u.handle}
                            size="md"
                            className="shrink-0"
                          />
                          <div>
                            <div className="font-medium text-paper">
                              {u.displayName || u.handle}
                            </div>
                            <div className="text-xs text-tertiary">
                              @{u.handle}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )
              ) : (
                <>
                  <p className="text-xs font-semibold text-tertiary uppercase tracking-wider">
                    Suggested
                  </p>
                  {newMessageLoading ? (
                    <p className="text-secondary text-sm">Loading...</p>
                  ) : newMessageSuggestions.length === 0 ? (
                    <p className="text-secondary text-sm">
                      No suggestions. Search by name or handle above.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {newMessageSuggestions
                        .filter((u) => u.id !== (user as { id?: string })?.id)
                        .map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => startConversation(u)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-left"
                          >
                            <Avatar
                              avatarKey={u.avatarKey}
                              avatarUrl={u.avatarUrl}
                              displayName={u.displayName || u.handle}
                              handle={u.handle}
                              size="md"
                              className="shrink-0"
                            />
                            <div>
                              <div className="font-medium text-paper">
                                {u.displayName || u.handle}
                              </div>
                              <div className="text-xs text-tertiary">
                                @{u.handle}
                              </div>
                            </div>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat search + Refresh + New message button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={chatSearchQuery}
          onChange={(e) => setChatSearchQuery(e.target.value)}
          placeholder="Search in chats..."
          className="flex-1 px-4 py-2 border-b border-divider text-paper placeholder-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="button"
          onClick={handleRefreshThreads}
          disabled={refreshingThreads}
          className="p-2 text-tertiary hover:text-paper rounded-lg disabled:opacity-50"
          aria-label="Refresh"
          title="Refresh"
        >
          <svg
            className={`w-5 h-5 ${refreshingThreads ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setShowNewMessage(true)}
          className="px-4 py-2 bg-primary text-ink rounded-lg font-medium text-sm hover:opacity-90 transition-colors shrink-0"
        >
          New message
        </button>
      </div>

      {/* Chat search results */}
      {chatSearchQuery.trim().length >= 2 && (
        <div className="space-y-2">
          {chatSearchLoading ? (
            <p className="text-secondary text-sm">Searching...</p>
          ) : chatSearchResults.length === 0 ? (
            <p className="text-secondary text-sm">No matches in your chats.</p>
          ) : (
            chatSearchResults.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  setSelectedThread(hit.threadId);
                  setChatSearchQuery("");
                  setChatSearchResults([]);
                }}
                className="w-full flex items-center gap-3 p-3 border-b border-divider hover:bg-white/5 text-left"
              >
                <Avatar
                  avatarKey={hit.otherUser.avatarKey}
                  avatarUrl={hit.otherUser.avatarUrl}
                  displayName={hit.otherUser.displayName}
                  handle={hit.otherUser.handle}
                  size="md"
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-paper truncate">
                    {hit.otherUser.displayName}
                  </div>
                  <p className="text-xs text-tertiary truncate">{hit.body}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Thread list (when not searching or no results) */}
      {(!chatSearchQuery.trim() || chatSearchResults.length === 0) && (
        <div className="space-y-2">
          {threads.map((thread) => (
            <button
              key={thread.id}
              onClick={() => setSelectedThread(thread.id)}
              className="w-full p-4 border-b border-divider hover:bg-white/10 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  avatarKey={thread.otherUser.avatarKey}
                  avatarUrl={thread.otherUser.avatarUrl}
                  displayName={thread.otherUser.displayName}
                  handle={thread.otherUser.handle}
                  size="lg"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-paper truncate">
                    {thread.otherUser.displayName}
                  </div>
                  <div className="text-sm text-secondary truncate">
                    {thread.lastMessage?.body || "No messages yet"}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {thread.lastMessage && (
                    <span className="text-xs text-tertiary">
                      {formatTime(thread.lastMessage.createdAt)}
                    </span>
                  )}
                  {thread.unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
