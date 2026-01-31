"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateCollectionModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCollectionModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
          isPublic,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        onCreated();
        onClose();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-[#1e1f21] rounded-2xl border border-white/10 shadow-2xl p-6 m-4 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-paper mb-4">New Collection</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Urbanism"
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-paper placeholder-secondary focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-1.5">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this collection about?"
              rows={3}
              className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2.5 text-paper placeholder-secondary focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-paper">Visibility</p>
              <p className="text-xs text-tertiary mt-0.5">
                {isPublic
                  ? "Public — anyone can see this collection"
                  : "Private — only your followers can see it"}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((p) => !p)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isPublic ? "bg-primary" : "bg-white/20"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${
                  isPublic ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-secondary hover:text-paper transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
          >
            {loading ? "Creating..." : "Create Collection"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
