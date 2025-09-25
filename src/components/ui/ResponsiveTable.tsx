import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
  mobileHidden?: boolean; // Mobile'da gizlenecek kolonlar
  priority?: number; // Görünüm önceliği (1 = en önemli)
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  mobileCard?: (item: T) => React.ReactNode; // Mobile için özel kart görünümü
}

function ResponsiveTable<T extends { id?: string | number }>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'Veri bulunamadı',
  mobileCard
}: ResponsiveTableProps<T>) {
  const [expandedRows, setExpandedRows] = React.useState<Set<string | number>>(new Set());

  const toggleRow = (id: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Kolonları önceliğe göre sırala
  const sortedColumns = [...columns].sort((a, b) => 
    (a.priority || 999) - (b.priority || 999)
  );

  // Mobile'da gösterilecek kolonları filtrele
  const mobileColumns = sortedColumns.filter(col => !col.mobileHidden);
  const hiddenColumns = sortedColumns.filter(col => col.mobileHidden);

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, index) => (
              <tr
                key={item.id || index}
                onClick={() => onRowClick?.(item)}
                className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {column.render 
                      ? column.render(item)
                      : String(item[column.key as keyof T] || '-')
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {data.map((item, index) => {
          const id = item.id || index;
          const isExpanded = expandedRows.has(id);

          // Özel mobile kart varsa kullan
          if (mobileCard) {
            return (
              <div key={id} onClick={() => onRowClick?.(item)}>
                {mobileCard(item)}
              </div>
            );
          }

          // Default mobile kart görünümü
          return (
            <div
              key={id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Ana bilgiler */}
              <div
                onClick={() => onRowClick?.(item)}
                className={`p-4 ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              >
                <div className="space-y-2">
                  {mobileColumns.slice(0, 3).map((column) => (
                    <div key={String(column.key)} className="flex justify-between">
                      <span className="text-sm text-gray-500">{column.label}:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {column.render 
                          ? column.render(item)
                          : String(item[column.key as keyof T] || '-')
                        }
                      </span>
                    </div>
                  ))}
                </div>

                {/* Genişlet/Daralt butonu */}
                {(hiddenColumns.length > 0 || mobileColumns.length > 3) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRow(id);
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Daha az göster
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Daha fazla göster
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Genişletilmiş içerik */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
                  {[...mobileColumns.slice(3), ...hiddenColumns].map((column) => (
                    <div key={String(column.key)} className="flex justify-between">
                      <span className="text-sm text-gray-500">{column.label}:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {column.render 
                          ? column.render(item)
                          : String(item[column.key as keyof T] || '-')
                        }
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default ResponsiveTable;