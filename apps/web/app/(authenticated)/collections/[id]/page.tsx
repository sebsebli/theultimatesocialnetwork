"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostItem, Post } from "@/components/post-item";
import { UserCard } from "@/components/user-card";
import { EditCollectionModal } from "@/components/edit-collection-modal";
import { getImageUrl } from "@/lib/security";

const HERO_FADE_HEIGHT = 200;
const STICKY_HEADER_APPEAR = 100;
const ITEMS_PAGE_SIZE = 20;

type CollectionTabKey = "newest" | "ranked" | "sources" | "contributors";

interface CollectionItemType {
  id: string;
  post: Post;
  curatorNote?: string;
}

interface CollectionSource {
  id?: string;
  url: string;
  title?: string | null;
}

interface CollectionContributor {
  id: string;
  handle: string;
  displayName?: string;
  postCount?: number;
  totalQuotes?: number;
  isFollowing?: boolean;
  avatarKey?: string | null;
  avatarUrl?: string | null;
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  ownerId?: string;
  items?: CollectionItemType[];
  shareSaves?: boolean;
  hasMore?: boolean;
}

interface CollectionSummary {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
  previewImageKey?: string | null;
}

export default function CollectionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const params = use(props.params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [activeTab, setActiveTab] = useState<CollectionTabKey>("newest");
  const [items, setItems] = useState<CollectionItemType[]>([]);
  const [sources, setSources] = useState<CollectionSource[]>([]);
  const [contributors, setContributors] = useState<CollectionContributor[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [hasMoreSources, setHasMoreSources] = useState(true);
  const [hasMoreContributors, setHasMoreContributors] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingSources, setLoadingSources] = useState(false);
  const [loadingContributors, setLoadingContributors] = useState(false);
  const [shareSaves, setShareSaves] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [otherCollections, setOtherCollections] = useState<CollectionSummary[]>(
    [],
  );
  const [tabLoaded, setTabLoaded] = useState<Record<CollectionTabKey, boolean>>(
    {
      newest: true,
      ranked: false,
      sources: false,
      contributors: false,
    },
  );
  const loadMoreSentinel = useRef<HTMLDivElement>(null);
  const nextOffsetRef = useRef(0);
  const sourcesPageRef = useRef(1);
  const contributorsPageRef = useRef(1);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => {
        if (!cancelled) setCurrentUserId(me?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setCurrentUserId(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const isOwner =
    !!collection?.ownerId &&
    !!currentUserId &&
    collection.ownerId === currentUserId;

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/collections/${params.id}?limit=${ITEMS_PAGE_SIZE}&offset=0`,
      );
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
        const initialItems = data.items ?? [];
        setItems(initialItems);
        nextOffsetRef.current = initialItems.length;
        setHasMore(data.hasMore === true);
        setShareSaves(data.shareSaves || false);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("Failed to load collection", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const loadItems = useCallback(
    async (offset: number, sort: "recent" | "ranked", append: boolean) => {
      if (append) setLoadingMore(true);
      try {
        const res = await fetch(
          `/api/collections/${params.id}/items?limit=${ITEMS_PAGE_SIZE}&offset=${offset}&sort=${sort}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const newItems = (data.items ?? []) as CollectionItemType[];
        if (append) {
          setItems((prev) => [...prev, ...newItems]);
        } else {
          setItems(newItems);
        }
        nextOffsetRef.current = offset + newItems.length;
        setHasMore(
          newItems.length >= ITEMS_PAGE_SIZE && data.hasMore !== false,
        );
      } catch {
        setHasMore(false);
      } finally {
        if (append) setLoadingMore(false);
      }
    },
    [params.id],
  );

  const loadMoreItems = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const offset = nextOffsetRef.current;
    const sort = activeTab === "ranked" ? "ranked" : "recent";
    await loadItems(offset, sort, true);
  }, [hasMore, loadingMore, activeTab, loadItems]);

  const loadSources = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingSources(true);
      try {
        const res = await fetch(
          `/api/collections/${params.id}/sources?page=${page}&limit=${ITEMS_PAGE_SIZE}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.items ?? []) as CollectionSource[];
        if (append) {
          setSources((prev) => [...prev, ...list]);
        } else {
          setSources(list);
        }
        setHasMoreSources(
          list.length >= ITEMS_PAGE_SIZE && data.hasMore !== false,
        );
        sourcesPageRef.current = page;
      } catch {
        setHasMoreSources(false);
      } finally {
        setLoadingSources(false);
      }
    },
    [params.id],
  );

  const loadContributors = useCallback(
    async (page: number, append: boolean) => {
      if (append) setLoadingContributors(true);
      try {
        const res = await fetch(
          `/api/collections/${params.id}/contributors?page=${page}&limit=${ITEMS_PAGE_SIZE}`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const list = (data.items ?? []) as CollectionContributor[];
        if (append) {
          setContributors((prev) => [...prev, ...list]);
        } else {
          setContributors(list);
        }
        setHasMoreContributors(
          list.length >= ITEMS_PAGE_SIZE && data.hasMore !== false,
        );
        contributorsPageRef.current = page;
      } catch {
        setHasMoreContributors(false);
      } finally {
        setLoadingContributors(false);
      }
    },
    [params.id],
  );

  useEffect(() => {
    if (activeTab === "ranked" && !tabLoaded.ranked) {
      setTabLoaded((p) => ({ ...p, ranked: true }));
      nextOffsetRef.current = 0;
      loadItems(0, "ranked", false);
    } else if (activeTab === "newest" && tabLoaded.ranked) {
      nextOffsetRef.current = 0;
      loadItems(0, "recent", false);
    } else if (activeTab === "sources" && !tabLoaded.sources) {
      setTabLoaded((p) => ({ ...p, sources: true }));
      loadSources(1, false);
    } else if (activeTab === "contributors" && !tabLoaded.contributors) {
      setTabLoaded((p) => ({ ...p, contributors: true }));
      loadContributors(1, false);
    }
  }, [activeTab, tabLoaded, loadItems, loadSources, loadContributors]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = loadMoreSentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (activeTab === "newest" || activeTab === "ranked") {
          loadMoreItems();
        } else if (
          activeTab === "sources" &&
          hasMoreSources &&
          !loadingSources
        ) {
          loadSources(sourcesPageRef.current + 1, true);
        } else if (
          activeTab === "contributors" &&
          hasMoreContributors &&
          !loadingContributors
        ) {
          loadContributors(contributorsPageRef.current + 1, true);
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [
    hasMore,
    loadingMore,
    loadMoreItems,
    activeTab,
    hasMoreSources,
    loadingSources,
    hasMoreContributors,
    loadingContributors,
    loadContributors,
    loadSources,
  ]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: CollectionSummary[]) => {
        if (!cancelled) {
          setOtherCollections(
            Array.isArray(list)
              ? list.filter((c) => c.id !== params.id).slice(0, 10)
              : [],
          );
        }
      })
      .catch(() => {
        /* collections load best-effort */
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleShareSavesToggle = async () => {
    try {
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareSaves: !shareSaves }),
      });
      if (res.ok) setShareSaves(!shareSaves);
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("Failed to update shareSaves", error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? This cannot be undone.",
      )
    )
      return;
    try {
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/collections");
    } catch (error) {
      if (process.env.NODE_ENV !== "production")
        console.error("Failed to delete collection", error);
    }
  };

  if (loading && !collection) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-ink flex flex-col items-center justify-center px-6">
        <p className="text-secondary text-sm mb-4">Collection not found</p>
        <Link
          href="/collections"
          className="text-primary hover:underline font-medium"
        >
          Back to collections
        </Link>
      </div>
    );
  }

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
            {collection.title}
          </h1>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-tertiary hover:text-paper hover:bg-white/5 rounded-full"
                title="Edit Collection"
                aria-label="Edit"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-full"
                title="Delete Collection"
                aria-label="Delete"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          )}
          {!isOwner && <div className="w-16" />}
        </div>
      </header>

      {/* Hero – title + description + actions, fades out on scroll */}
      <div
        className="border-b border-divider transition-opacity duration-150"
        style={{ opacity: heroOpacity }}
      >
        <div className="max-w-[680px] mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-paper mb-2">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="text-secondary text-sm mb-4">
              {collection.description}
            </p>
          )}
          {isOwner && (
            <div className="flex justify-end">
              <button
                onClick={handleShareSavesToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  shareSaves
                    ? "bg-primary text-white"
                    : "bg-white/5 text-secondary hover:bg-white/10"
                }`}
              >
                {shareSaves ? "Sharing saves" : "Share saves"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Full-page scrollable content */}
      <div className="max-w-[680px] mx-auto w-full">
        {/* Tabs – match mobile: Newest, Ranked, Sources, Contributors */}
        <div className="sticky top-0 z-40 bg-ink border-b border-divider">
          <div className="flex overflow-x-auto no-scrollbar">
            {(
              [
                ["newest", "Newest"],
                ["ranked", "Most cited"],
                ["sources", "Sources"],
                ["contributors", "Contributors"],
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
          {(activeTab === "sources" || activeTab === "contributors") && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                <svg
                  className="w-5 h-5 text-tertiary shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder={
                    activeTab === "sources"
                      ? "Search sources..."
                      : "Search contributors..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-paper placeholder-tertiary text-sm outline-none min-w-0"
                />
                {searchQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-tertiary hover:text-paper"
                    aria-label="Clear"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal scroll – more collections */}
        {otherCollections.length > 0 && (
          <section className="px-4 py-6 border-b border-divider">
            <h2 className="text-sm font-semibold text-tertiary uppercase tracking-wider mb-3">
              More collections
            </h2>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 -mx-4 px-4 no-scrollbar">
              {otherCollections.map((c) => (
                <Link
                  key={c.id}
                  href={`/collections/${c.id}`}
                  className="shrink-0 w-[200px] overflow-hidden rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group"
                >
                  {c.previewImageKey ? (
                    <div className="relative w-full aspect-video bg-divider">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(c.previewImageKey)}
                        alt=""
                        className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-divider flex items-center justify-center text-tertiary">
                      <svg
                        className="w-10 h-10"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="text-paper font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                    <p className="text-tertiary text-xs mt-0.5">
                      {c.itemCount} {c.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tab content */}
        <div className="px-6 py-6 space-y-4">
          {(activeTab === "newest" || activeTab === "ranked") && (
            <>
              {items.length > 0 ? (
                <>
                  {items.map((item) => (
                    <div key={item.id} className="border-b border-divider pb-4">
                      <PostItem post={item.post} />
                      {item.curatorNote && (
                        <div className="mt-3 pl-4 border-l-2 border-primary">
                          <p className="text-sm text-secondary italic">
                            {item.curatorNote}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={loadMoreSentinel} className="h-4" />
                  {loadingMore && (
                    <p className="text-secondary text-sm py-4 text-center">
                      Loading…
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary text-sm">
                    No items in this collection yet.
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "sources" &&
            (() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? sources.filter(
                    (s) =>
                      (s.title ?? "").toLowerCase().includes(q) ||
                      (s.url ?? "").toLowerCase().includes(q),
                  )
                : sources;
              return filtered.length > 0 ? (
                <>
                  {filtered.map((s, i) => (
                    <a
                      key={s.url ?? s.id ?? i}
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
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary text-sm">
                    {sources.length === 0
                      ? "No sources in this collection yet."
                      : "No matching sources."}
                  </p>
                </div>
              );
            })()}

          {activeTab === "contributors" &&
            (() => {
              const q = searchQuery.trim().toLowerCase();
              const filtered = q
                ? contributors.filter(
                    (c) =>
                      (c.displayName ?? "").toLowerCase().includes(q) ||
                      (c.handle ?? "").toLowerCase().includes(q),
                  )
                : contributors;
              return filtered.length > 0 ? (
                <>
                  <div className="space-y-2">
                    {filtered.map((person) => (
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
                  </div>
                  <div ref={loadMoreSentinel} className="h-4" />
                  {loadingContributors && (
                    <p className="text-secondary text-sm py-4 text-center">
                      Loading…
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-secondary text-sm">
                    {contributors.length === 0
                      ? "No contributors yet."
                      : "No matching contributors."}
                  </p>
                </div>
              );
            })()}
        </div>
      </div>

      {isOwner && (
        <EditCollectionModal
          collection={{ ...collection, items } as Collection}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadCollection}
        />
      )}
    </div>
  );
}
