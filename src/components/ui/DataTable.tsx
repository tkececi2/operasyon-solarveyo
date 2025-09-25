import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, FileText } from 'lucide-react';
import { Button, LoadingSpinner } from './';
import { SortConfig } from '../../hooks/useAdvancedFilter';

export interface ColumnDef<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  render?: (value: any, item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  sortConfig?: SortConfig | null;
  onSort?: (key: string) => void;
  onExport?: () => void;
  emptyMessage?: string;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
}

export function DataTable<T>({
  data,
  columns,
  loading = false,
  sortConfig,
  onSort,
  onExport,
  emptyMessage = "Veri bulunamadı",
  className = "",
  rowClassName,
  onRowClick
}: DataTableProps<T>) {
  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Export Button */}
      {onExport && (
        <div className="px-6 py-3 border-b border-gray-200 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExport}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Dışa Aktar
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'center' ? 'text-center' :
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''} ${
                    column.className || ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && onSort?.(String(column.key))}
                >
                  <div className="flex items-center gap-1">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(String(column.key))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <FileText className="w-12 h-12 text-gray-300 mb-4" />
                    <p className="text-gray-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={index}
                  className={`hover:bg-gray-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName ? rowClassName(item, index) : ''}`}
                  onClick={() => onRowClick?.(item, index)}
                >
                  {columns.map((column) => {
                    const value = item[column.key];
                    return (
                      <td
                        key={String(column.key)}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          column.align === 'center' ? 'text-center' :
                          column.align === 'right' ? 'text-right' : 'text-left'
                        } ${column.className || ''}`}
                      >
                        {column.render ? column.render(value, item, index) : (
                          <span className="text-gray-900">
                            {value != null ? String(value) : '-'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  startIndex,
  endIndex,
  onPageChange,
  onPrevious,
  onNext
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="ghost"
          onClick={onPrevious}
          disabled={currentPage === 1}
        >
          Önceki
        </Button>
        <Button
          variant="ghost"
          onClick={onNext}
          disabled={currentPage === totalPages}
        >
          Sonraki
        </Button>
      </div>
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            <span className="font-medium">{startIndex}</span> - <span className="font-medium">{endIndex}</span> arası,{' '}
            toplam <span className="font-medium">{totalItems}</span> kayıt
          </p>
        </div>
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={onPrevious}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Önceki</span>
              <ChevronUp className="h-5 w-5 rotate-[-90deg]" />
            </button>
            
            {getPageNumbers().map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => onPageChange(pageNumber)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  pageNumber === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            
            <button
              onClick={onNext}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Sonraki</span>
              <ChevronDown className="h-5 w-5 rotate-[-90deg]" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
