/**
 * 🔔 PUSH NOTIFICATION SERVICE
 * iOS ve Web için tam entegre push notification sistemi
 * Saha bazlı bildirim filtreleme ile
 */

import { Capacitor } from '@capacitor/core';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Push Notification için platform tipi
 */
type PushPlatform = 'ios' | 'web' | 'unknown';

/**
 * Push Notification Service
 */
export class PushNotificationService {
  private static instance: PushNotificationService;
  private initialized: boolean = false;
  private currentToken: string | null = null;
  private platform: PushPlatform = 'unknown';

  private constructor() {}

  /**
   * Singleton instance
   */
  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Push notification sistemini başlat
   */
  async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('✅ Push notifications zaten başlatıldı');
      return true;
    }

    try {
      console.log('🔔 Push Notification Service başlatılıyor...');

      if (Capacitor.isNativePlatform()) {
        // iOS/Android Native Platform
        return await this.initializeNative();
      } else {
        // Web Platform
        return await this.initializeWeb();
      }
    } catch (error) {
      console.error('❌ Push notification başlatma hatası:', error);
      return false;
    }
  }

  /**
   * iOS Native push notifications başlat - KRİTİK: Her login'de fresh token al
   */
  private async initializeNative(): Promise<boolean> {
    try {
      console.log('📱 iOS Push Notifications başlatılıyor...');

      // Capacitor Firebase Messaging kullan
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      // KRİTİK: Önce mevcut permission durumunu kontrol et
      console.log('📱 iOS: Mevcut permission durumu kontrol ediliyor...');
      let permissionResult = await FirebaseMessaging.checkPermissions();
      console.log('📱 iOS: Mevcut permission:', permissionResult);

      // Eğer permission denied veya prompt ise, yeniden iste
      if (permissionResult.receive !== 'granted') {
        console.log('📱 iOS: Bildirim izni isteniyor...');
        permissionResult = await FirebaseMessaging.requestPermissions();
      } else {
        console.log('✅ iOS: Bildirim izni zaten var');
      }

      if (permissionResult.receive === 'granted') {
        console.log('✅ iOS: Bildirim izni verildi');

        // KRİTİK: Her zaman fresh token al
        console.log('📱 iOS: FCM Token alınıyor (fresh)...');
        const { token } = await FirebaseMessaging.getToken();

        if (token) {
          this.currentToken = token;
          this.platform = 'ios';
          this.initialized = true;

          console.log('✅ iOS FCM Token alındı:', token.substring(0, 30) + '...');

          // Token değişikliklerini dinle
          await FirebaseMessaging.addListener('tokenReceived', async (event) => {
            console.log('🔄 iOS: Yeni FCM Token alındı:', event.token.substring(0, 30) + '...');
            this.currentToken = event.token;
          });

          // Notification listener'ları ekle
          await this.setupNativeListeners();

          return true;
        } else {
          console.error('❌ iOS: FCM Token alınamadı');
          return false;
        }
      } else {
        console.error('❌ iOS: Bildirim izni reddedildi');
        return false;
      }
    } catch (error) {
      console.error('❌ iOS push notification başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Web push notifications başlat
   */
  private async initializeWeb(): Promise<boolean> {
    try {
      console.log('🌐 Web Push Notifications başlatılıyor...');

      // Service Worker desteği kontrol et
      if (!('serviceWorker' in navigator)) {
        console.error('❌ Service Worker desteklenmiyor');
        return false;
      }

      // Notification desteği kontrol et
      if (!('Notification' in window)) {
        console.error('❌ Web Notifications desteklenmiyor');
        return false;
      }

      // Firebase Messaging
      const { getMessaging, getToken, onMessage, isSupported } = await import('firebase/messaging');

      // FCM destekleniyormu kontrol et
      const supported = await isSupported();
      if (!supported) {
        console.error('❌ FCM bu tarayıcıda desteklenmiyor');
        return false;
      }

      // İzin iste
      console.log('🌐 Web: Bildirim izni isteniyor...');
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('✅ Web: Bildirim izni verildi');

        // Service Worker'ı kaydet
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker kaydedildi');

        const messaging = getMessaging();

        // VAPID Key - Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
        const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
        
        if (!vapidKey) {
          console.error('❌ VAPID key bulunamadı! .env dosyasında VITE_FIREBASE_VAPID_KEY tanımlı olmalı');
          return false;
        }

        // FCM Token al
        console.log('🌐 Web: FCM Token alınıyor...');
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          this.currentToken = token;
          this.platform = 'web';
          this.initialized = true;

          console.log('✅ Web FCM Token alındı:', token.substring(0, 30) + '...');

          // Token'ı localStorage'a kaydet
          localStorage.setItem('web_fcm_token', token);

          // Foreground mesajları dinle
          onMessage(messaging, (payload) => {
            console.log('🔔 Web: Foreground mesaj alındı:', payload);
            this.handleForegroundMessage(payload);
          });

          return true;
        } else {
          console.error('❌ Web: FCM Token alınamadı');
          return false;
        }
      } else {
        console.error('❌ Web: Bildirim izni reddedildi');
        return false;
      }
    } catch (error) {
      console.error('❌ Web push notification başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Native listener'ları kur
   */
  private async setupNativeListeners(): Promise<void> {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    // Notification alındığında
    await FirebaseMessaging.addListener('notificationReceived', (event) => {
      console.log('🔔 iOS: Notification alındı:', event.notification);
    });

    // Notification'a tıklandığında
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      console.log('👆 iOS: Notification tıklandı:', event);
      const data = event.notification.data;
      
      // Deep link yönlendirmesi
      if (data && data.screen) {
        window.location.href = data.screen;
      }
    });
  }

  /**
   * Web foreground mesajı handle et
   */
  private handleForegroundMessage(payload: any): void {
    console.log('🔔 Web Foreground Mesaj:', payload);

    const notificationTitle = payload.notification?.title || 'Solarveyo';
    const notificationOptions = {
      body: payload.notification?.body || 'Yeni bildirim',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data,
      tag: payload.data?.notificationId || 'default',
      requireInteraction: false
    };

    // Browser notification göster
    if (Notification.permission === 'granted') {
      const notification = new Notification(notificationTitle, notificationOptions);
      
      notification.onclick = () => {
        window.focus();
        if (payload.data?.screen) {
          window.location.href = payload.data.screen;
        }
        notification.close();
      };
    }
  }

  /**
   * Token'ı Firestore'a kaydet
   */
  async saveTokenToFirestore(userId: string, userProfile?: any): Promise<boolean> {
    console.log('💾 saveTokenToFirestore çağrıldı - Token durumu:', {
      hasToken: !!this.currentToken,
      tokenLength: this.currentToken?.length || 0,
      platform: this.platform
    });
    
    if (!this.currentToken) {
      console.log('❌ Token bulunamadı, kaydetme atlanıyor');
      // KRİTİK: Token yoksa yeniden almayı dene
      console.log('🔄 Token yok - yeniden alma deneniyor...');
      await this.initialize(); // Token refresh için
      
      if (!this.currentToken) {
        console.error('❌ Token refresh başarısız');
        return false;
      }
    }

    try {
      console.log(`💾 Token Firestore'a kaydediliyor (${this.platform})...`);

      // pushTokens objesi oluştur
      const pushTokensUpdate: any = {
        fcm: this.currentToken,
        platform: this.platform,
        updatedAt: serverTimestamp()
      };

      // Kullanıcı verilerini güncelle
      await updateDoc(doc(db, 'kullanicilar', userId), {
        pushTokens: pushTokensUpdate,
        fcmToken: this.currentToken, // Geriye dönük uyumluluk için
        pushNotificationsEnabled: true,
        tokenUpdatedAt: serverTimestamp()
      });

      console.log('✅ Token Firestore\'a kaydedildi');
      console.log('   Platform:', this.platform);
      console.log('   Token preview:', this.currentToken.substring(0, 30) + '...');
      
      return true;
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
      return false;
    }
  }

  /**
   * Kullanıcı giriş yaptığında çağrıl - KRİTİK: Her login'de fresh token al
   */
  async onUserLogin(userId: string, userProfile?: any): Promise<void> {
    console.log('🔔 PushNotificationService: Kullanıcı giriş yaptı (userId:', userId, ')');

    try {
      console.log('🔔 PushNotificationService: initialized status:', this.initialized);
      
      // KRİTİK: Her login'de sistemi yeniden başlat (fresh token için)
      console.log('🔔 PushNotificationService: Sistem yeniden başlatılıyor (fresh token)...');
      this.initialized = false; // Force re-init
      const success = await this.initialize();
      if (!success) {
        console.error('❌ Push notification sistemi başlatılamadı');
        return;
      }
      console.log('✅ Push notification sistemi başlatıldı');

      console.log('🔔 PushNotificationService: Token durumu:', {
        currentToken: this.currentToken ? 'Var' : 'Yok',
        tokenLength: this.currentToken?.length,
        platform: this.platform
      });

      // Token'ı kaydet
      const saved = await this.saveTokenToFirestore(userId, userProfile);
      if (saved) {
        console.log('🎉 Push notifications kullanıcı için aktif! Token kaydedildi.');
      } else {
        console.error('❌ Token kaydetme başarısız - FCM token yok mu?');
      }
    } catch (error) {
      console.error('❌ Push notification login hatası:', error);
    }
  }

  /**
   * Kullanıcı çıkış yaptığında çağrıl - KRİTİK: Tüm token'ları temizle
   */
  async onUserLogout(userId?: string): Promise<void> {
    console.log('🔔 PushNotificationService: Kullanıcı çıkış yapıyor, tokenlar temizleniyor...');
    
    try {
      // Firestore'dan kullanıcının FCM token'ını temizle
      if (userId) {
        console.log('🗑️ Firestore FCM token temizleniyor...');
        const userRef = doc(db, 'kullanicilar', userId);
        await updateDoc(userRef, {
          fcmToken: null,
          pushTokens: null,
          pushNotificationsEnabled: false,
          tokenUpdatedAt: serverTimestamp()
        });
        console.log('✅ Firestore FCM token temizlendi');
      }
      
      // Yerel token'ı temizle
      this.currentToken = null;
      
      // Platform bazlı temizlik
      if (Capacitor.isNativePlatform()) {
        // iOS için Capacitor Preferences'tan token'ı sil
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key: 'fcm_token' });
          await Preferences.remove({ key: 'push_enabled' });
          console.log('✅ iOS: FCM token Preferences\'tan temizlendi');
        } catch (error) {
          console.error('❌ iOS FCM token temizleme hatası:', error);
        }
      } else {
        // Web için localStorage temizle
        localStorage.removeItem('web_fcm_token');
        localStorage.removeItem('push_permission');
        console.log('✅ Web: FCM token localStorage\'tan temizlendi');
      }
      
      console.log('🎉 Push notification logout temizliği tamamlandı');
    } catch (error) {
      console.error('❌ Push notification logout temizlik hatası:', error);
    }
  }

  /**
   * Mevcut token'ı getir
   */
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  /**
   * Platform bilgisini getir
   */
  getPlatform(): PushPlatform {
    return this.platform;
  }

  /**
   * Sistem başlatıldı mı?
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const pushNotificationService = PushNotificationService.getInstance();

/**
 * 🎯 KULLANIM:
 * 
 * 1. App.tsx veya main.tsx'de başlat:
 *    await pushNotificationService.initialize();
 * 
 * 2. Kullanıcı giriş yaptığında:
 *    await pushNotificationService.onUserLogin(userId, userProfile);
 * 
 * 3. Kullanıcı çıkış yaptığında:
 *    await pushNotificationService.onUserLogout();
 * 
 * 4. Token kontrolü:
 *    const token = pushNotificationService.getCurrentToken();
 *    const platform = pushNotificationService.getPlatform();
 */

