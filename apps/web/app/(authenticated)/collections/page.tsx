"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CreateCollectionModal } from "@/components/create-collection-modal";
import { getImageUrl } from "@/lib/security";
import {
  EmptyState,
  emptyStateCenterClassName,
} from "@/components/ui/empty-state";

interface Collection {
  id: string;
  title: string;
  description?: string;
  isPublic?: boolean;
  itemCount: number;
  previewImageKey?: string | null;
  recentPost?: {
    id?: string;
    title?: string | null;
    bodyExcerpt?: string | null;
    headerImageKey?: string | null;
  } | null;
}

type FilterKey = "all" | "public" | "private";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filteredCollections = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collections.filter((c) => {
      if (filter === "public" && !c.isPublic) return false;
      if (filter === "private" && c.isPublic) return false;
      if (!q) return true;
      const title = (c.title ?? "").toLowerCase();
      const desc = (c.description ?? "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }, [collections, search, filter]);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const res = await fetch("/api/collections");
      if (res.ok) {
        const data = await res.json();
        setCollections(Array.isArray(data) ? data : (data?.items ?? []));
      } else {
        setLoadError(true);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") console.error("Failed to load collections", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-ink">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          <Link href="/home" className="text-secondary hover:text-paper">
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

      {/* Search + filter — match mobile */}
      <div className="px-4 md:px-6 py-3 border-b border-divider space-y-3">
        <div className="flex items-center gap-2 border-b border-divider px-3 py-2">
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
            placeholder="Search collections..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-paper placeholder-tertiary text-sm outline-none min-w-0"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="p-1 text-tertiary hover:text-paper"
              aria-label="Clear search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {(["all", "public", "private"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${filter === key
                  ? "bg-primary text-ink"
                  : "bg-white/5 text-tertiary hover:bg-white/10 hover:text-paper border border-white/10"
                }`}
            >
              {key === "all" ? "All" : key}
            </button>
          ))}
        </div>
      </div>

      {/* Collections List */}
      <div className="px-6 py-6 space-y-4 flex-1 flex flex-col min-h-[200px]">
        {loading && !loadError ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : loadError ? (
          <div className={emptyStateCenterClassName}>
            <p className="text-secondary text-sm mb-4">
              Failed to load collections. Please try again.
            </p>
            <button
              type="button"
              onClick={() => loadCollections()}
              className="text-primary hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className={emptyStateCenterClassName}>
            <EmptyState
              icon="folder_open"
              headline={collections.length === 0 ? "No collections yet" : "No matching collections"}
              subtext={collections.length === 0 ? "Create a collection to organize your saved posts." : undefined}
              actionLabel="Create collection"
              onAction={() => setShowCreateModal(true)}
            />
          </div>
        ) : (
          filteredCollections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block overflow-hidden border-b border-divider hover:bg-white/10 transition-colors group"
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
                    {(collection.recentPost?.title ??
                      collection.recentPost?.bodyExcerpt ??
                      collection.description) && (
                        <p className="text-secondary text-sm line-clamp-1">
                          {collection.recentPost?.title?.trim() ||
                            collection.recentPost?.bodyExcerpt?.trim() ||
                            collection.description}
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
    </div>
  );
}
