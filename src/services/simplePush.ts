/**
 * 🔔 SÜPER BASİT PUSH BİLDİRİM SİSTEMİ
 * Karmaşıklık yok, sadece çalışan kod!
 */

import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface SimplePushData {
  title: string;
  message: string;
  userId?: string;
  companyId?: string;
}

export class SimplePush {
  
  /**
   * iOS'tan FCM token al (sadece native)
   */
  static async getIOSToken(): Promise<string | null> {
    if (!Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      // iOS native'den token alma - Capacitor Preferences'tan
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: 'fcm_token' });
      
      if (value && value.length > 20) {
        console.log('✅ iOS FCM Token bulundu');
        return value;
      }
      
      console.log('❌ iOS FCM Token bulunamadı');
      return null;
    } catch (error) {
      console.error('❌ iOS token alma hatası:', error);
      return null;
    }
  }

  /**
   * Web'den FCM token al (sadece browser)
   */
  static async getWebToken(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      return null;
    }

    try {
      // Basit web token - localStorage'dan kontrol et
      const cachedToken = localStorage.getItem('web_fcm_token');
      if (cachedToken && cachedToken.length > 20) {
        console.log('✅ Web FCM Token cache\'den alındı');
        return cachedToken;
      }

      console.log('❌ Web FCM Token bulunamadı');
      return null;
    } catch (error) {
      console.error('❌ Web token alma hatası:', error);
      return null;
    }
  }

  /**
   * Token'ı Firestore'a kaydet
   */
  static async saveUserToken(userId: string): Promise<boolean> {
    try {
      let token: string | null = null;
      let platform = 'unknown';

      // Platforma göre token al
      if (Capacitor.isNativePlatform()) {
        token = await this.getIOSToken();
        platform = 'ios';
      } else {
        token = await this.getWebToken();
        platform = 'web';
      }

      if (!token) {
        console.log('❌ Token bulunamadı, kaydetme atlanıyor');
        return false;
      }

      // Firestore'a basit şekilde kaydet
      await updateDoc(doc(db, 'kullanicilar', userId), {
        fcmToken: token,
        platform: platform,
        pushEnabled: true,
        tokenUpdatedAt: serverTimestamp()
      });

      console.log('✅ FCM Token Firestore\'a kaydedildi');
      console.log('Platform:', platform);
      console.log('Token preview:', token.substring(0, 30) + '...');
      
      return true;
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
      return false;
    }
  }

  /**
   * Test bildirimi gönder
   */
  static async sendTestNotification(data: SimplePushData): Promise<boolean> {
    try {
      const functions = getFunctions();
      const sendTestPush = httpsCallable(functions, 'sendSimpleTestPush');

      const result = await sendTestPush({
        title: data.title,
        message: data.message,
        userId: data.userId,
        companyId: data.companyId
      });

      const response = result.data as any;
      
      if (response.success) {
        console.log('✅ Test bildirimi gönderildi!');
        return true;
      } else {
        console.error('❌ Test bildirimi hatası:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Test bildirimi gönderme hatası:', error);
      return false;
    }
  }

  /**
   * Kullanıcı giriş yaptığında çağır
   */
  static async onUserLogin(userId: string): Promise<void> {
    console.log('🔔 SimplePush: Kullanıcı giriş yaptı, token kontrolü...');
    
    // Token kaydetmeyi dene
    const success = await this.saveUserToken(userId);
    
    if (success) {
      console.log('🎉 Push bildirimleri aktif!');
    } else {
      console.log('⚠️ Push bildirimleri aktif edilemedi');
    }
  }

  /**
   * Kullanıcı çıkış yaptığında çağır
   */
  static async onUserLogout(): Promise<void> {
    console.log('🔔 SimplePush: Kullanıcı çıkış yaptı');
    // İsteğe bağlı: Token temizleme
  }
}

/**
 * 🎯 KULLANIM:
 * 
 * 1. Giriş sonrası:
 *    SimplePush.onUserLogin(userId);
 * 
 * 2. Test bildirimi:
 *    SimplePush.sendTestNotification({
 *      title: "Test",
 *      message: "Çalışıyor!",
 *      userId: "123"
 *    });
 * 
 * 3. Çıkış sonrası:
 *    SimplePush.onUserLogout();
 */
