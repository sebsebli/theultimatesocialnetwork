'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { renderMarkdown } from '@/utils/markdown';
import { OverflowMenu } from './overflow-menu';

export interface Post {
  id: string;
  title?: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    handle: string;
    displayName: string;
  };
  replyCount: number;
  quoteCount: number;
  privateLikeCount?: number;
  headerImageKey?: string;
}

interface PostItemProps {
  post: Post;
  isAuthor?: boolean;
}

export function PostItem({ post, isAuthor = false }: PostItemProps) {
  const [liked, setLiked] = useState(false);
  const [kept, setKept] = useState(false);
  
  // Base URL for MinIO (should be in env, using localhost for dev)
  const STORAGE_URL = 'http://localhost:9000/cite-images';

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString();
  };

  return (
    <article className="flex flex-col gap-3 px-5 py-6 border-b border-divider bg-ink">
      {/* Author Meta */}
      <Link href={`/user/${post.author.handle}`} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {post.author.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm text-paper">
            {post.author.displayName}
          </span>
          <span className="text-tertiary text-xs">•</span>
          <span className="text-tertiary text-xs">{formatTime(post.createdAt)}</span>
        </div>
      </Link>

      {/* Content */}
      <Link href={post.title ? `/post/${post.id}/reading` : `/post/${post.id}`} className="flex flex-col gap-2 cursor-pointer">
        {post.title && (
          <h2 className="text-lg font-bold leading-snug tracking-tight text-paper">
            {post.title}
          </h2>
        )}
        <div 
          className="text-base leading-relaxed text-secondary font-normal prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }}
        />
        {post.headerImageKey && (
          <div className="relative w-full h-[200px] rounded-xl bg-divider mt-3 overflow-hidden">
            <Image 
              src={`${STORAGE_URL}/${post.headerImageKey}`}
              alt="Post header"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 680px"
            />
          </div>
        )}
      </Link>

      {/* Private Like Feedback (Author Only) */}
      {isAuthor && post.privateLikeCount && post.privateLikeCount > 0 && (
        <div className="flex items-center gap-1.5 mb-2">
          <svg className="w-3.5 h-3.5 text-tertiary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <p className="text-[13px] font-medium text-tertiary">
            Private: Liked by <span className="text-secondary">{post.privateLikeCount} people</span>
          </p>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-2 pr-4 text-tertiary">
        <button 
          onClick={() => setLiked(!liked)}
          className={`flex items-center gap-1 hover:text-primary transition-colors ${liked ? 'text-like' : ''}`}
        >
          <svg className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <Link href={`/post/${post.id}#reply`} className="flex items-center gap-1 hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {post.replyCount > 0 && (
            <span className="text-xs">{post.replyCount}</span>
          )}
        </Link>
        <Link href={`/compose?quote=${post.id}`} className="flex items-center gap-1 hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {post.quoteCount > 0 && (
            <span className="text-xs">{post.quoteCount}</span>
          )}
        </Link>
        <button 
          onClick={() => setKept(!kept)}
          className={`flex items-center gap-1 hover:text-primary transition-colors ${kept ? 'text-primary' : ''}`}
        >
          <svg className="w-5 h-5" fill={kept ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <OverflowMenu 
          postId={post.id} 
          userId={post.author.handle}
          isAuthor={isAuthor}
          onCopyLink={() => {
            const url = `${window.location.origin}/post/${post.id}`;
            navigator.clipboard.writeText(url);
          }}
        />
      </div>
    </article>
  );
}
