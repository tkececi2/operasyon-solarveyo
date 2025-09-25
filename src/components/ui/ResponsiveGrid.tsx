import React from 'react';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: number;
  className?: string;
}

/**
 * Responsive Grid Component
 * Otomatik responsive grid layout
 */
const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4, xl: 4, '2xl': 5 },
  gap = 4,
  className = ''
}) => {
  // Grid class'larını oluştur
  const gridClasses = [
    `grid`,
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
};

/**
 * Responsive Card Grid
 * Kartlar için optimize edilmiş grid
 */
export const CardGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive Stats Grid
 * İstatistik kartları için
 */
export const StatsGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive Form Grid
 * Form elemanları için
 */
export const FormGrid: React.FC<{ children: React.ReactNode; columns?: 1 | 2 | 3; className?: string }> = ({ 
  children, 
  columns = 2,
  className = '' 
}) => {
  const gridClass = columns === 1 
    ? 'grid-cols-1'
    : columns === 2 
    ? 'grid-cols-1 md:grid-cols-2'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';

  return (
    <div className={`grid ${gridClass} gap-4 ${className}`}>
      {children}
    </div>
  );
};

/**
 * Responsive Masonry Grid
 * Farklı yükseklikteki elemanlar için
 */
export const MasonryGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 ${className}`}>
      {React.Children.map(children, (child, index) => (
        <div key={index} className="break-inside-avoid mb-4">
          {child}
        </div>
      ))}
    </div>
  );
};

export default ResponsiveGrid;
