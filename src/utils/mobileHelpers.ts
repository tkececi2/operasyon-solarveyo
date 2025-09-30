import { platform } from './platform';

/**
 * Mobil uyumluluk için yardımcı fonksiyonlar
 */

/**
 * Platform bazlı class name döndürür
 */
export function getPlatformClass(baseClass: string = ''): string {
  const classes = [baseClass];
  
  if (platform.isNative()) {
    classes.push('is-mobile');
    
    if (platform.isIOS()) {
      classes.push('is-ios');
    } else if (platform.isAndroid()) {
      classes.push('is-android');
    }
  } else {
    classes.push('is-web');
  }
  
  return classes.filter(Boolean).join(' ');
}

/**
 * Safe area inset değerlerini döndürür (iOS için)
 */
export function getSafeAreaInsets() {
  if (!platform.isIOS()) {
    return {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    };
  }
  
  // CSS environment variables kullan
  return {
    top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)') || '0')
  };
}

/**
 * Mobil cihazda mı kontrolü (viewport bazlı)
 */
export function isMobileViewport(): boolean {
  return window.innerWidth < 768;
}

/**
 * Tablet cihazda mı kontrolü
 */
export function isTabletViewport(): boolean {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Touch device kontrolü
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Haptic feedback tetikle (native platformlarda)
 */
export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if (!platform.isNative()) return;
  
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    
    const style = type === 'light' ? ImpactStyle.Light :
                  type === 'medium' ? ImpactStyle.Medium :
                  ImpactStyle.Heavy;
    
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Haptic feedback hatası:', error);
  }
}

/**
 * Platform bazlı scroll behavior
 */
export function smoothScroll(element: HTMLElement | null, options?: ScrollIntoViewOptions) {
  if (!element) return;
  
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: platform.isNative() ? 'auto' : 'smooth',
    block: 'start',
    inline: 'nearest',
    ...options
  };
  
  element.scrollIntoView(defaultOptions);
}

/**
 * Input focus için klavye yönetimi (mobile için)
 */
export function handleMobileKeyboard(show: boolean) {
  if (!platform.isNative()) return;
  
  if (show) {
    // Klavye açıldığında viewport'u ayarla
    document.body.classList.add('keyboard-open');
  } else {
    // Klavye kapandığında viewport'u eski haline getir
    document.body.classList.remove('keyboard-open');
  }
}

/**
 * Platform bazlı date input type
 */
export function getDateInputType(): string {
  // iOS ve Android native date picker kullanır
  return platform.isNative() ? 'datetime-local' : 'datetime-local';
}

/**
 * Platform bazlı file input accept
 */
export function getImageAcceptTypes(): string {
  // iOS için HEIC desteği ekle
  if (platform.isIOS()) {
    return 'image/*,.heic,.heif';
  }
  return 'image/*';
}

/**
 * Mobil cihaz orientasyonunu al
 */
export function getOrientation(): 'portrait' | 'landscape' {
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
}

/**
 * Platform bazlı animasyon duration
 */
export function getAnimationDuration(): number {
  // Mobilde daha hızlı animasyonlar
  return platform.isNative() ? 200 : 300;
}

/**
 * Pull to refresh desteği kontrolü
 */
export function supportsPullToRefresh(): boolean {
  return platform.isNative() && !platform.isAndroid(); // Sadece iOS
}

/**
 * Swipe gesture threshold
 */
export function getSwipeThreshold(): number {
  return platform.isNative() ? 50 : 100;
}
