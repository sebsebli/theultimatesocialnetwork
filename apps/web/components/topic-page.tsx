"use client";

import { useState } from "react";
import Image from "next/image";
import { PostItem, Post } from "./post-item";

interface TopicPageProps {
  topic: {
    id: string;
    slug: string;
    title: string;
    description?: string;
    postCount?: number;
    contributorCount?: number;
    posts?: Post[];
    startHere?: Post[];
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
    } catch {
      setIsFollowing(previous);
    }
  };

  const headerImagePost = topic.posts?.find((p) => p.headerImageKey);
  const headerImageUrl = headerImagePost
    ? `http://localhost:9000/cite-images/${headerImagePost.headerImageKey}`
    : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="relative bg-ink border-b border-divider overflow-hidden min-h-[200px] flex items-end">
        {headerImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={headerImageUrl}
              alt="Topic header"
              fill
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
          </div>
        )}

        <div className="relative z-10 max-w-[680px] mx-auto px-6 py-8 w-full">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-paper mb-2">
                {topic.title}
              </h1>
              <div className="flex items-center gap-2 text-secondary text-sm">
                <span>Topic</span>
                <span>•</span>
                <span>{(topic.postCount || 0).toLocaleString()} posts</span>
                <span>•</span>
                <span>
                  {(topic.contributorCount || 0).toLocaleString()} contributors
                </span>
              </div>
              {topic.description && (
                <p className="mt-4 text-paper/90 max-w-xl text-lg leading-relaxed">
                  {topic.description}
                </p>
              )}
            </div>
            <button
              onClick={handleFollow}
              className={`px-6 py-2.5 rounded-full font-semibold transition-colors shrink-0 ${
                isFollowing
                  ? "bg-white/10 border border-white/20 text-paper hover:bg-white/20"
                  : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
              }`}
            >
              {isFollowing ? "Following" : "Follow Topic"}
            </button>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="px-6 py-6 space-y-12 max-w-[680px] mx-auto w-full">
        {/* Start here (most cited) */}
        {topic.startHere && topic.startHere.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
              Start here
            </h2>
            <div className="space-y-0">
              {topic.startHere.map((post) => (
                <PostItem key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* New */}
        <section>
          <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
            Latest Discussion
          </h2>
          <div className="space-y-0">
            {topic.posts && topic.posts.length > 0 ? (
              topic.posts.map((post) => <PostItem key={post.id} post={post} />)
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
          <p className="text-secondary text-sm">
            Top authors in this topic coming soon...
          </p>
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
