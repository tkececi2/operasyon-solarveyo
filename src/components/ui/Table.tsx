import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';

// Table Container
interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => (
  <div className="overflow-x-auto overflow-y-visible">
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  </div>
);

// Table Header
interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '' }) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

// Table Body
interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

// Table Row
interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({ 
  children, 
  className = '', 
  onClick,
  hover = true 
}) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-gray-50' : ''}
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}
    onClick={onClick}
  >
    {children}
  </tr>
);

// Table Header Cell
interface TableHeaderCellProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ 
  children, 
  className = '',
  sortable = false,
  sortDirection = null,
  onSort
}) => (
  <th 
    className={`
      px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
      ${sortable ? 'cursor-pointer select-none hover:bg-gray-100' : ''}
      ${className}
    `}
    onClick={sortable ? onSort : undefined}
  >
    <div className="flex items-center space-x-1">
      <span>{children}</span>
      {sortable && (
        <div className="flex flex-col">
          <ChevronUp 
            className={`h-3 w-3 ${
              sortDirection === 'asc' ? 'text-gray-900' : 'text-gray-400'
            }`} 
          />
          <ChevronDown 
            className={`h-3 w-3 -mt-1 ${
              sortDirection === 'desc' ? 'text-gray-900' : 'text-gray-400'
            }`} 
          />
        </div>
      )}
    </div>
  </th>
);

// Table Cell
interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}>
    {children}
  </td>
);

// Action Cell (for buttons, menus etc.)
interface ActionCellProps {
  children: React.ReactNode;
  className?: string;
}

export const ActionCell: React.FC<ActionCellProps> = ({ children, className = '' }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${className}`}>
    {children}
  </td>
);

// Empty State
interface EmptyStateProps {
  message?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  message = 'Veri bulunamadı',
  description,
  action,
  icon
}) => (
  <div className="text-center py-12">
    {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>}
    <h3 className="text-sm font-medium text-gray-900 mb-2">{message}</h3>
    {description && (
      <p className="text-sm text-gray-500 mb-4">{description}</p>
    )}
    {action && <div>{action}</div>}
  </div>
);

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showInfo = true,
  totalItems,
  itemsPerPage
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const startItem = (currentPage - 1) * (itemsPerPage || 0) + 1;
  const endItem = Math.min(currentPage * (itemsPerPage || 0), totalItems || 0);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
      {showInfo && totalItems && itemsPerPage && (
        <div className="flex-1 flex justify-between sm:hidden">
          <span className="text-sm text-gray-700">
            {startItem} - {endItem} / {totalItems}
          </span>
        </div>
      )}
      
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        {showInfo && totalItems && itemsPerPage && (
          <div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> arası,
              toplam <span className="font-medium">{totalItems}</span> kayıt
            </p>
          </div>
        )}
        
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Önceki
            </button>
            
            {pages.map(page => (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  relative inline-flex items-center px-4 py-2 border text-sm font-medium
                  ${page === currentPage
                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }
                `}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// Dropdown Menu for table actions
interface DropdownMenuProps {
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    danger?: boolean;
    disabled?: boolean;
  }>;
  trigger?: React.ReactNode;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
  items, 
  trigger = <MoreVertical className="h-4 w-4" />
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [buttonRect, setButtonRect] = React.useState<DOMRect | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="relative inline-block text-left">
        <button
          ref={buttonRef}
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-2 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={handleToggle}
        >
          {trigger}
        </button>
      </div>

      {isOpen && buttonRect && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[9998]" 
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="fixed w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-[9999]"
            style={{
              top: buttonRect.bottom + window.scrollY + 8,
              left: buttonRect.right - 224, // 224px = w-56
            }}
          >
            <div className="py-1">
              {items.map((item, index) => (
                <button
                  key={index}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center space-x-2
                    ${item.danger ? 'text-red-700 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-100'}
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}
                  `}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};
