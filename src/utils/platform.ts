import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * Platform detection utility for Capacitor
 * Mobil ve web platformlarını ayırt etmek için kullanılır
 */
export const platform = {
  /**
   * Native platform (iOS/Android) kontrolü
   */
  isNative: () => Capacitor.isNativePlatform(),
  
  /**
   * Web platform kontrolü
   */
  isWeb: () => !Capacitor.isNativePlatform(),
  
  /**
   * iOS platform kontrolü
   */
  isIOS: () => Capacitor.getPlatform() === 'ios',
  
  /**
   * Android platform kontrolü
   */
  isAndroid: () => Capacitor.getPlatform() === 'android',
  
  /**
   * Cihaz bilgilerini al
   */
  async getInfo() {
    if (this.isNative()) {
      try {
        return await Device.getInfo();
      } catch (error) {
        console.error('Cihaz bilgileri alınamadı:', error);
        return null;
      }
    }
    return null;
  },
  
  /**
   * Platform adını döndür
   */
  getPlatformName: () => {
    const platformName = Capacitor.getPlatform();
    switch(platformName) {
      case 'ios':
        return 'iOS';
      case 'android':
        return 'Android';
      case 'web':
        return 'Web';
      default:
        return 'Unknown';
    }
  }
};
