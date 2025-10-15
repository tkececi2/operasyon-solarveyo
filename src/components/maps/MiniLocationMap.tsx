import React, { useEffect, useRef } from 'react';

type MiniLocationMapProps = {
  lat: number;
  lng: number;
  status?: 'normal' | 'bakim' | 'ariza';
  variant?: 'ges' | 'guard';
  shiftType?: 'sabah' | 'ogle' | 'aksam' | 'gece';
  mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
  height?: number;
  zoom?: number;
  className?: string;
};

declare global {
  interface Window {
    google: any;
  }
}

const waitForGoogleMaps = () => {
  return new Promise((resolve) => {
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

// Dashboard'taki mini haritadaki ikon stiline benzer tekli marker
const createGESBuildingMarker = (status?: 'normal' | 'bakim' | 'ariza') => {
  const primaryColor = status === 'ariza' ? '#dc2626' :
                      status === 'bakim' ? '#ea580c' : '#0284c7';
  const secondaryColor = status === 'ariza' ? '#991b1b' :
                        status === 'bakim' ? '#9a3412' : '#075985';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="44" height="44" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="28" cy="50" rx="16" ry="3" fill="#00000015"/>
  <g>
    <path d="M 12 38 L 12 18 L 28 12 L 44 18 L 44 38 Z" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="1.5"/>
    <rect x="16" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.8"/>
    <rect x="22" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.8"/>
    <rect x="30" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.8"/>
    <rect x="36" y="22" width="4" height="4" rx="0.5" fill="#60a5fa" opacity="0.8"/>
    <rect x="24" y="33" width="8" height="5" rx="0.5" fill="${secondaryColor}"/>
  </g>
</svg>`;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return {
    url,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 40),
  };
};

const createGuardMarker = (
  status?: 'normal' | 'bakim' | 'ariza',
  shiftType?: 'sabah' | 'ogle' | 'aksam' | 'gece'
) => {
  const colors = status === 'ariza'
    ? { base: '#dc2626', dark: '#991b1b' }
    : status === 'bakim'
    ? { base: '#f59e0b', dark: '#92400e' }
    : { base: '#10b981', dark: '#065f46' };

  const shiftIcon = shiftType === 'sabah' ? '🌅' : shiftType === 'ogle' ? '☀️' : shiftType === 'aksam' ? '🌇' : shiftType === 'gece' ? '🌙' : '✓';

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="44" height="44" viewBox="0 0 56 56" xmlns="http://www.w3.org/2000/svg">
  <path d="M28 6c9 0 16 6.5 16 14.5 0 10.5-12 19.5-16 26.5-4-7-16-16-16-26.5C12 12.5 19 6 28 6z" fill="${colors.base}" stroke="#ffffff" stroke-width="3"/>
  <g transform="translate(16,16)">
    <circle cx="12" cy="12" r="10" fill="#0ea5e9" stroke="#0369a1" stroke-width="2"/>
    <path d="M3 10h18l-3-5H6l-3 5z" fill="#1e3a8a"/>
    <rect x="7" y="14" width="5" height="3" rx="1.5" fill="#111827"/>
    <rect x="13" y="14" width="5" height="3" rx="1.5" fill="#111827"/>
    <rect x="7" y="15.5" width="11" height="1" fill="#111827"/>
  </g>
  <circle cx="44" cy="10" r="7" fill="${colors.dark}" stroke="#ffffff" stroke-width="2.5"/>
  <text x="44" y="13" text-anchor="middle" font-size="10" font-weight="bold" fill="#ffffff">${shiftIcon}</text>
</svg>`;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  return {
    url,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 40),
  };
};

export const MiniLocationMap: React.FC<MiniLocationMapProps> = ({
  lat,
  lng,
  status,
  variant = 'guard',
  shiftType,
  mapType = 'satellite',
  height = 110,
  zoom = 12,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!lat || !lng) return;

      await waitForGoogleMaps();

      const map = new window.google.maps.Map(containerRef.current!, {
        center: { lat, lng },
        zoom,
        mapTypeId: mapType,
        disableDefaultUI: true,
        gestureHandling: 'none',
        draggable: false,
      });

      new window.google.maps.Marker({
        position: { lat, lng },
        map,
        icon: variant === 'guard' ? createGuardMarker(status, shiftType) : createGESBuildingMarker(status),
        optimized: true,
      });
    };

    init();
  }, [lat, lng, status, mapType, zoom]);

  return (
    <div ref={containerRef} style={{ height }} className={`w-full rounded-md overflow-hidden border border-gray-200 ${className || ''}`} />
  );
};

export default MiniLocationMap;


