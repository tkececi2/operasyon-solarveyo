import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  text,
  className = '',
  fullScreen = false
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-primary-600 ${sizes[size]}`} />
      {text && (
        <p className="mt-2 text-sm text-gray-600">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Inline Loading Spinner (küçük)
export const InlineSpinner: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Loader2 className={`h-4 w-4 animate-spin ${className}`} />
);

// Page Loading Component
export const PageLoading: React.FC<{ text?: string }> = ({ text = 'Yükleniyor...' }) => (
  <div className="min-h-[400px] flex items-center justify-center">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

// Table Loading Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, j) => (
          <div key={j} className="h-4 bg-gray-200 rounded animate-pulse" />
        ))}
      </div>
    ))}
  </div>
);

// Card Loading Skeleton
export const CardSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6 space-y-4">
    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
    </div>
  </div>
);
