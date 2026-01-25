'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PostItem } from './post-item';

interface TopicPageProps {
  topic: {
    id: string;
    slug: string;
    title: string;
    posts?: any[];
    isFollowing?: boolean;
  };
}

export function TopicPage({ topic }: TopicPageProps) {
  const [following, setFollowing] = useState(topic.isFollowing || false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    setLoading(true);
    try {
      const method = following ? 'DELETE' : 'POST';
      const res = await fetch(`/api/topics/${topic.slug}/follow`, { method });
      
      if (res.ok) {
        setFollowing(!following);
      }
    } catch (error) {
      console.error('Failed to toggle follow', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/explore" className="text-secondary hover:text-paper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <button className="text-secondary hover:text-paper">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Topic Header */}
      <div className="px-6 pt-6 pb-4 border-b border-divider">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-paper">{topic.title}</h1>
          <button
            onClick={handleFollow}
            disabled={loading}
            className={`px-4 py-2 rounded-full border transition-colors disabled:opacity-50 ${
              following
                ? 'bg-primary border-primary text-white'
                : 'border-primary text-primary hover:bg-primary/10'
            }`}
          >
            {loading ? '...' : following ? 'Following' : 'Follow topic'}
          </button>
        </div>
        <p className="text-secondary text-sm">
          {/* Optional description would go here */}
        </p>
      </div>

      {/* Sections */}
      <div className="px-6 py-6 space-y-8">
        {/* Start here (most cited) */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Start here</h2>
          <div className="space-y-0">
            {topic.posts && topic.posts.length > 0 ? (
              topic.posts.slice(0, 3).map((post: any) => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <p className="text-secondary text-sm">No posts yet.</p>
            )}
          </div>
        </section>

        {/* New */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">New</h2>
          <div className="space-y-0">
            {topic.posts && topic.posts.length > 0 ? (
              topic.posts.map((post: any) => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <p className="text-secondary text-sm">No posts yet.</p>
            )}
          </div>
        </section>

        {/* People */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">People</h2>
          <p className="text-secondary text-sm">Top authors in this topic coming soon...</p>
        </section>

        {/* Sources */}
        <section>
          <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
          <p className="text-secondary text-sm">Frequent URLs coming soon...</p>
        </section>
      </div>
    </div>
  );
}
