"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { PostItem, Post } from "@/components/post-item";

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic: boolean;
  items?: Array<{
    id: string;
    post: Post;
    curatorNote?: string;
  }>;
}

export default function CollectionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = use(props.params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [shareSaves, setShareSaves] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadCollection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setCollection(data);
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

  const handleShareSavesToggle = async () => {
    try {
      const res = await fetch(`/api/collections/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shareSaves: !shareSaves }),
      });
      if (res.ok) {
        setShareSaves(!shareSaves);
      }
    } catch (error) {
      console.error("Failed to update shareSaves", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink flex items-center justify-center">
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink flex items-center justify-center">
        <p className="text-secondary text-sm">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px] mx-auto min-h-screen border-x border-divider bg-ink">
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/collections" className="text-secondary hover:text-paper">
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
          </Link>
          <h1 className="text-xl font-bold text-paper">{collection.title}</h1>
        </div>
      </header>

      <div className="px-6 py-6 space-y-6">
        {/* Collection Info */}
        <div>
          {collection.description && (
            <p className="text-secondary text-sm mb-4">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  collection.isPublic
                    ? "bg-primary/20 text-primary"
                    : "bg-white/10 text-tertiary"
                }`}
              >
                {collection.isPublic ? "Public" : "Private"}
              </span>
            </div>
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
        </div>

        {/* Items */}
        <div className="space-y-4">
          {collection.items && collection.items.length > 0 ? (
            collection.items.map((item) => (
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
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-secondary text-sm">
                No items in this collection yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
