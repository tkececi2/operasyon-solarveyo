/**
 * PullToRefresh Component
 * iOS ve Web için pull-to-refresh özelliği
 * Sayfa aşağı çekilince yenileme yapar
 */

import React, { useEffect, useRef } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const refreshThreshold = 80; // 80px çekince yenileme başlar

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let refreshIndicator: HTMLDivElement | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      // Sadece en üstteyken pull-to-refresh aktif
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
        isDragging.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      if (window.scrollY > 0) {
        isDragging.current = false;
        return;
      }

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0) {
        // Aşağı çekiliyor
        e.preventDefault();
        
        if (!refreshIndicator) {
          // Yenileme göstergesini oluştur
          refreshIndicator = document.createElement('div');
          refreshIndicator.className = 'pull-to-refresh-indicator';
          refreshIndicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: ${Math.min(diff, refreshThreshold)}px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent);
            z-index: 9999;
            transition: background 0.2s;
          `;
          
          const spinner = document.createElement('div');
          spinner.innerHTML = '↓';
          spinner.style.cssText = `
            font-size: 24px;
            color: #3b82f6;
            transform: rotate(${Math.min(diff / refreshThreshold * 180, 180)}deg);
            transition: transform 0.1s;
          `;
          
          refreshIndicator.appendChild(spinner);
          document.body.appendChild(refreshIndicator);
        } else {
          // Göstergeyi güncelle
          refreshIndicator.style.height = `${Math.min(diff, refreshThreshold)}px`;
          const spinner = refreshIndicator.querySelector('div');
          if (spinner) {
            spinner.style.transform = `rotate(${Math.min(diff / refreshThreshold * 180, 180)}deg)`;
            if (diff >= refreshThreshold) {
              spinner.innerHTML = '↻';
            } else {
              spinner.innerHTML = '↓';
            }
          }
        }
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const diff = currentY.current - startY.current;

      if (diff >= refreshThreshold && refreshIndicator) {
        // Yenileme animasyonu
        refreshIndicator.style.background = 'linear-gradient(to bottom, rgba(59, 130, 246, 0.2), transparent)';
        const spinner = refreshIndicator.querySelector('div');
        if (spinner) {
          spinner.innerHTML = '↻';
          spinner.style.animation = 'spin 1s linear infinite';
        }

        // Stil ekle
        if (!document.getElementById('ptr-styles')) {
          const style = document.createElement('style');
          style.id = 'ptr-styles';
          style.textContent = `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }

        try {
          await onRefresh();
        } catch (error) {
          console.error('Pull-to-refresh error:', error);
          // Hata durumunda bile göstergeyi kaldır
        }

        // Göstergeyi kaldır
        setTimeout(() => {
          if (refreshIndicator) {
            refreshIndicator.style.transition = 'opacity 0.3s, height 0.3s';
            refreshIndicator.style.opacity = '0';
            refreshIndicator.style.height = '0';
            setTimeout(() => {
              if (refreshIndicator && refreshIndicator.parentNode) {
                refreshIndicator.parentNode.removeChild(refreshIndicator);
                refreshIndicator = null;
              }
            }, 300);
          }
        }, 500);
      } else {
        // Eşiğe ulaşılmadı, göstergeyi kaldır
        if (refreshIndicator) {
          refreshIndicator.style.transition = 'opacity 0.2s, height 0.2s';
          refreshIndicator.style.opacity = '0';
          refreshIndicator.style.height = '0';
          setTimeout(() => {
            if (refreshIndicator && refreshIndicator.parentNode) {
              refreshIndicator.parentNode.removeChild(refreshIndicator);
              refreshIndicator = null;
            }
          }, 200);
        }
      }

      startY.current = 0;
      currentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      // Cleanup
      const indicator = document.querySelector('.pull-to-refresh-indicator');
      if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
      }
    };
  }, [onRefresh]);

  return (
    <div ref={containerRef} style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
};

export default PullToRefresh;
