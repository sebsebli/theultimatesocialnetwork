"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface Collection {
  id: string;
  title: string;
  itemCount: number;
  hasPost?: boolean;
}

interface AddToCollectionModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToCollectionModal({
  postId,
  isOpen,
  onClose,
}: AddToCollectionModalProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/collections?postId=${postId}`);
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen, loadCollections]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;

    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          isPublic: true,
        }),
      });

      if (res.ok) {
        const newCollection = await res.json();
        setCollections([newCollection, ...collections]);
        setCreating(false);
        setNewTitle("");
        // Automatically add to the new collection
        handleToggle(newCollection.id, false);
      }
    } catch {
      // ignore
    }
  };

  const handleToggle = async (
    collectionId: string,
    currentHasPost: boolean,
  ) => {
    // Optimistic update
    setCollections((cols) =>
      cols.map((c) =>
        c.id === collectionId ? { ...c, hasPost: !currentHasPost } : c,
      ),
    );

    try {
      const method = currentHasPost ? "DELETE" : "POST";
      const res = await fetch(`/api/collections/${collectionId}/items`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Failed to update");
    } catch {
      // Revert
      setCollections((cols) =>
        cols.map((c) =>
          c.id === collectionId ? { ...c, hasPost: currentHasPost } : c,
        ),
      );
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sheet/Modal */}
      <div className="relative w-full max-w-md bg-[#1e1f21] rounded-t-2xl sm:rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h2 className="text-lg font-bold text-paper">Add to Collection</h2>
          <button
            onClick={onClose}
            className="p-1 text-secondary hover:text-paper rounded-full hover:bg-white/5 transition-colors"
            aria-label="Close modal"
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
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="py-8 text-center text-secondary">Loading...</div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() =>
                    handleToggle(collection.id, !!collection.hasPost)
                  }
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                >
                  <div className="flex flex-col">
                    <span className="text-paper font-medium group-hover:text-white transition-colors">
                      {collection.title}
                    </span>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      collection.hasPost
                        ? "bg-primary border-primary text-white"
                        : "border-secondary/30 group-hover:border-primary/50"
                    }`}
                  >
                    {collection.hasPost && (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}

              {collections.length === 0 && !creating && (
                <div className="text-center py-6 text-secondary text-sm">
                  No collections found.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Create New */}
        <div className="p-4 border-t border-white/10 shrink-0 bg-[#1e1f21]">
          {creating ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Collection title (e.g. 'Urbanism')"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-paper placeholder-secondary focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setCreating(false)}
                  className="px-3 py-1.5 text-sm text-secondary hover:text-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim()}
                  className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full py-2.5 flex items-center justify-center gap-2 text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors font-medium"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Collection
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
