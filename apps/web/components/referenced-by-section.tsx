"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar } from "./avatar";

interface ReferencedPost {
  id: string;
  title?: string;
  body: string;
  author: {
    handle: string;
    displayName: string;
    avatarKey?: string | null;
    avatarUrl?: string | null;
  };
  quoteCount: number;
  createdAt: string;
}

interface ReferencedBySectionProps {
  postId: string;
  quoteCount: number;
}

export function ReferencedBySection({
  postId,
  quoteCount,
}: ReferencedBySectionProps) {
  const [referencedPosts, setReferencedPosts] = useState<ReferencedPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quoteCount > 0) {
      loadReferencedPosts();
    } else {
      setReferencedPosts([]);
    }
  }, [postId, quoteCount]);

  const loadReferencedPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/referenced-by`);
      if (res.ok) {
        const data = await res.json();
        setReferencedPosts(data);
      }
    } catch {
      // ignore
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
        <div className="flex flex-col items-center justify-center py-10 px-4 bg-white/5 rounded-lg border border-dashed border-divider text-center">
          <svg
            className="w-12 h-12 text-tertiary mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="text-secondary text-sm">
            No posts quote this yet.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-divider pt-6">
      <h2 className="text-lg font-semibold mb-4 text-paper">
        Referenced by {quoteCount} {quoteCount === 1 ? "post" : "posts"}
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
                <Avatar
                  avatarKey={post.author.avatarKey}
                  avatarUrl={post.author.avatarUrl}
                  displayName={post.author.displayName}
                  handle={post.author.handle}
                  size="sm"
                />
                <div>
                  <div className="text-sm font-semibold text-paper">
                    {post.author.displayName}
                  </div>
                  <div className="text-xs text-tertiary">
                    @{post.author.handle}
                  </div>
                </div>
              </div>
              {post.title && (
                <h3 className="text-base font-bold text-paper mb-1">
                  {post.title}
                </h3>
              )}
              <p className="text-sm text-secondary line-clamp-2">{post.body}</p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-secondary text-sm">
          {quoteCount > 0
            ? `${quoteCount} posts reference this post`
            : "Not referenced yet."}
        </p>
      )}
    </section>
  );
}
