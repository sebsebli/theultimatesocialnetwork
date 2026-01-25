import { useState, useCallback } from 'react';

interface UseLazyLoadOptions {
  pageSize?: number;
  initialPage?: number;
}

export function useLazyLoad<T>(options: UseLazyLoadOptions = {}) {
  const { pageSize = 20, initialPage = 1 } = options;
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    setPage(prev => prev + 1);
  }, [hasMore, loading]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    setLoading(false);
  }, [initialPage]);

  const setHasMoreData = useCallback((hasMoreData: boolean) => {
    setHasMore(hasMoreData);
  }, []);

  const setLoadingState = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  return {
    page,
    pageSize,
    hasMore,
    loading,
    loadMore,
    reset,
    setHasMoreData,
    setLoadingState,
  };
}
