import { Geolocation, Position } from '@capacitor/geolocation';
import { platform } from '../../utils/platform';

/**
 * Mobil konum servisi
 * Saha konum doğrulama ve takip için GPS erişimi
 */
export class MobileLocationService {
  /**
   * Mevcut konumu al
   */
  static async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    // Web platformu için fallback
    if (!platform.isNative()) {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation desteklenmiyor'));
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }),
          (error) => {
            console.error('Web konum hatası:', error);
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      });
    }
    
    try {
      // Native platform için Capacitor Geolocation kullan
      const coordinates: Position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      });
      
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude
      };
    } catch (error) {
      console.error('Native konum hatası:', error);
      throw error;
    }
  }
  
  /**
   * Konum takibini başlat
   */
  static async watchPosition(callback: (position: { latitude: number; longitude: number }) => void) {
    if (!platform.isNative()) {
      // Web için watch position
      if (navigator.geolocation) {
        return navigator.geolocation.watchPosition(
          (pos) => callback({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }),
          (error) => console.error('Web konum takip hatası:', error),
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        );
      }
      return null;
    }
    
    try {
      // Native platform için watch
      const watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        },
        (position, err) => {
          if (err) {
            console.error('Konum takip hatası:', err);
            return;
          }
          
          if (position) {
            callback({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        }
      );
      
      return watchId;
    } catch (error) {
      console.error('Native konum takip başlatma hatası:', error);
      throw error;
    }
  }
  
  /**
   * Konum takibini durdur
   */
  static async clearWatch(watchId: string | number | null) {
    if (!watchId) return;
    
    if (!platform.isNative()) {
      // Web için clear watch
      if (typeof watchId === 'number') {
        navigator.geolocation.clearWatch(watchId);
      }
      return;
    }
    
    try {
      // Native platform için clear watch
      if (typeof watchId === 'string') {
        await Geolocation.clearWatch({ id: watchId });
      }
    } catch (error) {
      console.error('Konum takibi durdurma hatası:', error);
    }
  }
  
  /**
   * İki konum arasındaki mesafeyi hesapla (Haversine formülü)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance; // km cinsinden mesafe
  }
  
  /**
   * Dereceyi radyana çevir
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  /**
   * Kullanıcının belirli bir konuma yakınlığını kontrol et
   */
  static async isNearLocation(
    targetLat: number,
    targetLon: number,
    maxDistanceKm: number = 0.1 // 100 metre
  ): Promise<boolean> {
    try {
      const currentPosition = await this.getCurrentPosition();
      if (!currentPosition) return false;
      
      const distance = this.calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        targetLat,
        targetLon
      );
      
      console.log(`Hedefe mesafe: ${distance.toFixed(2)} km`);
      return distance <= maxDistanceKm;
    } catch (error) {
      console.error('Yakınlık kontrolü hatası:', error);
      return false;
    }
  }
  
  /**
   * Konum izinlerini kontrol et
   */
  static async checkPermissions() {
    if (!platform.isNative()) {
      // Web için permission API kontrolü
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          return { location: result.state };
        } catch {
          return { location: 'prompt' };
        }
      }
      return { location: 'granted' };
    }
    
    try {
      const permissions = await Geolocation.checkPermissions();
      console.log('Konum izinleri:', permissions);
      return permissions;
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
      return { location: 'denied' };
    }
  }
  
  /**
   * Konum izinlerini iste
   */
  static async requestPermissions() {
    if (!platform.isNative()) {
      // Web için otomatik olarak getCurrentPosition çağrıldığında istenir
      return { location: 'prompt' };
    }
    
    try {
      const permissions = await Geolocation.requestPermissions();
      console.log('İzin sonucu:', permissions);
      return permissions;
    } catch (error) {
      console.error('İzin isteme hatası:', error);
      return { location: 'denied' };
    }
  }
  
  /**
   * Konum servislerinin açık olup olmadığını kontrol et
   */
  static async isLocationEnabled(): Promise<boolean> {
    if (!platform.isNative()) {
      return 'geolocation' in navigator;
    }
    
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 1000
      });
      return !!position;
    } catch (error: any) {
      // Konum servisleri kapalıysa hata verir
      if (error?.message?.includes('location services')) {
        return false;
      }
      // İzin yoksa da false dön
      return false;
    }
  }
}
