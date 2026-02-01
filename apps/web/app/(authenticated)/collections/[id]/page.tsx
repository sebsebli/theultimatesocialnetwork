"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostItem, Post } from "@/components/post-item";
import { EditCollectionModal } from "@/components/edit-collection-modal";
import { getImageUrl } from "@/lib/security";

const HERO_FADE_HEIGHT = 200;
const STICKY_HEADER_APPEAR = 100;
const ITEMS_PAGE_SIZE = 20;

interface CollectionItemType {
  id: string;
  post: Post;
  curatorNote?: string;
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
  const [items, setItems] = useState<CollectionItemType[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [shareSaves, setShareSaves] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [otherCollections, setOtherCollections] = useState<CollectionSummary[]>([]);
  const loadMoreSentinel = useRef<HTMLDivElement>(null);
  const nextOffsetRef = useRef(0);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setCurrentUserId(me?.id ?? null))
      .catch(() => setCurrentUserId(null));
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
    Math.max(0, (scrollY - STICKY_HEADER_APPEAR) / 80)
  );

  const isOwner =
    !!collection?.ownerId &&
    !!currentUserId &&
    collection.ownerId === currentUserId;

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/collections/${params.id}?limit=${ITEMS_PAGE_SIZE}&offset=0`
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
      console.error("Failed to load collection", error);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const loadMoreItems = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const offset = nextOffsetRef.current;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/collections/${params.id}/items?limit=${ITEMS_PAGE_SIZE}&offset=${offset}`
      );
      if (!res.ok) return;
      const data = await res.json();
      const newItems = data.items ?? [];
      nextOffsetRef.current = offset + newItems.length;
      setItems((prev) => [...prev, ...newItems]);
      setHasMore(data.hasMore === true);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [params.id, hasMore, loadingMore]);

  useEffect(() => {
    if (!hasMore || loadingMore) return;
    const el = loadMoreSentinel.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreItems();
      },
      { rootMargin: "200px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, loadMoreItems]);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: CollectionSummary[]) => {
        setOtherCollections(
          Array.isArray(list)
            ? list.filter((c) => c.id !== params.id).slice(0, 10)
            : []
        );
      })
      .catch(() => {});
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
      console.error("Failed to update shareSaves", error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this collection? This cannot be undone."
      )
    )
      return;
    try {
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/collections");
    } catch (error) {
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
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <p className="text-secondary text-sm">Collection not found</p>
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-full"
                title="Delete Collection"
                aria-label="Delete"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                      <img
                        src={getImageUrl(c.previewImageKey)}
                        alt=""
                        className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-video bg-divider flex items-center justify-center text-tertiary">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
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

        {/* Items – lazy loaded */}
        <div className="px-6 py-6 space-y-4">
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
