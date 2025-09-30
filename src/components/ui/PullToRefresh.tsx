import React, { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = ''
}) => {
  const {
    containerRef,
    isRefreshing,
    pullDistance,
    pullProgress,
    isPulling
  } = usePullToRefresh({ onRefresh });

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto h-full ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull to Refresh Indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-300 ${
          isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          transform: `translateY(${pullDistance - 50}px)`,
          height: '50px',
          zIndex: 10
        }}
      >
        <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg">
          <RefreshCw
            className={`w-5 h-5 text-blue-500 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: `rotate(${pullProgress * 360}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.2s'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};
