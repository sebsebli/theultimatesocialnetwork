"use client";

import { useState, useEffect } from "react";

interface Source {
  id: string;
  url: string;
  title?: string;
  canonicalUrl?: string;
}

interface SourcesSectionProps {
  postId: string;
}

export function SourcesSection({ postId }: SourcesSectionProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSources();
  }, [postId]);

  const loadSources = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/sources`);
      if (res.ok) {
        const data = await res.json();
        setSources(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
        <p className="text-secondary text-sm">Loading...</p>
      </section>
    );
  }

  if (sources.length === 0) {
    return (
      <section className="border-t border-divider pt-6">
        <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
        <p className="text-secondary text-sm">No external sources found.</p>
      </section>
    );
  }

  return (
    <section className="border-t border-divider pt-8 mt-4">
      <h2 className="text-xl font-bold mb-6 text-paper border-b border-divider pb-2 tracking-tight">
        Sources
      </h2>
      <ol className="space-y-4">
        {sources.map((source, index) => (
          <li key={source.id} className="flex items-start gap-4 group">
            <span className="text-tertiary text-sm font-mono mt-1 w-4 shrink-0">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primaryDark transition-colors font-bold text-base block truncate"
              >
                {source.title || new URL(source.url).hostname}
                <svg
                  className="inline-block w-3 h-3 ml-2 opacity-0 group-hover:opacity-50 transition-opacity"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
              <div className="text-tertiary text-xs mt-0.5 font-medium opacity-60 truncate">
                {new URL(source.url).hostname.replace("www.", "")} •{" "}
                {source.canonicalUrl || source.url}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
