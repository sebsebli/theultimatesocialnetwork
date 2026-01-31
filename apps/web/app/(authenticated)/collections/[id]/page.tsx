"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PostItem, Post } from "@/components/post-item";
import { EditCollectionModal } from "@/components/edit-collection-modal";

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  ownerId?: string;
  items?: Array<{
    id: string;
    post: Post;
    curatorNote?: string;
  }>;
  shareSaves?: boolean;
}

export default function CollectionDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const params = use(props.params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [shareSaves, setShareSaves] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((me) => setCurrentUserId(me?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  const isOwner =
    !!collection?.ownerId &&
    !!currentUserId &&
    collection.ownerId === currentUserId;

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
      if (res.ok) {
        router.push("/collections");
      }
    } catch (error) {
      console.error("Failed to delete collection", error);
    }
  };

  if (loading && !collection) {
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/collections"
              className="text-secondary hover:text-paper"
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
            </Link>
            <h1 className="text-xl font-bold text-paper truncate max-w-[200px] sm:max-w-md">
              {collection.title}
            </h1>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-tertiary hover:text-paper hover:bg-white/5 rounded-full transition-colors"
                title="Edit Collection"
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
                className="p-2 text-tertiary hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors"
                title="Delete Collection"
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
          {isOwner && (
            <div className="flex items-center justify-end">
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

      {isOwner && (
        <EditCollectionModal
          collection={collection}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={loadCollection}
        />
      )}
    </div>
  );
}
