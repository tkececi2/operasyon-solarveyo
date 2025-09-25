import React, { useEffect, useRef } from 'react';
import { getAddressFromCoordinates, getGoogleMapsApiKey } from '../../utils/googleMaps';

type MapPickerProps = {
  value?: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  onAddress?: (address: string) => void;
  height?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
};

declare global {
  interface Window {
    google: any;
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

export const MapPicker: React.FC<MapPickerProps> = ({ value, onChange, onAddress, height = 260, mapType = 'roadmap' }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      const apiKey = getGoogleMapsApiKey();
      if (!apiKey) return;
      await loadScript(`https://maps.googleapis.com/maps/api/js?key=${apiKey}`);
      await waitForGoogleMaps();

      const defaultCenter = value ?? { lat: 39.925533, lng: 32.866287 }; // Ankara
      const map = new window.google.maps.Map(containerRef.current!, {
        center: defaultCenter,
        zoom: value ? 12 : 6,
        mapTypeId: mapType,
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: 'greedy',
      });
      mapRef.current = map;

      const placeMarker = (pos: { lat: number; lng: number }) => {
        if (!markerRef.current) {
          markerRef.current = new window.google.maps.Marker({
            position: pos,
            map,
            draggable: true,
          });
          markerRef.current.addListener('dragend', async () => {
            const p = markerRef.current.getPosition();
            const coords = { lat: p.lat(), lng: p.lng() };
            onChange(coords);
            if (onAddress) {
              const addr = await getAddressFromCoordinates(coords);
              if (addr) onAddress(addr);
            }
          });
        } else {
          markerRef.current.setPosition(pos);
        }
      };

      if (value) placeMarker(value);

      map.addListener('click', async (e: any) => {
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        placeMarker(coords);
        onChange(coords);
        if (onAddress) {
          const addr = await getAddressFromCoordinates(coords);
          if (addr) onAddress(addr);
        }
      });
    };

    init();
  }, [value, mapType, onChange, onAddress]);

  useEffect(() => {
    if (mapRef.current && value) {
      mapRef.current.setCenter(value);
    }
  }, [value]);

  return <div ref={containerRef} style={{ height }} className="w-full rounded-lg" />;
};

export default MapPicker;


