/**
 * Optimized Data Hook
 * Memoization ve cache ile veri optimizasyonu
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cachedQuery } from '../services/cacheService';
import { useDebounce } from './useDebounce';

interface UseOptimizedDataOptions {
  cacheKey?: string;
  ttl?: number;
  debounceMs?: number;
  dependencies?: any[];
  enabled?: boolean;
}

/**
 * Optimize edilmiş veri çekme hook'u
 */
export function useOptimizedData<T>(
  fetchFn: () => Promise<T>,
  options: UseOptimizedDataOptions = {}
) {
  const {
    cacheKey,
    ttl = 5 * 60 * 1000, // 5 dakika default
    debounceMs = 300,
    dependencies = [],
    enabled = true
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounced dependencies
  const debouncedDeps = useDebounce(dependencies, debounceMs);

  // Memoized fetch function
  const memoizedFetch = useCallback(async () => {
    if (!enabled) return;

    // Önceki request'i iptal et
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Yeni AbortController
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let result: T;

      if (cacheKey) {
        // Cache kullan
        result = await cachedQuery(cacheKey, fetchFn, { ttl });
      } else {
        // Direkt fetch
        result = await fetchFn();
      }

      // Request iptal edilmediyse state'i güncelle
      if (!abortControllerRef.current.signal.aborted) {
        setData(result);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error('Data fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [cacheKey, ttl, enabled, ...debouncedDeps]);

  // Effect ile veri çek
  useEffect(() => {
    memoizedFetch();

    // Cleanup
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [memoizedFetch]);

  // Refetch function
  const refetch = useCallback(() => {
    return memoizedFetch();
  }, [memoizedFetch]);

  // Memoized return value
  return useMemo(
    () => ({
      data,
      loading,
      error,
      refetch
    }),
    [data, loading, error, refetch]
  );
}

/**
 * Pagination hook with optimization
 */
export function useOptimizedPagination<T>(
  fetchFn: (page: number, limit: number) => Promise<T[]>,
  limit: number = 20
) {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<T[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const cacheKey = `pagination:${page}:${limit}`;
      const newData = await cachedQuery(
        cacheKey,
        () => fetchFn(page, limit),
        { ttl: 10 * 60 * 1000 } // 10 dakika cache
      );

      if (newData.length < limit) {
        setHasMore(false);
      }

      setAllData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, hasMore, loading]);

  const reset = useCallback(() => {
    setPage(1);
    setAllData([]);
    setHasMore(true);
  }, []);

  return {
    data: allData,
    loading,
    hasMore,
    loadMore,
    reset
  };
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number;
    enabled?: boolean;
  } = {}
) {
  const { threshold = 100, enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        rootMargin: `${threshold}px`
      }
    );

    if (targetRef.current) {
      observer.observe(targetRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [callback, threshold, enabled]);

  return targetRef;
}

/**
 * Virtual list hook for large datasets
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex + 1)
    };
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems: visibleRange.visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
}
