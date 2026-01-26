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
    startHere?: any[];
    isFollowing?: boolean;
  };
}

export function TopicPage({ topic }: TopicPageProps) {
  const [isFollowing, setIsFollowing] = useState(topic.isFollowing || false);

  const handleFollow = async () => {
    const previous = isFollowing;
    setIsFollowing(!previous);
    try {
      // API call would go here
    } catch (error) {
      setIsFollowing(previous);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-ink border-b border-divider">
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-paper mb-2">{topic.title}</h1>
              <p className="text-secondary">Topic</p>
            </div>
            <button
              onClick={handleFollow}
              className={`px-6 py-2.5 rounded-full font-semibold transition-colors ${
                isFollowing
                  ? 'bg-transparent border border-primary text-primary hover:bg-primary/10'
                  : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
              }`}
            >
              {isFollowing ? 'Following' : 'Follow Topic'}
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-6 py-6 space-y-12 max-w-[680px] mx-auto w-full">
        {/* Start here (most cited) */}
        {topic.startHere && topic.startHere.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">Start here</h2>
            <div className="space-y-0">
              {topic.startHere.map((post: any) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* New */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">Latest Discussion</h2>
          <div className="space-y-0">
            {topic.posts && topic.posts.length > 0 ? (
              topic.posts.map((post: any) => (
                <PostItem key={post.id} post={post} />
              ))
            ) : (
              <p className="text-secondary text-sm py-12 text-center bg-white/5 rounded-lg border border-dashed border-divider">
                No discussions in this topic yet.
              </p>
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