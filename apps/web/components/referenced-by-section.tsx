'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ReferencedPost {
  id: string;
  title?: string;
  body: string;
  author: {
    handle: string;
    displayName: string;
  };
  quoteCount: number;
  createdAt: string;
}

interface ReferencedBySectionProps {
  postId: string;
  quoteCount: number;
}

export function ReferencedBySection({ postId, quoteCount }: ReferencedBySectionProps) {
  const [referencedPosts, setReferencedPosts] = useState<ReferencedPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quoteCount > 0) {
      loadReferencedPosts();
    }
  }, [postId]);

  const loadReferencedPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/referenced-by`);
      if (res.ok) {
        const data = await res.json();
        setReferencedPosts(data);
      }
    } catch (error) {
      console.error('Failed to load referenced posts', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Referenced by</h2>
        <p className="text-secondary text-sm">Loading...</p>
      </section>
    );
  }

  if (quoteCount === 0 && referencedPosts.length === 0) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Referenced by</h2>
        <p className="text-secondary text-sm">Not referenced yet.</p>
      </section>
    );
  }

  return (
    <section className="border-t border-divider pt-6">
      <h2 className="text-lg font-semibold mb-4 text-paper">
        Referenced by {quoteCount} {quoteCount === 1 ? 'post' : 'posts'}
      </h2>
      {referencedPosts.length > 0 ? (
        <div className="space-y-4">
          {referencedPosts.map((post) => (
            <Link
              key={post.id}
              href={`/post/${post.id}`}
              className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs">
                  {post.author.displayName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-paper">{post.author.displayName}</div>
                  <div className="text-xs text-tertiary">@{post.author.handle}</div>
                </div>
              </div>
              {post.title && (
                <h3 className="text-base font-bold text-paper mb-1">{post.title}</h3>
              )}
              <p className="text-sm text-secondary line-clamp-2">{post.body}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-sm">
          {quoteCount > 0 ? `${quoteCount} posts reference this post` : 'Not referenced yet.'}
        </p>
      )}
    </section>
  );
}
