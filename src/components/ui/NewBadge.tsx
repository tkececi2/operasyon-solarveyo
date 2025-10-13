/**
 * NewBadge Component
 * Yeni eklenen kayıtlar için görsel badge
 * Web ve iOS uyumlu
 */

import React from 'react';
import { Sparkles } from 'lucide-react';

interface NewBadgeProps {
  /** Yeni badge gösterilsin mi? */
  show: boolean;
  /** Badge pozisyonu (varsayılan: absolute top-right) */
  position?: 'absolute' | 'relative';
  /** Özel CSS class'ları */
  className?: string;
  /** Animasyon aktif mi? (varsayılan: true) */
  animated?: boolean;
  /** Kompakt mod (küçük badge) */
  compact?: boolean;
  /** Kaç saat/gün önce eklendiği bilgisi */
  timeAgo?: string;
}

export const NewBadge: React.FC<NewBadgeProps> = ({
  show,
  position = 'absolute',
  className = '',
  animated = true,
  compact = false,
  timeAgo
}) => {
  if (!show) return null;

  const baseClasses = position === 'absolute' 
    ? 'absolute top-2 right-2 z-10'
    : 'inline-flex';

  const animationClasses = animated 
    ? 'animate-pulse'
    : '';

  const sizeClasses = compact
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-xs';

  return (
    <div className={`${baseClasses} ${className}`}>
      <div className={`
        ${sizeClasses}
        bg-gradient-to-r from-blue-500 to-indigo-600 
        text-white font-semibold rounded-full 
        shadow-lg shadow-blue-500/50
        flex items-center gap-1
        ${animationClasses}
        transform transition-transform duration-200
        hover:scale-105
      `}>
        <Sparkles className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        <span>YENİ</span>
      </div>
      {timeAgo && !compact && (
        <div className="text-[10px] text-blue-600 font-medium text-center mt-0.5 bg-white/90 rounded px-1 py-0.5">
          {timeAgo}
        </div>
      )}
    </div>
  );
};

export default NewBadge;

