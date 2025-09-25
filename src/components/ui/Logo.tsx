import React from 'react';
// Custom rotating sun icon to match requested style

interface LogoProps {
  compact?: boolean;
  className?: string;
  showSubtitle?: boolean;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ compact = false, className = '', showSubtitle = true, showText = true }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-blue-500"
        aria-hidden="true"
      >
        {/* Rotating rays group (no outer ring) */}
        <g className="origin-center animate-[spin_6s_linear_infinite]">
          <g stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round">
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
        <circle cx="12" cy="12" r="3.4" fill="#3b82f6" />
      </svg>
      {showText && (
      <div className="leading-tight">
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          <span className="text-gray-900 dark:text-gray-100">Solar</span>
          <span className="text-blue-600 font-extrabold">Veyo</span>
        </div>
        {!compact && showSubtitle && (
          <div className="text-[11px] text-gray-500 dark:text-gray-400">Operasyon</div>
        )}
      </div>
      )}
    </div>
  );
};

export default Logo;


