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

  return (
    <div className={`${baseClasses} ${className} group`}>
      {/* Küçük simge - sadece Sparkles ikonu */}
      <div className={`
        w-6 h-6 rounded-full
        bg-gradient-to-r from-blue-500 to-indigo-600 
        text-white
        shadow-md
        flex items-center justify-center
        ${animationClasses}
        transition-all duration-200
        cursor-pointer
        hover:w-auto hover:px-2 hover:gap-1
      `}>
        <Sparkles className="h-3 w-3 flex-shrink-0" />
        {/* Hover'da metin görünür */}
        <span className="hidden group-hover:inline text-[10px] font-semibold whitespace-nowrap">YENİ</span>
      </div>
      {/* Zaman bilgisi - hover'da göster */}
      {timeAgo && (
        <div className="hidden group-hover:block absolute top-8 right-0 text-[9px] text-blue-600 font-medium bg-white rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap">
          {timeAgo}
        </div>
      )}
    </div>
  );
};

export default NewBadge;

