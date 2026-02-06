import { useState, useRef, useCallback, useEffect } from 'react';
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

export type SuggestionType = 'none' | 'topic' | 'mention';

export function useComposerSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [type, setType] = useState<SuggestionType>('none');
  const searchRequestId = useRef(0);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((q: string, searchType: 'topic' | 'mention', includePosts = true) => {
    const requestId = ++searchRequestId.current;

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    setQuery(q);
    setType(searchType);

    if (!q.trim()) {
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
        const encodedQ = encodeURIComponent(q);

        if (searchType === 'topic') {
          const promises = [api.get(`/search/topics?q=${encodedQ}`)];
          if (includePosts) {
            promises.push(api.get(`/search/posts?q=${encodedQ}`));
          }
          
          const results = await Promise.all(promises);
          const topicRes = results[0];
          const postRes = includePosts ? results[1] : { hits: [] };

          if (searchRequestId.current !== requestId) {
            return;
          }

          const tr = topicRes as Record<string, unknown> | null;
          const pr = postRes as Record<string, unknown> | null;
          const topicHits = Array.isArray(tr?.hits) ? (tr.hits as Record<string, unknown>[]) : [];
          const postHits = Array.isArray(pr?.hits) ? (pr.hits as Record<string, unknown>[]) : [];
          const topics: SearchResult[] = topicHits.map((t: Record<string, unknown>) => ({ ...t, type: 'topic' as const, id: String(t.id || t.slug) }));
          const posts: SearchResult[] = postHits.map((p: Record<string, unknown>) => {
            const author = p.author as Record<string, unknown> | undefined;
            return {
              ...p,
              type: 'post' as const,
              id: String(p.id),
              displayName: String(p.title || 'Untitled Post'),
              authorHandle: author?.handle as string | undefined,
              authorDisplayName: author?.displayName as string | undefined,
              headerImageKey: p.headerImageKey as string | undefined,
              headerImageUrl: p.headerImageUrl as string | undefined,
              createdAt: p.createdAt as string | undefined,
              quoteCount: (p.quoteCount as number) ?? 0,
              replyCount: (p.replyCount as number) ?? 0,
            };
          });
          const seen = new Set<string>();
          const dedupedTopics = topics.filter((x) => {
            const key = `topic:${x.id ?? x.slug}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          const dedupedPosts = posts.filter((x) => {
            const key = `post:${x.id}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          newResults = [...dedupedTopics, ...dedupedPosts];
        } else if (searchType === 'mention') {
          const res = await api.get(`/search/users?q=${encodedQ}`);

          if (searchRequestId.current !== requestId) return;

          const ur = res as Record<string, unknown> | null;
          const userHits = Array.isArray(ur?.hits) ? (ur.hits as Record<string, unknown>[]) : [];
          newResults = userHits.map((u: Record<string, unknown>) => ({
            ...u,
            type: 'mention' as const,
            id: String(u.id),
            avatarKey: u.avatarKey as string | undefined,
            avatarUrl: u.avatarUrl as string | undefined,
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
    searchTimeout.current = null;
    setResults([]);
    setIsSearching(false);
    setType('none');
    setQuery('');
  }, []);

  // Cleanup pending timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  return {
    results,
    isSearching,
    search,
    clearSearch,
    clear: clearSearch,
    query,
    type,
    setQuery,
    setType,
    setSuggestionType: setType,
    suggestionType: type,
  };
}