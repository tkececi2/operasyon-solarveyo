import React, { useEffect, useRef } from 'react';
import { getGoogleMapsApiKey } from '../../utils/googleMaps';

// Harita noktası tipi
type Point = {
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  status?: 'normal' | 'bakim' | 'ariza';
  url?: string;
  details?: Array<{ label: string; value: string }>;
};

declare global {
  interface Window {
    google: any;
    markerClusterer: any;
  }
}

const loadScript = (src: string) => {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

const waitForGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.google && window.google.maps) {
        resolve(true);
      } else if (document.readyState === 'complete') {
        setTimeout(check, 100);
      } else {
        requestAnimationFrame(check);
      }
    };
    check();
  });
};

export const MiniClusterMap: React.FC<{ 
  points: Point[]; 
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'; 
  height?: number 
}> = ({ points, mapType = 'terrain', height = 260 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      if (points.length === 0) return;

      try {
        if (!window.google || !window.google.maps) {
          await waitForGoogleMaps();
        }
        
        await loadScript('https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js');

        const defaultCenter = {
          lat: points.reduce((a, c) => a + c.lat, 0) / points.length,
          lng: points.reduce((a, c) => a + c.lng, 0) / points.length,
        };

        const map = new window.google.maps.Map(containerRef.current!, {
          center: defaultCenter,
          zoom: 6,
          mapTypeId: mapType,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });

        // Duruma göre renk
        const getColorByStatus = (status?: 'normal' | 'bakim' | 'ariza') => {
          if (status === 'ariza') return '#ef4444';
          if (status === 'bakim') return '#f59e0b';
          return '#10b981';
        };

        // Profesyonel GES Binası Marker (3D Building Icon)
        const createGESBuildingMarker = (status?: 'normal' | 'bakim' | 'ariza') => {
          const primaryColor = status === 'ariza' ? '#dc2626' : 
                              status === 'bakim' ? '#ea580c' : '#0284c7';
          const secondaryColor = status === 'ariza' ? '#991b1b' : 
                                status === 'bakim' ? '#9a3412' : '#075985';
          const glowColor = getColorByStatus(status);
          
          const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="56" height="56" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Gölge -->
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2.5"/>
      <feOffset dx="0" dy="3" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.35"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Durum glow -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Zemin gölgesi -->
  <ellipse cx="28" cy="50" rx="16" ry="3" fill="#00000015"/>
  
  <!-- Bina Gövdesi (3D efekt) -->
  <g filter="url(#shadow)">
    <!-- Ana bina -->
    <path d="M 12 38 L 12 18 L 28 12 L 44 18 L 44 38 Z" 
          fill="${primaryColor}" 
          stroke="${secondaryColor}" 
          stroke-width="1.5"/>
    
    <!-- Çatı - solar panel -->
    <path d="M 10 18 L 28 10 L 46 18 L 44 18 L 28 12 L 12 18 Z" 
          fill="#1e40af" 
          stroke="#1e3a8a" 
          stroke-width="1"/>
    
    <!-- Çatıda solar panel detayları -->
    <rect x="14" y="13" width="28" height="6" rx="1" fill="#3b82f6" opacity="0.9" stroke="#1e40af" stroke-width="0.5"/>
    <line x1="14" y1="16" x2="42" y2="16" stroke="#1e40af" stroke-width="0.5"/>
    <line x1="20" y1="13" x2="20" y2="19" stroke="#1e40af" stroke-width="0.5"/>
    <line x1="28" y1="13" x2="28" y2="19" stroke="#1e40af" stroke-width="0.5"/>
    <line x1="36" y1="13" x2="36" y2="19" stroke="#1e40af" stroke-width="0.5"/>
    
    <!-- Pencereler -->
    <rect x="16" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="22" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="30" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="36" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    
    <rect x="16" y="28" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="22" y="28" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="30" y="28" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    <rect x="36" y="28" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.7"/>
    
    <!-- Kapı -->
    <rect x="24" y="33" width="8" height="5" rx="0.5" fill="${secondaryColor}"/>
  </g>
  
  <!-- Durum badge (sağ üst) -->
  <g filter="url(#glow)">
    <circle cx="46" cy="8" r="8" fill="${glowColor}" stroke="#ffffff" stroke-width="2.5"/>
    <text x="46" y="11" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">
      ${status === 'ariza' ? '!' : status === 'bakim' ? '⚙' : '✓'}
    </text>
  </g>
  
  <!-- Güç ikonu (sol üst - küçük) -->
  <circle cx="10" cy="8" r="6" fill="#fbbf24" opacity="0.9"/>
  <text x="10" y="11" text-anchor="middle" font-size="9" fill="#ffffff">⚡</text>
</svg>`;
          
          const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
          return {
            url,
            scaledSize: new window.google.maps.Size(56, 56),
            anchor: new window.google.maps.Point(28, 50),
          };
        };

        const infoWindow = new window.google.maps.InfoWindow();

        const bounds = new window.google.maps.LatLngBounds();
        const markers = points.map((p) => {
          const position = { lat: p.lat, lng: p.lng };
          const safeTitle = p.title ?? 'Saha';
          const safeSubtitle = p.subtitle ?? '';
          
          // Glow rengi (tüm scope için)
          const glowColor = getColorByStatus(p.status);
          
          const marker = new window.google.maps.Marker({
            position,
            title: p.title,
            icon: createGESBuildingMarker(p.status),
            optimized: false,
            animation: window.google.maps.Animation.DROP, // Yumuşak iniş animasyonu
          });

          if (p.status === 'ariza') {
            marker.setZIndex((window as any).google.maps.Marker.MAX_ZINDEX + 1);
          }

          bounds.extend(position);

          marker.addListener('click', () => {
            
            // Durum badge
            let statusBadge = '';
            if (p.status === 'ariza') {
              statusBadge = '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;background:#fee2e2;color:#991b1b;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid #fecaca"><svg style="width:14px;height:14px" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>ARIZA</span>';
            } else if (p.status === 'bakim') {
              statusBadge = '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;background:#fef3c7;color:#92400e;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid #fde68a"><svg style="width:14px;height:14px" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/></svg>BAKIM</span>';
            } else {
              statusBadge = '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 12px;background:#d1fae5;color:#065f46;border-radius:20px;font-size:12px;font-weight:600;border:1.5px solid #a7f3d0"><svg style="width:14px;height:14px" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>AKTİF</span>';
            }
            
            const subtitle = safeSubtitle ? `<div style="color:#64748b;font-size:13px;margin-bottom:8px">${safeSubtitle}</div>` : '';
            
            // Detayları zengin kartlar halinde göster - Sadece dolu olanlar
            const validDetails = (p.details || []).filter(d => 
              d && d.label && d.value && 
              d.value !== 'undefined' && 
              d.value !== 'null' && 
              d.value.trim() !== '' &&
              !d.value.includes('undefined')
            );
            
            const list = validDetails.length > 0 ? 
              `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
                ${validDetails.map(d => `
                  <div style="background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);padding:10px;border-radius:8px;border:1px solid #bae6fd">
                    <div style="font-size:11px;color:#0369a1;font-weight:600;text-transform:uppercase;margin-bottom:4px">${d.label}</div>
                    <div style="font-size:15px;color:#0c4a6e;font-weight:700">${d.value}</div>
                  </div>
                `).join('')}
              </div>` : '';
            
            const detail = p.url ? 
              `<a href="${p.url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(99,102,241,0.3);transition:all 0.2s;border:2px solid #ffffff40">
                <svg style="width:16px;height:16px" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/></svg>
                Detaylar
              </a>` : '';
            
            const direction = `<a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(14,165,233,0.3);transition:all 0.2s;border:2px solid #ffffff40">
              <svg style="width:16px;height:16px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Yol Tarifi
            </a>`;
          
          const content = `
            <div style="min-width:300px;max-width:360px;padding:8px;font-family:system-ui,-apple-system,sans-serif">
              <!-- Başlık -->
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:12px;border-bottom:2px solid #e2e8f0">
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="background:linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);padding:8px;border-radius:10px;box-shadow:0 2px 8px rgba(59,130,246,0.3)">
                    <svg style="width:20px;height:20px;color:#ffffff" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                    </svg>
                  </div>
                  <div>
                    <div style="font-weight:700;font-size:17px;color:#0f172a;line-height:1.2">${safeTitle}</div>
                    ${safeSubtitle ? `<div style="color:#64748b;font-size:12px;margin-top:2px">${safeSubtitle}</div>` : ''}
                  </div>
                </div>
                ${statusBadge}
              </div>
              
              ${list}
              
              <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
                ${detail}
                ${direction}
              </div>
            </div>
          `;
          infoWindow.setContent(content);
          infoWindow.open({ anchor: marker, map });
          });

          // Hover efekti için - modern hover tooltip
          const hoverDiv = document.createElement('div');
          hoverDiv.style.cssText = `
            position: absolute;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            padding: 12px 16px;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 13px;
            font-weight: 600;
            color: #0f172a;
            pointer-events: none;
            z-index: 1000;
            display: none;
            backdrop-filter: blur(10px);
            border: 2px solid ${glowColor}40;
            animation: fadeIn 0.2s ease-out;
          `;
          
          const statusIcon = p.status === 'ariza' ? '🔴' : 
                            p.status === 'bakim' ? '🟡' : '🟢';
          
          hoverDiv.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">${statusIcon}</span>
              <span>${safeTitle}</span>
            </div>
          `;
          
          document.body.appendChild(hoverDiv);

          marker.addListener('mouseover', (e: any) => {
            hoverDiv.style.display = 'block';
            hoverDiv.style.left = e.domEvent.pageX + 15 + 'px';
            hoverDiv.style.top = e.domEvent.pageY - 50 + 'px';
          });

          marker.addListener('mouseout', () => {
            hoverDiv.style.display = 'none';
          });

          return marker;
        });

        // Modern Kümelendirme
        if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
          new window.markerClusterer.MarkerClusterer({ 
            map, 
            markers,
            renderer: {
              render: ({ count, position }: any) => {
                // Miktar bazlı renk ve gradient
                const colors = count > 10 
                  ? { primary: '#dc2626', secondary: '#991b1b', glow: '#fca5a5' }
                  : count > 5
                  ? { primary: '#ea580c', secondary: '#9a3412', glow: '#fdba74' }
                  : { primary: '#0284c7', secondary: '#075985', glow: '#7dd3fc' };
                
                // Clean, minimal cluster tasarımı
                const svg = `
                  <svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <!-- Glow shadow -->
                      <filter id="clusterShadow">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.4"/>
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                      
                      <!-- Gradient -->
                      <linearGradient id="grad${count}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    
                    <!-- Outer soft glow -->
                    <circle cx="30" cy="30" r="26" fill="${colors.primary}" opacity="0.1"/>
                    
                    <!-- Main circle with gradient -->
                    <circle cx="30" cy="30" r="22" fill="url(#grad${count})" 
                            stroke="#ffffff" stroke-width="4" 
                            filter="url(#clusterShadow)"/>
                    
                    <!-- Sayı - Bold ve Net -->
                    <text x="30" y="37" text-anchor="middle" 
                          font-size="18" font-weight="900" 
                          fill="#ffffff" 
                          style="paint-order: stroke; stroke: ${colors.secondary}; stroke-width: 3px; stroke-opacity: 0.3">
                      ${count}
                    </text>
                  </svg>
                `;
                
                return new window.google.maps.Marker({
                  position,
                  icon: {
                    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
                    scaledSize: new window.google.maps.Size(60, 60),
                    anchor: new window.google.maps.Point(30, 30),
                  },
                  zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
                });
              },
            }
          });
        } else {
          markers.forEach((m: any) => m.setMap(map));
        }

        // Haritayı tüm marker'ları gösterecek şekilde ayarla
        if (!bounds.isEmpty()) {
          if (points.length === 1) {
            map.setCenter(bounds.getCenter());
            map.setZoom(12);
          } else {
            map.fitBounds(bounds, 50);
          }
        }

        // CSS animasyon ekle
        if (!document.getElementById('map-animations')) {
          const style = document.createElement('style');
          style.id = 'map-animations';
          style.textContent = `
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(-5px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `;
          document.head.appendChild(style);
        }

      } catch (error) {
        console.error('MiniClusterMap error:', error);
      }
    };

    init();
  }, [points, mapType]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg shadow-md" />;
};

export default MiniClusterMap;
