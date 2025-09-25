import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Zap } from 'lucide-react';

export interface QuickSearchResult<T> {
  id: string;
  title: string;
  subtitle?: string;
  data: T;
  category?: string;
  icon?: React.ReactNode;
}

interface QuickSearchProps<T> {
  data: T[];
  searchFunction: (data: T[], term: string) => QuickSearchResult<T>[];
  onSelect: (result: QuickSearchResult<T>) => void;
  placeholder?: string;
  maxResults?: number;
  showRecentSearches?: boolean;
  className?: string;
}

export function QuickSearch<T>({
  data,
  searchFunction,
  onSelect,
  placeholder = "Hızlı ara...",
  maxResults = 10,
  showRecentSearches = true,
  className = ""
}: QuickSearchProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<QuickSearchResult<T>[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem('quickSearchRecent');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (e) {
          console.warn('Failed to parse recent searches:', e);
        }
      }
    }
  }, [showRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearch = (term: string) => {
    if (!showRecentSearches || !term.trim()) return;
    
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('quickSearchRecent', JSON.stringify(updated));
  };

  // Search function with debouncing
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setSelectedIndex(-1);
      return;
    }

    const timeoutId = setTimeout(() => {
      const searchResults = searchFunction(data, searchTerm).slice(0, maxResults);
      setResults(searchResults);
      setSelectedIndex(-1);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, data, searchFunction, maxResults]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle selection
  const handleSelect = (result: QuickSearchResult<T>) => {
    saveRecentSearch(searchTerm);
    onSelect(result);
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle recent search selection
  const handleRecentSelect = (term: string) => {
    setSearchTerm(term);
    inputRef.current?.focus();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('quickSearchRecent');
  };

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    const category = result.category || 'Diğer';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(result);
    return acc;
  }, {} as Record<string, QuickSearchResult<T>[]>);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay to allow clicking on results
            setTimeout(() => setIsOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {/* Search Results */}
          {searchTerm.trim() && results.length > 0 && (
            <div>
              {Object.entries(groupedResults).map(([category, categoryResults]) => (
                <div key={category}>
                  {Object.keys(groupedResults).length > 1 && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                      {category}
                    </div>
                  )}
                  {categoryResults.map((result, index) => {
                    const globalIndex = results.findIndex(r => r.id === result.id);
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={`w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3 ${
                          selectedIndex === globalIndex ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        {result.icon && (
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                            {result.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {result.title}
                          </div>
                          {result.subtitle && (
                            <div className="text-sm text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          )}
                        </div>
                        <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {searchTerm.trim() && results.length === 0 && (
            <div className="px-3 py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Sonuç bulunamadı</p>
            </div>
          )}

          {/* Recent Searches */}
          {!searchTerm.trim() && showRecentSearches && recentSearches.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b flex items-center justify-between">
                <span>Son Aramalar</span>
                <button
                  onClick={clearRecentSearches}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {recentSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSelect(term)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!searchTerm.trim() && (!showRecentSearches || recentSearches.length === 0) && (
            <div className="px-3 py-8 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>Aramaya başlayın</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
