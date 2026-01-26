'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface AutocompleteItem {
  id: string;
  type: 'topic' | 'post' | 'user';
  title: string;
  subtitle?: string;
  slug?: string;
}

interface AutocompleteDropdownProps {
  query: string;
  type: 'topic' | 'post' | 'user' | 'all';
  onSelect: (item: AutocompleteItem) => void;
  position: { top: number; left: number };
  onClose: () => void;
}

export function AutocompleteDropdown({
  query,
  type,
  onSelect,
  position,
  onClose,
}: AutocompleteDropdownProps) {
  const [items, setItems] = useState<AutocompleteItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) {
      setItems([]);
      return;
    }

    const timer = setTimeout(() => {
      loadSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      if (type === 'user' || type === 'all') {
        // Search users
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const userItems: AutocompleteItem[] = (data.hits || []).map((u: any) => ({
            id: u.id,
            type: 'user' as const,
            title: u.displayName || u.handle,
            subtitle: `@${u.handle}`,
          }));
          setItems(prev => [...prev, ...userItems]);
        }
      }

      if (type === 'topic' || type === 'all') {
        // Search topics
        const res = await fetch(`/api/search/topics?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const topicItems: AutocompleteItem[] = (data.hits || []).map((t: any) => ({
            id: t.id,
            type: 'topic' as const,
            title: t.title,
            slug: t.slug,
          }));
          setItems(prev => [...prev, ...topicItems]);
        }
      }

      if (type === 'post' || type === 'all') {
        // Search posts
        const res = await fetch(`/api/search/posts?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const postItems: AutocompleteItem[] = (data.hits || []).map((p: any) => ({
            id: p.id,
            type: 'post' as const,
            title: p.title || p.body.substring(0, 50),
            subtitle: p.author?.displayName,
          }));
          setItems(prev => [...prev, ...postItems]);
        }
      }
    } catch (error) {
      console.error('Failed to load suggestions', error);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && !loading) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 w-80 max-h-96 overflow-y-auto bg-ink border border-divider rounded-lg shadow-lg"
      style={{ top: position.top, left: position.left }}
    >
      {loading ? (
        <div className="p-4 text-center text-secondary text-sm">Loading...</div>
      ) : (
        <div className="py-2">
          {items.map((item) => (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => {
                onSelect(item);
                onClose();
              }}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                  {item.type === 'user' && '@'}
                  {item.type === 'topic' && '#'}
                  {item.type === 'post' && '📄'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-paper truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-xs text-tertiary truncate">{item.subtitle}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
