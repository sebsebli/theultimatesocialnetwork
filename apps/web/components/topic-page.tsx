"use client";

import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/security";
import { PostItem, Post } from "./post-item";
import { TopicCard } from "./topic-card";
import { UserCard } from "./user-card";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";

const HERO_FADE_HEIGHT = 280;
const STICKY_HEADER_APPEAR = 120;
const POSTS_PAGE_SIZE = 15;

type TabKey = "recent" | "discussed" | "sources" | "people";

interface TopicSource {
  id?: string;
  url: string;
  title?: string | null;
}

interface TopicPerson {
  id: string;
  handle: string;
  displayName?: string;
  postCount?: number;
  totalQuotes?: number;
  isFollowing?: boolean;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

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
  const [activeTab, setActiveTab] = useState<TabKey>("recent");
  const [posts, setPosts] = useState<Post[]>(topic.posts ?? []);
  const [_postsPage, setPostsPage] = useState(1);
  void _postsPage;
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [sources, setSources] = useState<TopicSource[]>([]);
  const [people, setPeople] = useState<TopicPerson[]>([]);
  const [sourcesPage, setSourcesPage] = useState(1);
  const [peoplePage, setPeoplePage] = useState(1);
  const [hasMoreSources, setHasMoreSources] = useState(true);
  const [hasMorePeople, setHasMorePeople] = useState(true);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingPeople, setLoadingPeople] = useState(false);
  const [tabDataLoaded, setTabDataLoaded] = useState<Record<TabKey, boolean>>({
    recent: true,
    discussed: false,
    sources: false,
    people: false,
  });
  const [moreTopics, setMoreTopics] = useState<TopicSummary[]>([]);
  const loadMoreSentinel = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef(1);

  // Hero: use the most recent article in the topic that has a header image (same as topic cards)
  const headerImagePost = useMemo(() => {
    const postsWithImage = (topic.posts ?? posts).filter(
      (p) => p?.headerImageKey,
    );
    return (
      postsWithImage.sort(
        (a, b) =>
          new Date(b.createdAt ?? 0).getTime() -
          new Date(a.createdAt ?? 0).getTime(),
      )[0] ?? null
    );
  }, [topic.posts, posts]);
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

  const handleFollowTopic = useCallback(
    async (slug: string, currentlyFollowing: boolean) => {
      const method = currentlyFollowing ? "DELETE" : "POST";
      const res = await fetch(
        `/api/topics/${encodeURIComponent(slug)}/follow`,
        {
          method,
        },
      );
      if (!res.ok) return;
      setMoreTopics((prev) =>
        prev.map((t) =>
          t.slug === slug ? { ...t, isFollowing: !currentlyFollowing } : t,
        ),
      );
    },
    [],
  );

  const loadPosts = useCallback(
    async (
      page: number,
      append: boolean,
      sort: "recent" | "ranked" = "recent",
    ) => {
      if (append) setLoadingMorePosts(true);
      try {
        const res = await fetch(
          `/api/topics/${encodeURIComponent(topic.slug)}/posts?page=${page}&limit=${POSTS_PAGE_SIZE}&sort=${sort}`,
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

  const loadSources = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingSources(true);
      try {
        const res = await fetch(
          `/api/topics/${encodeURIComponent(topic.slug)}/sources?page=${page}&limit=${POSTS_PAGE_SIZE}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const items = (data.items ?? []) as TopicSource[];
        setHasMoreSources(
          items.length >= POSTS_PAGE_SIZE && data.hasMore !== false,
        );
        if (append) {
          setSources((prev) => [...prev, ...items]);
        } else {
          setSources(items);
        }
      } catch {
        setHasMoreSources(false);
      } finally {
        if (append) setLoadingSources(false);
      }
    },
    [topic.slug],
  );

  const loadPeople = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingPeople(true);
      try {
        const res = await fetch(
          `/api/topics/${encodeURIComponent(topic.slug)}/people?page=${page}&limit=${POSTS_PAGE_SIZE}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const items = (data.items ?? []) as TopicPerson[];
        setHasMorePeople(
          items.length >= POSTS_PAGE_SIZE && data.hasMore !== false,
        );
        if (append) {
          setPeople((prev) => [...prev, ...items]);
        } else {
          setPeople(items);
        }
      } catch {
        setHasMorePeople(false);
      } finally {
        if (append) setLoadingPeople(false);
      }
    },
    [topic.slug],
  );

  useEffect(() => {
    if (topic.posts?.length && activeTab === "recent") {
      setPosts(topic.posts);
      nextPageRef.current = 2;
      setHasMorePosts((topic.posts?.length ?? 0) >= POSTS_PAGE_SIZE);
    }
  }, [topic.slug, topic.posts, activeTab]);

  // Load tab data when switching tabs
  useEffect(() => {
    if (activeTab === "discussed" && !tabDataLoaded.discussed) {
      setTabDataLoaded((prev) => ({ ...prev, discussed: true }));
      loadPosts(1, false, "ranked");
    } else if (activeTab === "recent" && tabDataLoaded.discussed) {
      // Switching back from discussed: reload recent
      loadPosts(1, false, "recent");
    } else if (activeTab === "sources" && !tabDataLoaded.sources) {
      setTabDataLoaded((prev) => ({ ...prev, sources: true }));
      loadSources(1, false);
    } else if (activeTab === "people" && !tabDataLoaded.people) {
      setTabDataLoaded((prev) => ({ ...prev, people: true }));
      loadPeople(1, false);
    }
  }, [activeTab, tabDataLoaded, loadPosts, loadSources, loadPeople]);

  useEffect(() => {
    if (activeTab === "recent" && !topic.posts?.length) {
      loadPosts(1, false, "recent");
    }
  }, [topic.slug, activeTab, topic.posts?.length, loadPosts]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/explore/topics")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data?.items ?? []);
          setMoreTopics(
            list
              .filter((t: TopicSummary) => t.slug !== topic.slug)
              .slice(0, 10),
          );
        }
      })
      .catch(() => {
        /* topics load best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [topic.slug]);

  useEffect(() => {
    const el = loadMoreSentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (activeTab === "recent" || activeTab === "discussed") {
          if (!hasMorePosts || loadingMorePosts) return;
          const page = nextPageRef.current;
          nextPageRef.current = page + 1;
          setPostsPage((p) => p + 1);
          loadPosts(
            page,
            true,
            activeTab === "discussed" ? "ranked" : "recent",
          );
        } else if (
          activeTab === "sources" &&
          hasMoreSources &&
          !loadingSources
        ) {
          const next = sourcesPage + 1;
          setSourcesPage(next);
          loadSources(next, true);
        } else if (activeTab === "people" && hasMorePeople && !loadingPeople) {
          const next = peoplePage + 1;
          setPeoplePage(next);
          loadPeople(next, true);
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    activeTab,
    hasMorePosts,
    loadingMorePosts,
    hasMoreSources,
    loadingSources,
    hasMorePeople,
    loadingPeople,
    sourcesPage,
    peoplePage,
    loadPosts,
    loadSources,
    loadPeople,
  ]);

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
              aria-hidden="true"
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
        {/* Tabs – parity with mobile: Recent, Discussed, Sources, People */}
        <div className="sticky top-0 z-40 bg-ink border-b border-divider">
          <div className="flex overflow-x-auto no-scrollbar">
            {(
              [
                ["recent", "Most recent"],
                ["discussed", "Most discussed"],
                ["sources", "Sources"],
                ["people", "People"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === key
                    ? "border-primary text-paper"
                    : "border-transparent text-tertiary hover:text-paper"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal scroll – more topics */}
        {moreTopics.length > 0 && (
          <section className="px-4 py-6 border-b border-divider">
            <h2 className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-3">
              More topics
            </h2>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 no-scrollbar">
              {moreTopics.map((t) => (
                <div key={t.id} className="shrink-0 w-[280px]">
                  <TopicCard
                    topic={t}
                    onFollow={() =>
                      handleFollowTopic(t.slug, t.isFollowing ?? false)
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Start here – only on Recent tab */}
        {activeTab === "recent" &&
          topic.startHere &&
          topic.startHere.length > 0 && (
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

        {/* Tab content: Recent / Discussed = posts; Sources = links; People = user cards */}
        <section className="px-6 py-8 border-b border-divider">
          {(activeTab === "recent" || activeTab === "discussed") && (
            <>
              <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
                {activeTab === "recent"
                  ? "Latest Discussion"
                  : "Most Discussed"}
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
                  <div className={emptyStateCenterClassName}>
                    <EmptyState
                      headline="No discussions in this topic yet"
                      subtext="Be the first to share a post here."
                      compact
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "sources" && (
            <>
              <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
                Sources
              </h2>
              {sources.length > 0 ? (
                <div className="space-y-2">
                  {sources.map((s, i) => (
                    <a
                      key={s.id ?? s.url ?? String(i)}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <p className="font-medium text-paper truncate">
                        {s.title || (s.url ? new URL(s.url).hostname : "Link")}
                      </p>
                      <p className="text-xs text-tertiary truncate mt-0.5">
                        {s.url}
                      </p>
                    </a>
                  ))}
                  <div ref={loadMoreSentinel} className="h-4" />
                  {loadingSources && (
                    <p className="text-secondary text-sm py-4 text-center">
                      Loading…
                    </p>
                  )}
                </div>
              ) : (
                <div className={emptyStateCenterClassName}>
                  <EmptyState
                    headline="No sources yet"
                    subtext="Linked sources in this topic will appear here."
                    compact
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "people" && (
            <>
              <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2">
                People
              </h2>
              {people.length > 0 ? (
                <div className="space-y-2">
                  {people.map((person) => (
                    <UserCard
                      key={person.id}
                      person={{
                        id: person.id,
                        handle: person.handle,
                        displayName: person.displayName,
                        isFollowing: person.isFollowing,
                        avatarKey: person.avatarKey,
                        avatarUrl: person.avatarUrl,
                      }}
                    />
                  ))}
                  <div ref={loadMoreSentinel} className="h-4" />
                  {loadingPeople && (
                    <p className="text-secondary text-sm py-4 text-center">
                      Loading…
                    </p>
                  )}
                </div>
              ) : (
                <div className={emptyStateCenterClassName}>
                  <EmptyState
                    headline="No contributors yet"
                    subtext="People who post in this topic will appear here."
                    compact
                  />
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export const TopicPage = memo(TopicPageInner);
