"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CreateCollectionModal } from "@/components/create-collection-modal";
import { getImageUrl } from "@/lib/security";
import { EmptyState } from "@/components/ui/empty-state";

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  itemCount: number;
  previewImageKey?: string | null;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (error) {
      console.error("Failed to load collections", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-secondary hover:text-paper">
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
          <h1 className="text-xl font-bold text-paper">Collections</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-primary text-sm font-medium hover:text-primary/80 transition-colors"
          >
            Create
          </button>
        </div>
      </header>

      {/* Collections List */}
      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon="folder_open"
            headline="No collections yet"
            actionLabel="Create collection"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block overflow-hidden bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors group"
            >
              {collection.previewImageKey ? (
                <div className="relative w-full aspect-video bg-divider">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(collection.previewImageKey)}
                    alt=""
                    className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video bg-divider flex items-center justify-center text-tertiary">
                  <svg
                    className="w-12 h-12"
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
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-paper font-semibold mb-1 group-hover:text-primary transition-colors truncate">
                      {collection.title}
                    </h3>
                    {collection.description && (
                      <p className="text-secondary text-sm line-clamp-1">
                        {collection.description}
                      </p>
                    )}
                  </div>
                  <div className="bg-white/5 p-1.5 rounded-full text-tertiary shrink-0 ml-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-tertiary text-xs font-medium uppercase tracking-wider">
                  {collection.itemCount}{" "}
                  {collection.itemCount === 1 ? "item" : "items"}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <CreateCollectionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadCollections}
      />
    </>
  );
}
