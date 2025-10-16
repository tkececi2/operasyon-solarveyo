/**
 * PullToRefresh Component
 * iOS native-like pull-to-refresh özelliği
 * Sayfa aşağı çekilince yenileme yapar
 */

import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  /** Pull to refresh devre dışı bırak */
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, disabled = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const refreshThreshold = 70; // 70px çekince yenileme başlar

  useEffect(() => {
    if (disabled) return;
    
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Sadece en üstteyken pull-to-refresh aktif
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      if (scrollTop > 0) {
        isDragging.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0) {
        // Aşağı çekiliyor - iOS gibi resistance effect
        const resistance = 0.5; // Direnç faktörü (0.5 = yarı hızda)
        const distance = Math.min(diff * resistance, refreshThreshold * 1.5);

        setPullDistance(distance);

        // Scroll'u engelle - sadece event cancelable ise
        if (diff > 10 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      if (pullDistance >= refreshThreshold && !isRefreshing) {
        // Yenileme başlat
        setIsRefreshing(true);
        setPullDistance(refreshThreshold);

        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull-to-refresh error:', error);
        } finally {
          // Animasyonlu geri dönüş
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        // Eşiğe ulaşılmadı, geri çek
        setPullDistance(0);
      }
    };

    // Event listener'ları ekle
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, disabled, isRefreshing, pullDistance]);

  // Pull-to-refresh göstergesi için opacity ve rotation hesapla
  const progress = Math.min(pullDistance / refreshThreshold, 1);
  const rotation = progress * 360;
  const opacity = Math.min(progress, 1);

  return (
    <div ref={containerRef} className="relative min-h-screen">
      {/* Pull-to-Refresh Göstergesi - iOS Native Gibi */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none transition-all duration-200 ease-out z-50"
        style={{
          top: pullDistance > 0 ? `${Math.max(pullDistance - 50, 0)}px` : '-50px',
          opacity: opacity,
          transform: `translateY(${pullDistance > 0 ? '0' : '-20px'})`
        }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
          <RefreshCw 
            className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'rotate(0deg)' : `rotate(${rotation}deg)`
            }}
          />
        </div>
      </div>

      {/* İçerik - Çekilirken yumuşak hareket */}
      <div
        ref={contentRef}
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance * 0.3}px)` // İçerik hafifçe kayar
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default PullToRefresh;
