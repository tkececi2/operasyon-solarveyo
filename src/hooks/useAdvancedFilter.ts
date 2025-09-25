import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '../components/ui/VirtualTable';

export interface FilterConfig<T> {
  key: keyof T;
  type: 'text' | 'select' | 'date' | 'number' | 'boolean' | 'range';
  label: string;
  options?: { value: any; label: string }[];
  placeholder?: string;
  format?: (value: any) => string;
}

export interface FilterValue {
  key: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface UseAdvancedFilterProps<T> {
  data: T[];
  searchKeys: (keyof T)[];
  filterConfigs: FilterConfig<T>[];
  defaultSort?: SortConfig;
  itemsPerPage?: number;
}

export function useAdvancedFilter<T>({
  data,
  searchKeys,
  filterConfigs,
  defaultSort,
  itemsPerPage = 10
}: UseAdvancedFilterProps<T>) {
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Filter state
  const [activeFilters, setActiveFilters] = useState<FilterValue[]>([]);

  // Sort state
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Add filter
  const addFilter = useCallback((filter: FilterValue) => {
    setActiveFilters(prev => {
      const existing = prev.find(f => f.key === filter.key);
      if (existing) {
        return prev.map(f => f.key === filter.key ? filter : f);
      }
      return [...prev, filter];
    });
    setCurrentPage(1);
  }, []);

  // Remove filter
  const removeFilter = useCallback((key: string) => {
    setActiveFilters(prev => prev.filter(f => f.key !== key));
    setCurrentPage(1);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Sort handler
  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  }, []);

  // Search function
  const searchData = useCallback((items: T[], term: string): T[] => {
    if (!term.trim()) return items;

    const searchTermLower = term.toLowerCase();
    return items.filter(item => 
      searchKeys.some(key => {
        const value = item[key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchTermLower);
      })
    );
  }, [searchKeys]);

  // Filter function
  const filterData = useCallback((items: T[], filters: FilterValue[]): T[] => {
    if (filters.length === 0) return items;

    return items.filter(item => {
      return filters.every(filter => {
        const value = item[filter.key as keyof T];
        const filterValue = filter.value;

        if (filterValue == null || filterValue === '') return true;

        switch (filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'gte':
            return Number(value) >= Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          case 'lte':
            return Number(value) <= Number(filterValue);
          case 'between':
            if (Array.isArray(filterValue) && filterValue.length === 2) {
              const numValue = Number(value);
              return numValue >= Number(filterValue[0]) && numValue <= Number(filterValue[1]);
            }
            return true;
          default:
            // Default behavior for different types
            if (typeof value === 'boolean') {
              return value === Boolean(filterValue);
            }
            if (typeof value === 'string') {
              return value.toLowerCase().includes(String(filterValue).toLowerCase());
            }
            return value === filterValue;
        }
      });
    });
  }, []);

  // Sort function
  const sortData = useCallback((items: T[], config: SortConfig | null): T[] => {
    if (!config) return items;

    return [...items].sort((a, b) => {
      const aValue = a[config.key as keyof T];
      const bValue = b[config.key as keyof T];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return config.direction === 'asc' ? 1 : -1;
      if (bValue == null) return config.direction === 'asc' ? -1 : 1;

      let comparison = 0;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue, 'tr');
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'tr');
      }

      return config.direction === 'asc' ? comparison : -comparison;
    });
  }, []);

  // Processed data
  const processedData = useMemo(() => {
    let result = [...data];
    
    // Apply search
    result = searchData(result, debouncedSearchTerm);
    
    // Apply filters
    result = filterData(result, activeFilters);
    
    // Apply sort
    result = sortData(result, sortConfig);
    
    return result;
  }, [data, debouncedSearchTerm, activeFilters, sortConfig, searchData, filterData, sortData]);

  // Pagination
  const totalItems = processedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentItems = processedData.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // Export filtered data
  const exportData = useCallback(() => {
    return processedData;
  }, [processedData]);

  return {
    // Data
    items: currentItems,
    allItems: processedData,
    totalItems,
    
    // Search
    searchTerm,
    setSearchTerm,
    
    // Filters
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    
    // Sort
    sortConfig,
    handleSort,
    
    // Pagination
    currentPage,
    totalPages,
    itemsPerPage,
    startIndex: startIndex + 1,
    endIndex,
    goToPage,
    nextPage,
    prevPage,
    
    // Utils
    exportData,
    hasFilters: activeFilters.length > 0 || debouncedSearchTerm.length > 0
  };
}
