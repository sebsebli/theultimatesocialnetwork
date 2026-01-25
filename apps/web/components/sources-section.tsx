'use client';

import { useState, useEffect } from 'react';

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
    } catch (error) {
      console.error('Failed to load sources', error);
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
    <section className="border-t border-divider pt-6">
      <h2 className="text-lg font-semibold mb-4 text-paper">Sources</h2>
      <ol className="space-y-3">
        {sources.map((source, index) => (
          <li key={source.id} className="flex gap-3">
            <span className="text-tertiary text-sm font-medium">{index + 1}.</span>
            <div className="flex-1">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium text-sm"
              >
                {source.title || new URL(source.url).hostname}
              </a>
              <div className="text-tertiary text-xs mt-1 break-all">
                {source.canonicalUrl || source.url}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
