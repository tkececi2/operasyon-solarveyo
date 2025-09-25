/**
 * Pagination Hook
 * Firestore için optimize edilmiş sayfalama
 */

import { useState, useCallback, useRef } from 'react';
import { 
  DocumentSnapshot, 
  QueryDocumentSnapshot,
  QueryConstraint,
  getDocs,
  query,
  limit,
  startAfter,
  Query
} from 'firebase/firestore';
import { logger } from '../utils/logger';

export interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export interface PaginationResult<T> {
  data: T[];
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isLoading: boolean;
  error: Error | null;
  totalLoaded: number;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>; // Infinite scroll için
}

/**
 * Firestore pagination hook
 */
export function usePagination<T>(
  queryBuilder: (...constraints: QueryConstraint[]) => Query,
  options: PaginationOptions = {}
): PaginationResult<T> {
  const { pageSize = 20, initialPage = 1 } = options;
  
  // State
  const [data, setData] = useState<T[]>([]);
  const [allData, setAllData] = useState<T[]>([]); // Tüm yüklenen data
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  
  // Refs
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const pageDocsRef = useRef<Map<number, DocumentSnapshot>>(new Map());
  const firstDocRef = useRef<DocumentSnapshot | null>(null);
  
  // Load page
  const loadPage = useCallback(async (pageNum: number, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      let constraints: QueryConstraint[] = [limit(pageSize + 1)]; // +1 for hasNext check
      
      // Pagination cursor
      if (pageNum > 1 && lastDocRef.current) {
        constraints.push(startAfter(lastDocRef.current));
      }
      
      // Execute query
      const q = queryBuilder(...constraints);
      const snapshot = await getDocs(q);
      
      // Process results
      const docs = snapshot.docs.slice(0, pageSize); // Remove extra doc
      const items = docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      
      // Update state
      if (append) {
        setAllData(prev => [...prev, ...items]);
      } else {
        setData(items);
      }
      
      // Update pagination state
      if (docs.length > 0) {
        lastDocRef.current = docs[docs.length - 1];
        if (pageNum === 1) {
          firstDocRef.current = docs[0];
        }
        pageDocsRef.current.set(pageNum, docs[0]);
      }
      
      setHasNextPage(snapshot.docs.length > pageSize);
      setCurrentPage(pageNum);
      
      logger.info(`Sayfa ${pageNum} yüklendi: ${items.length} kayıt`);
      
    } catch (err) {
      logger.error('Pagination hatası:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [queryBuilder, pageSize]);
  
  // Navigation methods
  const nextPage = useCallback(async () => {
    if (!hasNextPage || isLoading) return;
    await loadPage(currentPage + 1);
  }, [currentPage, hasNextPage, isLoading, loadPage]);
  
  const prevPage = useCallback(async () => {
    if (currentPage <= 1 || isLoading) return;
    
    // Önceki sayfanın başlangıç doc'unu bul
    const prevPageDoc = pageDocsRef.current.get(currentPage - 1);
    if (prevPageDoc) {
      lastDocRef.current = prevPageDoc;
    }
    
    await loadPage(currentPage - 1);
  }, [currentPage, isLoading, loadPage]);
  
  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || isLoading) return;
    
    // Reset ve baştan yükle
    if (page === 1) {
      lastDocRef.current = null;
      pageDocsRef.current.clear();
    }
    
    await loadPage(page);
  }, [isLoading, loadPage]);
  
  const refresh = useCallback(async () => {
    lastDocRef.current = null;
    pageDocsRef.current.clear();
    await loadPage(1);
  }, [loadPage]);
  
  // Infinite scroll için
  const loadMore = useCallback(async () => {
    if (!hasNextPage || isLoading) return;
    await loadPage(currentPage + 1, true);
  }, [currentPage, hasNextPage, isLoading, loadPage]);
  
  return {
    data: allData.length > 0 ? allData : data,
    currentPage,
    pageSize,
    hasNextPage,
    hasPrevPage: currentPage > 1,
    isLoading,
    error,
    totalLoaded: allData.length > 0 ? allData.length : data.length,
    nextPage,
    prevPage,
    goToPage,
    refresh,
    loadMore
  };
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll<T>(
  queryBuilder: (...constraints: QueryConstraint[]) => Query,
  pageSize = 20
) {
  const pagination = usePagination<T>(queryBuilder, { pageSize });
  
  // Auto load more when scrolling near bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const element = e.currentTarget;
    const threshold = 100; // px from bottom
    
    if (
      element.scrollHeight - element.scrollTop <= element.clientHeight + threshold &&
      !pagination.isLoading &&
      pagination.hasNextPage
    ) {
      pagination.loadMore();
    }
  }, [pagination]);
  
  return {
    ...pagination,
    handleScroll
  };
}

export default usePagination;