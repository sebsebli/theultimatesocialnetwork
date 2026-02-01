"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostItem, Post } from "./post-item";
import { TopicCard } from "./topic-card";
import { UserCard } from "./user-card";
import { WhyLabel } from "./why-label";

const EXPLORE_TABS = ["quoted", "deep-dives", "newsroom", "topics", "people"] as const;
const SWIPE_MIN_DISTANCE = 60;
const SWIPE_HORIZONTAL_RATIO = 1.5; // deltaX must be this much larger than deltaY

interface Topic {
  id: string;
  slug: string;
  title: string;
  reasons?: string[];
  description?: string;
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

interface Person {
  id: string;
  handle: string;
  displayName?: string;
  bio?: string;
  reasons?: string[];
  isFollowing?: boolean;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

interface ExplorePost extends Post {
  reasons?: string[];
}

type TabData = {
  topics: Topic[];
  people: Person[];
  quoted: ExplorePost[];
  "deep-dives": ExplorePost[];
  newsroom: ExplorePost[];
};

export function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "quoted";
  const sort = searchParams.get("sort") || "recommended";
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const [tabData, setTabData] = useState<TabData>({
    topics: [],
    people: [],
    quoted: [],
    "deep-dives": [],
    newsroom: [],
  });
  const [loading, setLoading] = useState(false);

  const loadContent = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (sort) query.set("sort", sort);
      const queryString = query.toString() ? `?${query.toString()}` : "";

      const endpoints: Record<string, string> = {
        topics: "/api/explore/topics",
        people: "/api/explore/people",
        quoted: "/api/explore/quoted-now",
        "deep-dives": "/api/explore/deep-dives",
        newsroom: "/api/explore/newsroom",
      };

      const res = await fetch(`${endpoints[tab]}${queryString}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : data.items || [];
        setTabData((prev) => ({ ...prev, [tab]: items }));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, sort]);

  useEffect(() => {
    const key = tab as keyof TabData;
    if (tabData[key]?.length === 0) {
      loadContent();
    }
  }, [tab, sort, loadContent, tabData]);

  const handleFollowTopic = async (topicId: string, slug: string) => {
    setTabData((prev) => ({
      ...prev,
      topics: prev.topics.map((t) =>
        t.id === topicId ? { ...t, isFollowing: !t.isFollowing } : t,
      ),
    }));

    try {
      const isFollowing = tabData.topics.find(
        (t) => t.id === topicId,
      )?.isFollowing;
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/topics/${encodeURIComponent(slug)}/follow`, { method });
    } catch {
      // Revert
      setTabData((prev) => ({
        ...prev,
        topics: prev.topics.map((t) =>
          t.id === topicId ? { ...t, isFollowing: !t.isFollowing } : t,
        ),
      }));
    }
  };

  const handleFollowPerson = async (userId: string) => {
    setTabData((prev) => ({
      ...prev,
      people: prev.people.map((p) =>
        p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p,
      ),
    }));

    try {
      const isFollowing = tabData.people.find(
        (p) => p.id === userId,
      )?.isFollowing;
      const method = isFollowing ? "DELETE" : "POST";
      await fetch(`/api/users/${userId}/follow`, { method });
    } catch {
      // Revert
      setTabData((prev) => ({
        ...prev,
        people: prev.people.map((p) =>
          p.id === userId ? { ...p, isFollowing: !p.isFollowing } : p,
        ),
      }));
    }
  };

  // Helper to get active items
  const activeItems =
    (tabData as unknown as Record<string, (Topic | Person | ExplorePost)[]>)[
      tab
    ] || [];

  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onSwipeEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStart.current.x;
      const deltaY = endY - touchStart.current.y;
      touchStart.current = null;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      if (absX < SWIPE_MIN_DISTANCE || absX < absY * SWIPE_HORIZONTAL_RATIO) return;
      const currentIndex = EXPLORE_TABS.indexOf(tab as (typeof EXPLORE_TABS)[number]);
      if (currentIndex === -1) return;
      if (deltaX < 0) {
        if (currentIndex < EXPLORE_TABS.length - 1) {
          const next = EXPLORE_TABS[currentIndex + 1];
          router.push(`/explore?tab=${next}${sort && sort !== "recommended" ? `&sort=${sort}` : ""}`);
        }
      } else {
        if (currentIndex > 0) {
          const prev = EXPLORE_TABS[currentIndex - 1];
          router.push(`/explore?tab=${prev}${sort && sort !== "recommended" ? `&sort=${sort}` : ""}`);
        }
      }
    },
    [tab, sort, router],
  );

  return (
    <div
      className="flex flex-col gap-4 pb-20 md:pb-0 px-4 md:px-6 pt-2 touch-pan-y"
      onTouchStart={onSwipeStart}
      onTouchEnd={onSwipeEnd}
    >
      <h3 className="text-xl md:text-[1.25rem] font-bold leading-tight text-left text-paper tracking-tight px-4 md:px-0 mb-4">
        Discover
      </h3>

      {loading && activeItems.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary text-sm">Finding context...</p>
        </div>
      ) : activeItems.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-divider rounded-xl">
          <p className="text-secondary text-sm">
            No items found in this category.
          </p>
        </div>
      ) : (
        <div className={tab === "topics" ? "space-y-2" : "space-y-4"}>
          {tab === "topics" &&
            (activeItems as Topic[]).map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onFollow={() => handleFollowTopic(topic.id, topic.slug)}
              />
            ))}

          {tab === "people" &&
            (activeItems as Person[]).map((person) => (
              <UserCard
                key={person.id}
                person={person}
                onFollow={() => handleFollowPerson(person.id)}
              />
            ))}

          {(tab === "quoted" || tab === "deep-dives" || tab === "newsroom") &&
            (activeItems as ExplorePost[]).map((post) => (
              <div key={post.id} className="relative group">
                <PostItem post={post} />
                {post.reasons && (
                  <div className="absolute top-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <WhyLabel reasons={post.reasons} />
                  </div>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
