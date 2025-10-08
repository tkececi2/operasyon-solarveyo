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

      // Vurgulu pin + panel ikonu + renkli halo (yüksek görünürlük)
      const createProminentPanelPin = (statusColor: string) => {
        const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Halo -->
  <circle cx="22" cy="22" r="16" fill="${statusColor}" opacity="0.2"/>
  <!-- Klasik pin -->
  <path d="M22 4c-6.1 0-11 4.9-11 11 0 8.6 8.9 14.6 10.5 20.3.2.7.8.7 1 0C24.1 29.6 33 23.6 33 15 33 8.9 28.1 4 22 4z" fill="${statusColor}" stroke="#ffffff" stroke-width="2.6" filter="url(#shadow)"/>
  <!-- İç daire arkaplan -->
  <circle cx="22" cy="15.5" r="6.6" fill="#ffffff"/>
  <!-- İçeride minyatür panel ikonu -->
  <g transform="translate(15,10)">
    <polygon points="1,9 13,7 13,12 1,14" fill="#2563eb" stroke="#1e40af" stroke-width="0.8" />
    <line x1="2.5" y1="9.5" x2="2.5" y2="13.5" stroke="#fff" stroke-width="0.8" stroke-opacity="0.9" />
    <line x1="5.5" y1="9" x2="5.5" y2="13" stroke="#fff" stroke-width="0.8" stroke-opacity="0.9" />
    <line x1="8.5" y1="8.5" x2="8.5" y2="12.5" stroke="#fff" stroke-width="0.8" stroke-opacity="0.9" />
    <line x1="1" y1="11.8" x2="13" y2="9.8" stroke="#fff" stroke-width="0.8" stroke-opacity="0.9" />
  </g>
</svg>`;
        const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
        return {
          url,
          scaledSize: new window.google.maps.Size(44, 44),
          anchor: new window.google.maps.Point(22, 42),
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
          icon: createProminentPanelPin(getColorByStatus(p.status)),
        });

        if (p.status === 'ariza') {
          marker.setZIndex((window as any).google.maps.Marker.MAX_ZINDEX + 1);
        }

        bounds.extend(position);

        marker.addListener('click', () => {
          const safeTitle = p.title ?? 'Saha';
          const subtitle = p.subtitle ? `<div style="color:#64748b;margin-top:2px">${p.subtitle}</div>` : '';
          const list = (p.details && p.details.length > 0)
            ? `<ul style="margin:8px 0;padding:0;list-style:none;display:grid;grid-template-columns:1fr;gap:4px">${p.details
                .map((d) => `<li style=\"display:flex;justify-content:space-between;gap:8px\"><span style=\"color:#64748b\">${d.label}</span><span style=\"font-weight:600;color:#111827\">${d.value}</span></li>`)
                .join('')}</ul>`
            : '';
          const detail = p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="padding:6px 10px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Detaya Git</a>` : '';
          const direction = `<a href="https://www.google.com/maps?daddr=${p.lat},${p.lng}" target="_blank" rel="noopener" style="padding:6px 10px;background:#0ea5e9;color:#fff;border-radius:6px;text-decoration:none">Yol Tarifi</a>`;
          const content = `<div style="min-width:240px;max-width:280px">\n<div style="font-weight:600">${safeTitle}</div>${subtitle}${list}\n<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">${detail}${direction}</div>\n</div>`;
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


