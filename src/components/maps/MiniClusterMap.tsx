import React, { useEffect, useRef } from 'react';
import { getGoogleMapsApiKey } from '../../utils/googleMaps';

// Harita noktası tipi: başlık, alt başlık, durum ve detay adresi opsiyoneldir
type Point = {
  lat: number;
  lng: number;
  title?: string;
  subtitle?: string;
  // Durum; ikon rengi bu alana göre belirlenir
  status?: 'normal' | 'bakim' | 'ariza';
  // Detay sayfası URL'i (yeni sekmede açılır)
  url?: string;
  // InfoWindow içinde gösterilecek etiket-değer detayları
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
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Script yüklenemedi: ' + src));
    document.head.appendChild(s);
  });
};

const waitForGoogleMaps = (timeoutMs: number = 7000) => {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('Google Maps yüklenemedi.'));
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });
};

export const MiniClusterMap: React.FC<{ points: Point[]; mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'; height?: number }> = ({ points, mapType = 'terrain', height = 260 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      // API key kontrolünü kaldır, HTML'de zaten yükleniyor
      if (points.length === 0) return;

      try {
        // Google Maps yüklenene kadar bekle
        if (!window.google || !window.google.maps) {
          await waitForGoogleMaps();
        }
        
        // MarkerClusterer'ı yükle
        await loadScript('https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js');

      // Harita oluştur
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

      // Duruma göre renk üret
      const getColorByStatus = (status?: 'normal' | 'bakim' | 'ariza') => {
        if (status === 'ariza') return '#ef4444';
        if (status === 'bakim') return '#f59e0b';
        return '#2563eb';
      };

      // Profesyonel 3D güneş paneli marker (pin yok, direkt panel)
      const createProminentPanelPin = (statusColor: string, status?: 'normal' | 'bakim' | 'ariza') => {
        // Durum renkleri
        const glowColor = status === 'ariza' ? '#ef4444' : status === 'bakim' ? '#f59e0b' : '#10b981';
        const borderColor = status === 'ariza' ? '#dc2626' : status === 'bakim' ? '#d97706' : '#059669';
        
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Güçlü gölge efekti -->
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
      <feOffset dx="0" dy="2" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.5"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    
    <!-- Panel yüzey gradient -->
    <linearGradient id="panelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1e3a8a;stop-opacity:1" />
    </linearGradient>
    
    <!-- Parlama efekti -->
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0" />
      <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.4" />
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
    </linearGradient>
    
    <!-- Durum glow -->
    <filter id="statusGlow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- Arka plan glow (durum rengi) -->
  <circle cx="24" cy="24" r="18" fill="${glowColor}" opacity="0.15"/>
  
  <!-- 3D Panel gölgesi -->
  <rect x="8" y="18" width="32" height="20" rx="2" fill="#000000" opacity="0.15" transform="translate(1, 1)"/>
  
  <!-- Ana panel çerçevesi -->
  <rect x="8" y="18" width="32" height="20" rx="2" 
        fill="${borderColor}" 
        stroke="#ffffff" 
        stroke-width="2" 
        filter="url(#shadow)"/>
  
  <!-- Panel yüzeyi -->
  <rect x="10" y="20" width="28" height="16" rx="1.5" 
        fill="url(#panelGradient)" 
        stroke="${borderColor}" 
        stroke-width="1"/>
  
  <!-- Solar hücreleri - 4x3 grid -->
  <!-- Üst sıra -->
  <rect x="12" y="22" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="19" y="22" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="26" y="22" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="33" y="22" width="3" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  
  <!-- Orta sıra -->
  <rect x="12" y="27.5" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="19" y="27.5" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="26" y="27.5" width="6" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="33" y="27.5" width="3" height="4.5" rx="0.5" fill="#3b82f6" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  
  <!-- Alt sıra -->
  <rect x="12" y="33" width="6" height="2" rx="0.5" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="19" y="33" width="6" height="2" rx="0.5" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="26" y="33" width="6" height="2" rx="0.5" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  <rect x="33" y="33" width="3" height="2" rx="0.5" fill="#60a5fa" stroke="#1e40af" stroke-width="0.5" opacity="0.9"/>
  
  <!-- Panel üzerinde parlama efekti -->
  <rect x="10" y="20" width="28" height="6" rx="1.5" fill="url(#shine)" opacity="0.3"/>
  
  <!-- Güneş ikonu (küçük, sol üst köşe) -->
  <g transform="translate(6, 12)">
    <circle cx="6" cy="6" r="3" fill="#fbbf24" stroke="#f59e0b" stroke-width="1"/>
    <circle cx="6" cy="6" r="1.5" fill="#fef3c7"/>
    <!-- Işınlar -->
    <line x1="6" y1="0" x2="6" y2="2" stroke="#f59e0b" stroke-width="0.8" stroke-linecap="round"/>
    <line x1="6" y1="10" x2="6" y2="12" stroke="#f59e0b" stroke-width="0.8" stroke-linecap="round"/>
    <line x1="0" y1="6" x2="2" y2="6" stroke="#f59e0b" stroke-width="0.8" stroke-linecap="round"/>
    <line x1="10" y1="6" x2="12" y2="6" stroke="#f59e0b" stroke-width="0.8" stroke-linecap="round"/>
  </g>
  
  <!-- Durum göstergesi (sağ üst küçük daire) -->
  <circle cx="40" cy="14" r="5" fill="${glowColor}" stroke="#ffffff" stroke-width="2" filter="url(#statusGlow)"/>
  <text x="40" y="17.5" text-anchor="middle" font-size="8" font-weight="bold" fill="#ffffff">${
    status === 'ariza' ? '!' : status === 'bakim' ? '⚙' : '✓'
  }</text>
</svg>`;
        const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        return {
          url,
          scaledSize: new window.google.maps.Size(48, 48),
          anchor: new window.google.maps.Point(24, 28),
        };
      };

      const infoWindow = new window.google.maps.InfoWindow();

      // Marker'ları oluştur ve sınırları hesapla
      const bounds = new window.google.maps.LatLngBounds();
      const markers = points.map((p) => {
        const position = { lat: p.lat, lng: p.lng };
        const marker = new window.google.maps.Marker({
          position,
          title: p.title,
          icon: createProminentPanelPin(getColorByStatus(p.status), p.status),
          optimized: false, // Daha iyi render kalitesi için
        });

        if (p.status === 'ariza') {
          marker.setZIndex((window as any).google.maps.Marker.MAX_ZINDEX + 1);
        }

        bounds.extend(position);

        marker.addListener('click', () => {
          const safeTitle = p.title ?? 'Saha';
          
          // Durum badge'i
          const statusBadge = p.status 
            ? `<span style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;margin-left:8px;background:${
                p.status === 'ariza' ? '#fee2e2;color:#991b1b' : 
                p.status === 'bakim' ? '#fef3c7;color:#92400e' : 
                '#d1fae5;color:#065f46'
              }">${
                p.status === 'ariza' ? '⚠️ Arızalı' : 
                p.status === 'bakim' ? '🔧 Bakımda' : 
                '✓ Normal'
              }</span>` 
            : '';
          
          const subtitle = p.subtitle 
            ? `<div style="color:#64748b;font-size:13px;margin-top:6px;display:flex;align-items:center"><svg style="width:14px;height:14px;margin-right:4px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>${p.subtitle}</div>` 
            : '';
          
          const list = (p.details && p.details.length > 0)
            ? `<div style="margin:12px 0;padding:12px;background:#f8fafc;border-radius:8px;border-left:3px solid #2563eb">
                <div style="display:grid;grid-template-columns:1fr;gap:8px">
                  ${p.details.map((d) => 
                    `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
                      <span style="color:#64748b;font-size:12px;font-weight:500">${d.label}</span>
                      <span style="font-weight:600;color:#0f172a;font-size:13px">${d.value}</span>
                    </div>`
                  ).join('')}
                </div>
              </div>`
            : '';
          
          const detail = p.url 
            ? `<a href="${p.url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:8px 14px;background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;box-shadow:0 2px 4px rgba(37,99,235,0.2);transition:all 0.2s">
                <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                Detaya Git
              </a>` 
            : '';
          
          const direction = `<a href="https://www.google.com/maps?daddr=${p.lat},${p.lng}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;padding:8px 14px;background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);color:#fff;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500;box-shadow:0 2px 4px rgba(14,165,233,0.2);transition:all 0.2s">
              <svg style="width:14px;height:14px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Yol Tarifi
            </a>`;
          
          const content = `
            <div style="min-width:260px;max-width:320px;padding:4px">
              <div style="display:flex;align-items:center;margin-bottom:8px">
                <svg style="width:20px;height:20px;margin-right:8px;color:#2563eb" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                </svg>
                <span style="font-weight:700;font-size:16px;color:#0f172a">${safeTitle}</span>
                ${statusBadge}
              </div>
              ${subtitle}
              ${list}
              <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
                ${detail}
                ${direction}
              </div>
            </div>
          `;
          infoWindow.setContent(content);
          infoWindow.open({ anchor: marker, map });
        });

        return marker;
      });

      // Kümelendirme veya tekil gösterim
      if (window.markerClusterer && window.markerClusterer.MarkerClusterer) {
        // eslint-disable-next-line new-cap
        new window.markerClusterer.MarkerClusterer({ map, markers });
      } else {
        markers.forEach((m: any) => m.setMap(map));
      }

      // Tüm noktaları ekrana sığdır
      if (!bounds.isEmpty()) {
        if (points.length === 1) {
          map.setCenter(bounds.getCenter());
          map.setZoom(10);
        } else {
          map.fitBounds(bounds, 48);
        }
      }
      } catch (error) {
        console.error('MiniClusterMap error:', error);
        // Hata durumunda boş div göster
      }
    };

    init();
  }, [points, mapType, height]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg" />;
};

export default MiniClusterMap;


