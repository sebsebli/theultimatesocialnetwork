'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRealtime } from '@/context/realtime-provider';
import { useAuth } from '@/components/auth-provider';

interface Thread {
  id: string;
  otherUser: {
    id: string;
    handle: string;
    displayName: string;
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

export function MessagesTab() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const { on, off } = useRealtime();

  useEffect(() => {
    loadThreads();
  }, []);

  useEffect(() => {
    const handleMessage = (data: unknown) => {
      const message = data as Message;
      // Reload threads to update sidebar (last message, unread count)
      loadThreads();

      // If viewing this thread, append message
      if (selectedThread && message.threadId === selectedThread) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    };

    on('message', handleMessage);
    return () => {
      off('message', handleMessage);
    };
  }, [on, off, selectedThread]);

  useEffect(() => {
    if (selectedThread) {
      loadMessages(selectedThread);
    }
  }, [selectedThread]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/messages/threads');
      if (res.ok) {
        const data = await res.json();
        setThreads(data);
      }
    } catch (error) {
      console.error('Failed to load threads', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (threadId: string) => {
    try {
      const res = await fetch(`/api/messages/threads/${threadId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedThread || !user) return;

    const body = messageText;
    setMessageText('');

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMessage = {
      id: tempId,
      body,
      senderId: user.id,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);

    try {
      const res = await fetch(`/api/messages/threads/${selectedThread}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic message with saved one
        setMessages(prev => prev.map(m => m.id === tempId ? saved : m));
        loadThreads(); // Update sidebar in background
      } else {
        throw new Error('Failed to send');
      }
    } catch (error) {
      console.error('Failed to send message', error);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setMessageText(body); // Restore text
      alert('Failed to send message. Please try again.');
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-sm">Loading messages...</p>
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary text-sm">No messages yet.</p>
      </div>
    );
  }

  if (selectedThread) {
    const thread = threads.find(t => t.id === selectedThread);
    if (!thread) return null;

    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-divider">
          <button
            onClick={() => setSelectedThread(null)}
            className="text-tertiary hover:text-paper"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link href={`/user/${thread.otherUser.handle}`}>
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              {thread.otherUser.displayName.charAt(0)}
            </div>
          </Link>
          <div>
            <Link href={`/user/${thread.otherUser.handle}`}>
              <div className="font-semibold text-paper">{thread.otherUser.displayName}</div>
            </Link>
            <div className="text-xs text-tertiary">@{thread.otherUser.handle}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === thread.otherUser.id ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[70%] px-4 py-2 rounded-lg ${
                msg.senderId === thread.otherUser.id
                  ? 'bg-white/5 text-paper'
                  : 'bg-primary text-white'
              }`}>
                <p className="text-sm">{msg.body}</p>
                <p className={`text-xs mt-1 ${
                  msg.senderId === thread.otherUser.id ? 'text-tertiary' : 'text-primary/70'
                }`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="px-6 py-4 border-t border-divider">
          <div className="flex gap-2">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
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
    <div className="space-y-2">
      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => setSelectedThread(thread.id)}
          className="w-full p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold shrink-0">
              {thread.otherUser.displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-paper truncate">{thread.otherUser.displayName}</div>
              <div className="text-sm text-secondary truncate">
                {thread.lastMessage?.body || 'No messages yet'}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {thread.lastMessage && (
                <span className="text-xs text-tertiary">{formatTime(thread.lastMessage.createdAt)}</span>
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
  );
}
