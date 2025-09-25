import React from 'react';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  className = '',
  showLabel = false,
  height = 'md',
  variant = 'primary'
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div className="relative">
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${heightClasses[height]} rounded-full transition-all duration-300 ${
            className || variantClasses[variant]
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-medium">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
};
