import { useState, useRef, useCallback } from 'react';
import { api } from '../utils/api';

export type SearchResult = {
  id: string;
  type: 'topic' | 'post' | 'mention';
  displayName?: string;
  title?: string;
  slug?: string;
  handle?: string;
  authorHandle?: string;
  authorDisplayName?: string;
  /** Mention: avatar storage key / URL for profile image */
  avatarKey?: string;
  avatarUrl?: string;
  /** Post: header image key / URL */
  headerImageKey?: string;
  headerImageUrl?: string;
  /** Post: ISO date string from search index */
  createdAt?: string;
  /** Post: number of quotes */
  quoteCount?: number;
  /** Post: number of replies */
  replyCount?: number;
};

export function useComposerSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRequestId = useRef(0);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string, type: 'topic' | 'mention') => {
    const requestId = ++searchRequestId.current;

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeout.current = setTimeout(async () => {
      if (searchRequestId.current !== requestId) {
        return;
      }

      try {
        let newResults: SearchResult[] = [];
        const encodedQ = encodeURIComponent(query);

        if (type === 'topic') {
          const [topicRes, postRes] = await Promise.all([
            api.get(`/search/topics?q=${encodedQ}`),
            api.get(`/search/posts?q=${encodedQ}`)
          ]);

          if (searchRequestId.current !== requestId) {
            return;
          }

          const topicHits = Array.isArray(topicRes?.hits) ? topicRes.hits : [];
          const postHits = Array.isArray(postRes?.hits) ? postRes.hits : [];
          const topics = topicHits.map((t: any) => ({ ...t, type: 'topic', id: t.id || t.slug }));
          const posts = postHits.map((p: any) => ({
            ...p,
            type: 'post',
            id: p.id,
            displayName: p.title || 'Untitled Post',
            authorHandle: p.author?.handle,
            authorDisplayName: p.author?.displayName,
            headerImageKey: p.headerImageKey,
            headerImageUrl: p.headerImageUrl,
            createdAt: p.createdAt,
            quoteCount: p.quoteCount ?? 0,
            replyCount: p.replyCount ?? 0,
          }));
          const seen = new Set<string>();
          const dedupedTopics = topics.filter((x: any) => {
            const key = `topic:${x.id ?? x.slug}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const dedupedPosts = posts.filter((x: any) => {
            const key = `post:${x.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          newResults = [...dedupedTopics, ...dedupedPosts];
        } else if (type === 'mention') {
          const res = await api.get(`/search/users?q=${encodedQ}`);

          if (searchRequestId.current !== requestId) return;

          const userHits = Array.isArray(res?.hits) ? res.hits : [];
          newResults = userHits.map((u: any) => ({
            ...u,
            type: 'mention',
            id: u.id,
            avatarKey: u.avatarKey,
            avatarUrl: u.avatarUrl,
          }));
        }

        setResults(newResults);
      } catch (error) {
        setResults([]);
      } finally {
        if (searchRequestId.current === requestId) {
          setIsSearching(false);
        }
      }
    }, 150); // 150ms debounce
  }, []);

  const clearSearch = useCallback(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    setResults([]);
    setIsSearching(false);
  }, []);

  return {
    results,
    isSearching,
    search,
    clearSearch
  };
}