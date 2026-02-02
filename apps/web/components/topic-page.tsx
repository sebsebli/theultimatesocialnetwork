"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/security";
import { PostItem, Post } from "./post-item";
import { TopicCard } from "./topic-card";

const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const POSTS_PAGE_SIZE = 15;

export interface TopicPageProps {
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

interface TopicSummary {
  id: string;
  slug: string;
  title: string;
  postCount?: number;
  followerCount?: number;
  isFollowing?: boolean;
  recentPostImageKey?: string | null;
  recentPost?: {
    id: string;
    title: string | null;
    bodyExcerpt: string;
    headerImageKey: string | null;
    author: { handle: string; displayName: string } | null;
    createdAt: string | null;
  } | null;
}

function TopicPageInner({ topic }: TopicPageProps) {
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(topic.isFollowing ?? false);
  const [scrollY, setScrollY] = useState(0);
  const [posts, setPosts] = useState<Post[]>(topic.posts ?? []);
  const [_postsPage, setPostsPage] = useState(1);
  void _postsPage;
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [moreTopics, setMoreTopics] = useState<TopicSummary[]>([]);
  const loadMoreSentinel = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef(1);

  const headerImagePost = topic.posts?.find((p) => p.headerImageKey);
  const headerImageUrl = headerImagePost?.headerImageKey
    ? getImageUrl(headerImagePost.headerImageKey)
    : null;

  const handleFollow = async () => {
    const previous = isFollowing;
    setIsFollowing(!previous);
    try {
      const method = previous ? "DELETE" : "POST";
      const res = await fetch(
        `/api/topics/${encodeURIComponent(topic.slug)}/follow`,
        { method },
      );
      if (!res.ok) throw new Error("Failed to toggle follow");
    } catch {
      setIsFollowing(previous);
    }
  };

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY ?? 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / HERO_FADE_HEIGHT);
  const stickyHeaderOpacity = Math.min(
    1,
    Math.max(0, (scrollY - STICKY_HEADER_APPEAR) / 80),
  );

  const loadPosts = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingMorePosts(true);
      try {
        const res = await fetch(
          `/api/topics/${encodeURIComponent(topic.slug)}/posts?page=${page}&limit=${POSTS_PAGE_SIZE}&sort=recent`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const items = data.items ?? [];
        const hasMore = data.hasMore === true;
        setHasMorePosts(hasMore);
        if (append) {
          setPosts((prev) => [...prev, ...items]);
        } else {
          setPosts(items);
          nextPageRef.current = 2;
        }
      } catch {
        setHasMorePosts(false);
      } finally {
        if (append) setLoadingMorePosts(false);
      }
    },
    [topic.slug],
  );

  useEffect(() => {
    if (topic.posts?.length) {
      setPosts(topic.posts);
      nextPageRef.current = 2;
      setHasMorePosts((topic.posts?.length ?? 0) >= POSTS_PAGE_SIZE);
    } else {
      loadPosts(1, false);
    }
  }, [topic.slug, topic.posts, loadPosts]);

  useEffect(() => {
    fetch("/api/explore/topics")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.items ?? []);
        setMoreTopics(
          list.filter((t: TopicSummary) => t.slug !== topic.slug).slice(0, 10),
        );
      })
      .catch(() => {});
  }, [topic.slug]);

  useEffect(() => {
    if (!hasMorePosts || loadingMorePosts) return;
    const el = loadMoreSentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const page = nextPageRef.current;
        nextPageRef.current = page + 1;
        setPostsPage((p) => p + 1);
        loadPosts(page, true);
      },
      { rootMargin: "200px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMorePosts, loadingMorePosts, loadPosts]);

  return (
    <div className="min-h-screen bg-ink">
      {/* Sticky header – fades in on scroll */}
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-divider bg-ink/95 backdrop-blur-md transition-opacity duration-150"
        style={{
          opacity: stickyHeaderOpacity,
          pointerEvents: stickyHeaderOpacity > 0 ? "auto" : "none",
        }}
      >
        <div className="max-w-[680px] mx-auto flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-secondary hover:text-paper p-1 -ml-1"
            aria-label="Back"
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
          <h1 className="text-lg font-semibold text-paper truncate max-w-[60%]">
            {topic.title}
          </h1>
          <div className="w-8" />
        </div>
      </header>

      {/* Hero – fades out on scroll */}
      <div
        className="relative border-b border-divider overflow-hidden min-h-[200px] flex items-end transition-opacity duration-150"
        style={{ opacity: heroOpacity }}
      >
        {headerImageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={headerImageUrl}
              alt=""
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
                <span>{(topic.postCount ?? 0).toLocaleString()} posts</span>
                <span>•</span>
                <span>
                  {(topic.contributorCount ?? 0).toLocaleString()} contributors
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

      {/* Full-page scrollable content */}
      <div className="max-w-[680px] mx-auto w-full">
        {/* Horizontal scroll – more topics */}
        {moreTopics.length > 0 && (
          <section className="px-4 py-6 border-b border-divider">
            <h2 className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-3">
              More topics
            </h2>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 no-scrollbar">
              {moreTopics.map((t) => (
                <div key={t.id} className="shrink-0 w-[280px]">
                  <TopicCard topic={t} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Start here */}
        {topic.startHere && topic.startHere.length > 0 && (
          <section className="px-6 py-8 border-b border-divider">
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

        {/* Latest Discussion – lazy loaded */}
        <section className="px-6 py-8 border-b border-divider">
          <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
            Latest Discussion
          </h2>
          <div className="space-y-0">
            {posts.length > 0 ? (
              <>
                {posts.map((post) => (
                  <PostItem key={post.id} post={post} />
                ))}
                <div ref={loadMoreSentinel} className="h-4" />
                {loadingMorePosts && (
                  <p className="text-secondary text-sm py-4 text-center">
                    Loading…
                  </p>
                )}
              </>
            ) : (
              <p className="text-secondary text-sm py-12 text-center bg-white/5 rounded-lg border border-dashed border-divider">
                No discussions in this topic yet.
              </p>
            )}
          </div>
        </section>

        {/* People & Sources */}
        <section className="px-6 py-8 space-y-8">
          <div>
            <h2 className="text-lg font-semibold mb-4 text-paper">People</h2>
            <p className="text-secondary text-sm">
              Top authors in this topic coming soon…
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
            <p className="text-secondary text-sm">Frequent URLs coming soon…</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export const TopicPage = memo(TopicPageInner);
