import React from 'react';
// Custom rotating sun icon to match requested style

interface LogoProps {
  compact?: boolean;
  className?: string;
  showSubtitle?: boolean;
  showText?: boolean;
  variant?: 'default' | 'white';
  size?: 'small' | 'medium' | 'large';
}

const Logo: React.FC<LogoProps> = ({ 
  compact = false, 
  className = '', 
  showSubtitle = true, 
  showText = true,
  variant = 'default',
  size = 'medium'
}) => {
  // Size classes
  const sizeClasses = {
    small: 'w-5 h-5',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const textSizeClasses = {
    small: 'text-base',
    medium: 'text-lg',
    large: 'text-2xl'
  };

  // Color classes based on variant
  const isWhite = variant === 'white';
  const rayColor = isWhite ? '#ffffff' : '#60a5fa';
  const coreColor = isWhite ? '#ffffff' : '#3b82f6';
  const textPrimaryClass = isWhite ? 'text-white' : 'text-gray-900 dark:text-gray-100';
  const textAccentClass = isWhite ? 'text-blue-100' : 'text-blue-600';
  const subtitleClass = isWhite ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className={sizeClasses[size]}
        aria-hidden="true"
      >
        {/* Rotating rays group (no outer ring) */}
        <g className="origin-center animate-[spin_6s_linear_infinite]">
          <g stroke={rayColor} strokeWidth="1.5" strokeLinecap="round">
            <line x1="12" y1="1.5" x2="12" y2="5.5" />
            <line x1="12" y1="18.5" x2="12" y2="22.5" />
            <line x1="1.5" y1="12" x2="5.5" y2="12" />
            <line x1="18.5" y1="12" x2="22.5" y2="12" />
            <line x1="4" y1="4" x2="7.2" y2="7.2" />
            <line x1="16.8" y1="16.8" x2="20" y2="20" />
            <line x1="4" y1="20" x2="7.2" y2="16.8" />
            <line x1="16.8" y1="7.2" x2="20" y2="4" />
          </g>
        </g>
        {/* Core only */}
        <circle cx="12" cy="12" r="3.4" fill={coreColor} />
      </svg>
      {showText && (
      <div className="leading-tight">
        <div className={`${textSizeClasses[size]} font-bold`}>
          <span className={textPrimaryClass}>Solar</span>
          <span className={`${textAccentClass} font-extrabold`}>Veyo</span>
        </div>
        {!compact && showSubtitle && (
          <div className={`text-[11px] ${subtitleClass}`}>Operasyon</div>
        )}
      </div>
      )}
    </div>
  );
};

export default Logo;


