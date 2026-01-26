'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { OverflowMenu } from './overflow-menu';

interface Reply {
  id: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    handle: string;
    displayName: string;
  };
  parentReply?: Reply;
}

interface ReplySectionProps {
  postId: string;
  replyCount: number;
}

export function ReplySection({ postId, replyCount }: ReplySectionProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (replyCount > 0) {
      loadReplies();
    }
  }, [postId]);

  const loadReplies = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/replies`);
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch (error) {
      console.error('Failed to load replies', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    const body = replyText;
    setReplyText('');
    setShowReplyBox(false);

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newReply = {
      id: tempId,
      body,
      createdAt: new Date().toISOString(),
      author: {
        id: 'me', // placeholder
        handle: 'me',
        displayName: 'Me',
      },
    };
    
    setReplies(prev => [newReply, ...prev]);

    try {
      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });

      if (res.ok) {
        const saved = await res.json();
        // Replace optimistic reply with real one
        setReplies(prev => prev.map(r => r.id === tempId ? saved : r));
      } else {
        throw new Error('Failed to post');
      }
    } catch (error) {
      console.error('Failed to post reply', error);
      // Remove optimistic reply on failure
      setReplies(prev => prev.filter(r => r.id !== tempId));
      setReplyText(body); // Restore text
      setShowReplyBox(true);
      alert('Failed to post reply. Please try again.');
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

  return (
    <section className="border-t border-divider pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-paper">
          {replyCount} {replyCount === 1 ? 'Reply' : 'Replies'}
        </h2>
        <button
          onClick={() => setShowReplyBox(!showReplyBox)}
          className="text-primary text-sm font-medium hover:underline"
        >
          {showReplyBox ? 'Cancel' : 'Reply'}
        </button>
      </div>

      {showReplyBox && (
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
                setReplyText('');
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
          {replies.map((reply) => (
            <div key={reply.id} className="pl-4 border-l-2 border-divider">
              <div className="flex items-center gap-3 mb-2">
                <Link href={`/user/${reply.author.handle}`}>
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                    {reply.author.displayName.charAt(0)}
                  </div>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Link href={`/user/${reply.author.handle}`}>
                      <span className="text-sm font-semibold text-paper hover:text-primary">
                        {reply.author.displayName}
                      </span>
                    </Link>
                    <OverflowMenu 
                      replyId={reply.id} 
                      userId={reply.author.handle}
                    />
                  </div>
                  <span className="text-xs text-tertiary ml-2 -mt-1 block">
                    @{reply.author.handle} • {formatTime(reply.createdAt)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-secondary leading-relaxed">{reply.body}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
