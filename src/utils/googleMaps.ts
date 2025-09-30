// Google Maps Utilities

export interface GoogleMapsConfig {
  apiKey: string;
  zoom?: number;
  mapType?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
}

export interface Coordinates {
  lat: number;
  lng: number;
}

// Environment'dan Google Maps API Key'i al
// iOS için ayrı key kullanabilirsiniz
export const getGoogleMapsApiKey = (): string => {
  // Platform kontrolü
  const isIOS = window.location.protocol === 'capacitor:' || 
                (window.location.protocol === 'https:' && window.location.hostname === 'localhost');
  
  // iOS için direkt key kullan, web için env'den al
  if (isIOS) {
    return 'AIzaSyBzuuTRlWJAj292Py1iJdG349LRrU5XoEc';
  }
  
  // Web için environment variable'dan al
  const webApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBrlyyV7X54-Ysk338vXmLDdidimSHIeMI';
  return webApiKey;
};

// Google Maps URL'leri oluştur
export const generateGoogleMapsUrls = (coordinates: Coordinates, title?: string) => {
  const { lat, lng } = coordinates;
  const encodedTitle = title ? encodeURIComponent(title) : '';
  
  return {
    // Haritada görüntüleme URL'i
    viewUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}${encodedTitle ? `&query_place_id=${encodedTitle}` : ''}`,
    
    // Yön tarifi URL'i
    directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    
    // Embed URL'i (iframe için)
    embedUrl: (apiKey: string, zoom: number = 15, mapType: string = 'roadmap') => 
      apiKey ? 
        `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=${zoom}&maptype=${mapType}` :
        null,
    
    // Static Map URL'i (resim için)
    staticMapUrl: (apiKey: string, width: number = 400, height: number = 300, zoom: number = 15, mapType: 'roadmap' | 'satellite' | 'terrain' | 'hybrid' = 'roadmap') =>
      apiKey ?
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&maptype=${mapType}&size=${width}x${height}&markers=color:red%7C${lat},${lng}&key=${apiKey}` :
        null
  };
};

// Koordinat validasyonu
export const validateCoordinates = (lat: number, lng: number): boolean => {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    lat !== 0 && lng !== 0
  );
};

// Adres arama (Geocoding) - sadece API key varsa
export const searchAddress = async (address: string): Promise<Coordinates | null> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    console.warn('Google Maps API Key olmadan adres arama yapılamaz.');
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }
    
    return null;
  } catch (error) {
    console.error('Adres arama hatası:', error);
    return null;
  }
};

// Reverse Geocoding - koordinatları adrese çevir
export const getAddressFromCoordinates = async (coordinates: Coordinates): Promise<string | null> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    console.warn('Google Maps API Key olmadan reverse geocoding yapılamaz.');
    return null;
  }

  try {
    const { lat, lng } = coordinates;
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }
    
    return null;
  } catch (error) {
    console.error('Reverse geocoding hatası:', error);
    return null;
  }
};

// İki nokta arası mesafe hesaplama (Haversine formülü)
export const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
  const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(point1.lat * (Math.PI / 180)) * Math.cos(point2.lat * (Math.PI / 180)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // 2 ondalık basamak
};

// Türkiye'nin başlıca şehir koordinatları
export const TURKEY_CITIES = {
  'Ankara': { lat: 39.9334, lng: 32.8597 },
  'İstanbul': { lat: 41.0082, lng: 28.9784 },
  'İzmir': { lat: 38.4192, lng: 27.1287 },
  'Bursa': { lat: 40.1826, lng: 29.0665 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Adana': { lat: 37.0000, lng: 35.3213 },
  'Konya': { lat: 37.8667, lng: 32.4833 },
  'Gaziantep': { lat: 37.0662, lng: 37.3833 },
  'Kayseri': { lat: 38.7312, lng: 35.4787 },
  'Eskişehir': { lat: 39.7767, lng: 30.5206 }
} as const;

export type TurkishCity = keyof typeof TURKEY_CITIES;
