/**
 * Web Push Notification Servisi
 * Web tarayıcısı için FCM token yönetimi
 */

import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const VAPID_KEY = 'BH8Q9Z-1234567890abcdef...'; // VAPID key eklenecek

export class WebPushService {
  private static messaging: any = null;
  private static initialized = false;

  /**
   * Web Push'u başlat
   */
  static async initialize() {
    if (typeof window === 'undefined') {
      console.log('🌐 Web Push: Server side, atlanıyor');
      return;
    }

    if (this.initialized) {
      console.log('🌐 Web Push: Zaten başlatıldı');
      return;
    }

    try {
      console.log('🌐 Web Push: Başlatılıyor...');
      
      // Service Worker'ı kontrol et
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('✅ Service Worker kayıtlı:', registration.scope);
      }

      // Firebase Messaging'i başlat
      this.messaging = getMessaging();
      
      // Bildirim izni iste
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('⚠️ Web Push: Bildirim izni reddedildi');
        return;
      }

      console.log('✅ Web Push: Bildirim izni alındı');
      this.initialized = true;
      
    } catch (error) {
      console.error('❌ Web Push başlatma hatası:', error);
    }
  }

  /**
   * Web FCM Token'ı al
   */
  static async getWebToken(): Promise<string | null> {
    try {
      if (!this.messaging) {
        await this.initialize();
      }

      if (!this.messaging) {
        console.log('❌ Web Push: Messaging başlatılamadı');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: VAPID_KEY
      });

      if (token) {
        console.log('🌐 Web FCM Token alındı:', token.substring(0, 50) + '...');
        return token;
      } else {
        console.log('⚠️ Web FCM Token alınamadı');
        return null;
      }
    } catch (error) {
      console.error('❌ Web FCM Token alma hatası:', error);
      return null;
    }
  }

  /**
   * Kullanıcı için web token'ı kaydet
   */
  static async setUser(userId: string) {
    try {
      const webToken = await this.getWebToken();
      
      if (!webToken) {
        console.log('❌ Web token alınamadı, kaydetme atlanıyor');
        return;
      }

      console.log('💾 Web FCM Token kaydediliyor...');
      
      await updateDoc(doc(db, 'kullanicilar', userId), {
        pushTokens: {
          fcm: webToken,
          platform: 'web'
        },
        pushNotificationsEnabled: true,
        pushTokenUpdatedAt: serverTimestamp()
      });
      
      console.log('✅ Web FCM Token Firestore\'a kaydedildi');
      
    } catch (error) {
      console.error('❌ Web token kaydetme hatası:', error);
    }
  }

  /**
   * Foreground mesajlarını dinle
   */
  static setupForegroundListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload) => {
      console.log('🔔 Web Push alındı:', payload);
      
      // Custom notification göster
      if (payload.notification) {
        new Notification(payload.notification.title || 'Bildirim', {
          body: payload.notification.body,
          icon: '/favicon.svg'
        });
      }
    });
  }
}
