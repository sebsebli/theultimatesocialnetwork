"use client";

import Link from "next/link";
import { WhyLabel } from "./why-label";

interface TopicCardProps {
  topic: {
    id: string;
    slug: string;
    title: string;
    reasons?: string[];
    description?: string;
    postCount?: number;
    followerCount?: number;
    isFollowing?: boolean;
  };
  onFollow?: () => void;
}

export function TopicCard({ topic, onFollow }: TopicCardProps) {
  return (
    <Link href={`/topic/${encodeURIComponent(topic.slug)}`}>
      <div className="relative bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-stretch justify-end rounded-xl p-6 shadow-sm overflow-hidden border border-white/5 hover:border-primary/40 transition-all duration-300 group">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-paper text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
            {topic.title}
          </h4>
          {topic.reasons && <WhyLabel reasons={topic.reasons} />}
        </div>
        <div className="flex items-center gap-2 text-tertiary text-xs mb-3">
          <span>{topic.postCount || 0} posts</span>
          {topic.followerCount !== undefined && topic.followerCount > 0 && (
            <>
              <span>•</span>
              <span>{topic.followerCount} followers</span>
            </>
          )}
        </div>
        {topic.description && (
          <p className="text-secondary text-sm mb-4 max-w-sm line-clamp-2">
            {topic.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest">
            View Topic
            <svg
              className="w-3 h-3 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          {onFollow && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFollow();
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                topic.isFollowing
                  ? "bg-primary border-primary text-white"
                  : "border-primary text-primary hover:bg-primary/10"
              }`}
            >
              {topic.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
