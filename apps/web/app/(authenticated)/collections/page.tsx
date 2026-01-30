"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
  description?: string;
  itemCount: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

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
      <header className="sticky top-0 z-10 bg-ink/80 backdrop-blur-md border-b border-divider px-4 py-3">
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
          <button className="text-primary text-sm font-medium">Create</button>
        </div>
      </header>

      {/* Collections List */}
      <div className="px-6 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm">Loading...</p>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary text-sm mb-4">No collections yet.</p>
            <button className="px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
              Create collection
            </button>
          </div>
        ) : (
          collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="block p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-paper font-semibold mb-1">
                    {collection.title}
                  </h3>
                  {collection.description && (
                    <p className="text-secondary text-sm">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-tertiary text-xs mt-2">
                {collection.itemCount}{" "}
                {collection.itemCount === 1 ? "item" : "items"}
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
