"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";

interface Keep {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title?: string;
    body: string;
    author: {
      handle: string;
      displayName: string;
    };
  };
}

interface Collection {
  id: string;
  title: string;
}

export default function KeepsPage() {
  const [keeps, setKeeps] = useState<Keep[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unsorted" | "in-collections">(
    "all",
  );

  // Modal state
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  const loadKeeps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filter === "in-collections") params.append("inCollection", "true");
      if (filter === "unsorted") params.append("inCollection", "false");

      const res = await fetch(`/api/keeps?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setKeeps(data);
      }
    } catch (error) {
      console.error("Failed to load keeps", error);
    } finally {
      setLoading(false);
    }
  }, [search, filter]);

  useEffect(() => {
    loadKeeps();
  }, [loadKeeps]);

  useEffect(() => {
    if (showCollectionModal) {
      loadCollections();
    }
  }, [showCollectionModal]);

  const loadCollections = async () => {
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Failed to load collections", error);
    }
  };

  const addToCollection = async (collectionId: string) => {
    if (!selectedPostId) return;
    try {
      await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: selectedPostId }),
      });
      setShowCollectionModal(false);
      setSelectedPostId(null);
    } catch (error) {
      console.error("Failed to add to collection", error);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (days < 1) return "Today";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-6 py-4">
        <h1 className="text-xl font-bold text-paper">Keeps Library</h1>
      </header>

      {/* Search and Filters */}
      <div className="px-6 py-4 space-y-4 border-b border-divider">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keeps..."
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-paper placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("unsorted")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "unsorted"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
            }`}
          >
            Unsorted
          </button>
          <button
            onClick={() => setFilter("in-collections")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === "in-collections"
                ? "bg-primary text-white"
                : "bg-white/5 text-secondary hover:bg-white/10"
            }`}
          >
            In Collections
          </button>
        </div>
      </div>

      {/* Keeps List */}
      <div className="px-6 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : keeps.length === 0 ? (
          <EmptyState
            icon="bookmark"
            headline="No keeps yet"
            subtext="Keep interesting posts to build your personal library."
          >
            <div className="mt-6">
              <button
                onClick={() => (window.location.href = "/explore")}
                className="text-primary hover:underline"
              >
                Explore posts
              </button>
            </div>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {keeps.map((keep) => (
              <div
                key={keep.id}
                className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors relative group"
              >
                <Link href={`/post/${keep.post.id}`} className="block">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-xs shrink-0">
                      {keep.post.author.displayName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-paper">
                        {keep.post.author.displayName}
                      </div>
                      <div className="text-xs text-tertiary">
                        @{keep.post.author.handle} •{" "}
                        {formatTime(keep.createdAt)}
                      </div>
                    </div>
                  </div>
                  {keep.post.title && (
                    <h3 className="text-base font-bold text-paper mb-1">
                      {keep.post.title}
                    </h3>
                  )}
                  <p className="text-sm text-secondary line-clamp-2">
                    {keep.post.body}
                  </p>
                </Link>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPostId(keep.post.id);
                      setShowCollectionModal(true);
                    }}
                    className="text-primary text-xs font-medium hover:underline bg-ink/80 px-2 py-1 rounded"
                  >
                    Add to collection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collection Modal */}
      {showCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-ink border border-white/10 rounded-xl w-full max-w-sm overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-bold text-paper">
                Add to Collection
              </h3>
              <button
                onClick={() => setShowCollectionModal(false)}
                className="text-secondary hover:text-paper"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {collections.length === 0 ? (
                <div className="p-4 text-center text-secondary text-sm">
                  No collections found.
                </div>
              ) : (
                collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => addToCollection(col.id)}
                    className="w-full text-left p-3 hover:bg-white/5 rounded-lg text-paper flex justify-between items-center"
                  >
                    <span>{col.title}</span>
                    <span className="text-primary text-lg">+</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
