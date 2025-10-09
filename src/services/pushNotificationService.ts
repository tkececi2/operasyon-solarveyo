import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Capacitor Push Notifications Servisi
 * iOS ve Android için bildirim yönetimi
 */
export class PushNotificationService {
  private static initialized = false;
  private static currentToken: string | null = null;
  private static fcmToken: string | null = null;

  /**
   * Push Notifications'ı başlat
   */
  static async initialize() {
    // Sadece native platformda çalışır
    if (!Capacitor.isNativePlatform()) {
      console.log('🔔 Push: Web platformda çalışmıyor, atlanıyor...');
      return;
    }

    // Tekrar başlatmayı önle
    if (this.initialized) {
      console.log('🔔 Push: Zaten başlatıldı');
      return;
    }

    try {
      console.log('🔔 Push: Başlatılıyor...');

      // İzin kontrolü
      const permStatus = await PushNotifications.checkPermissions();
      console.log('🔔 Mevcut izin durumu:', permStatus.receive);

      if (permStatus.receive === 'prompt') {
        // İzin iste
        const result = await PushNotifications.requestPermissions();
        console.log('🔔 İzin sonucu:', result.receive);
        
        if (result.receive !== 'granted') {
          console.log('⚠️ Push notification izni reddedildi');
          return;
        }
      } else if (permStatus.receive !== 'granted') {
        console.log('⚠️ Push notification izni yok');
        return;
      }

      // Event listener'ları kaydet
      await this.registerListeners();

      // iOS/Android için register
      await PushNotifications.register();
      console.log('✅ Push: Kayıt tamamlandı');

      // iOS'tan gelen FCM token'ı 2 saniye sonra kontrol et
      setTimeout(async () => {
        const fcm = await this.getFCMToken();
        if (fcm) {
          this.fcmToken = fcm;
          console.log('🔥 FCM Token JavaScript\'e yüklendi:', fcm.substring(0, 50) + '...');
        }
      }, 2000);

      this.initialized = true;
    } catch (error) {
      console.error('❌ Push başlatma hatası:', error);
    }
  }

  /**
   * Event listener'ları kaydet
   */
  private static async registerListeners() {
    // Token alındığında (APNs token)
    await PushNotifications.addListener('registration', (token: Token) => {
      console.log('🎫 APNs token alındı:', token.value);
      this.currentToken = token.value;
      
      // Debug: Token'ı alert ile göster
      if (Capacitor.isNativePlatform()) {
        alert('🎫 Push Token Alındı!\n\n' + token.value.substring(0, 50) + '...');
        console.log('📋 APNS TOKEN:', token.value);
      }
      
      // APNs token alındığında otomatik olarak FCM token'ı da kontrol et ve güncelle
      this.checkAndUpdateFCMToken();
    });

    // Token alma hatası
    await PushNotifications.addListener('registrationError', (error: any) => {
      console.error('❌ Push token hatası:', error);
    });

    // Bildirim alındığında (uygulama açıkken)
    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('🔔 Bildirim alındı:', notification);
        // Uygulama açıkken gelen bildirimler
      }
    );

    // Bildirime tıklandığında
    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('👆 Bildirime tıklandı:', notification);
        const data = notification.notification.data;
        
        // Bildirim data'sına göre yönlendirme yap
        if (data.type === 'fault' && data.id) {
          // TODO: Arıza detay sayfasına yönlendir
          console.log('➡️ Arıza sayfasına yönlendirilecek:', data.id);
        }
      }
    );
  }

  /**
   * Kullanıcı token'ını al (APNs)
   */
  static getToken(): string | null {
    return this.currentToken;
  }

  /**
   * FCM Token'ı al (önce native FirebaseMessaging, sonra Preferences fallback)
   */
  static async getFCMToken(): Promise<string | null> {
    try {
      // 1) Native Firebase Messaging üzerinden doğrudan almayı dene
      try {
        await FirebaseMessaging.requestPermissions();
        const tokenResult = await FirebaseMessaging.getToken();
        const tokenFromNative = tokenResult?.token ?? null;
        if (tokenFromNative) {
          console.log('🔥 FCM Token alındı (FirebaseMessaging):', tokenFromNative.substring(0, 50) + '...');
          // JS tarafında da erişim için Preferences'a yaz
          await Preferences.set({ key: 'fcm_token', value: tokenFromNative });
          return tokenFromNative;
        }
      } catch (nativeErr) {
        console.warn('⚠️ FirebaseMessaging.getToken başarısız, Preferences ile denenecek:', nativeErr);
      }

      // 2) Preferences üzerinden oku (native AppDelegate yazmış olabilir)
      const { value } = await Preferences.get({ key: 'fcm_token' });
      if (value) {
        console.log('🔥 FCM Token alındı (Preferences):', value.substring(0, 50) + '...');
        return value;
      }

      // 3) Kısa gecikme ile tekrar dene
      await new Promise(resolve => setTimeout(resolve, 1500));
      const retry = await Preferences.get({ key: 'fcm_token' });
      if (retry.value) {
        console.log('✅ FCM Token 2. denemede alındı (Preferences):', retry.value.substring(0, 50) + '...');
        return retry.value;
      }

      console.log('⚠️ FCM Token bulunamadı');
      return null;
    } catch (error) {
      console.error('❌ FCM Token alma hatası:', error);
      return null;
    }
  }

  /**
   * Debug: Token ve durum bilgisi
   */
  static async getDebugInfo() {
    const fcmToken = await this.getFCMToken();
    return {
      initialized: this.initialized,
      hasAPNsToken: !!this.currentToken,
      apnsToken: this.currentToken,
      hasFCMToken: !!fcmToken,
      fcmToken: fcmToken,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform()
    };
  }

  /**
   * Kullanıcı giriş yaptığında token'ı backend'e kaydet
   */
  static async setUser(userId: string) {
    console.log('🔔 setUser çağrıldı:', userId);
    
    // FCM Token'ı almayı dene (iOS native'den geliyor)
    let fcmToken = await this.getFCMToken();
    
    if (!fcmToken) {
      console.log('⚠️ FCM Token henüz alınmadı, 5 saniye bekleniyor...');
      
      // Token'ın gelmesini bekle (native'den gelmesi zaman alabilir)
      await new Promise(resolve => setTimeout(resolve, 5000));
      fcmToken = await this.getFCMToken();
      
      if (!fcmToken) {
        console.log('❌ FCM Token hala yok! Native tarafı kontrol edin.');
        console.log('Debug bilgisi:', await this.getDebugInfo());
        return;
      }
    }

    try {
      console.log('💾 FCM Token kaydediliyor...'); 
      console.log('UserId:', userId);
      console.log('Token:', fcmToken.substring(0, 50) + '...');
      
      // Token'ı Firestore'a kaydet (standart alanlar + nested pushTokens.fcm)
      await updateDoc(doc(db, 'kullanicilar', userId), {
        'pushTokens.fcm': fcmToken,
        pushNotificationsEnabled: true,
        pushTokenUpdatedAt: serverTimestamp(),
        platform: Capacitor.getPlatform()
      });
      
      console.log('✅ FCM Token Firestore\'a kaydedildi');
      console.log('Firestore yolu: kullanicilar/' + userId);
      
      // Debug alert
      if (Capacitor.isNativePlatform()) {
        alert('✅ Push Bildirimleri Aktif!\n\n' + 
              'Token Firestore\'a kaydedildi.\n\n' +
              'Artık size bildirim gönderilebilir!\n\n' +
              'Token: ' + fcmToken.substring(0, 30) + '...');
      }
    } catch (error) {
      console.error('❌ Token kaydetme hatası:', error);
      console.error('Hata detayı:', JSON.stringify(error));
    }
  }

  /**
   * Kullanıcı çıkış yaptığında temizle
   */
  static async removeUser() {
    console.log('🗑️ Push: Kullanıcı temizleniyor...');
    this.currentToken = null;
  }

  /**
   * FCM Token'ı kontrol et ve gerekirse güncelle
   * Token değiştiğinde veya geçersiz olduğunda otomatik çalışır
   */
  private static async checkAndUpdateFCMToken() {
    try {
      console.log('🔄 FCM Token kontrolü başlıyor...');
      
      // Mevcut kullanıcı ID'sini al (localStorage veya Preferences'tan)
      const { value: currentUserId } = await Preferences.get({ key: 'current_user_id' });
      
      if (!currentUserId) {
        console.log('⚠️ Kullanıcı ID bulunamadı, token güncellemesi atlanıyor');
        return;
      }
      
      // FCM Token'ı al
      let fcmToken = await this.getFCMToken();
      
      if (!fcmToken) {
        console.log('⏳ FCM Token henüz hazır değil, 3 saniye bekleniyor...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        fcmToken = await this.getFCMToken();
      }
      
      if (!fcmToken) {
        console.error('❌ FCM Token alınamadı!');
        return;
      }
      
      // Mevcut token'ı kontrol et
      const { value: savedToken } = await Preferences.get({ key: 'last_saved_fcm_token' });
      
      if (savedToken === fcmToken) {
        console.log('✅ Token değişmemiş, güncelleme gerekmiyor');
        return;
      }
      
      console.log('🔄 Token değişmiş veya ilk kez alınıyor, Firestore güncelleniyor...');
      
      // Firestore'a kaydet
      await updateDoc(doc(db, 'kullanicilar', currentUserId), {
        'pushTokens.fcm': fcmToken,
        pushNotificationsEnabled: true,
        pushTokenUpdatedAt: serverTimestamp(),
        platform: Capacitor.getPlatform()
      });
      
      // Son kaydedilen token'ı sakla
      await Preferences.set({ key: 'last_saved_fcm_token', value: fcmToken });
      
      console.log('✅ FCM Token otomatik güncellendi!');
      
      // Kullanıcıya bilgi ver (production'da kaldırılabilir)
      if (Capacitor.isNativePlatform()) {
        alert('✅ Push bildirimleri otomatik güncellendi!');
      }
      
    } catch (error) {
      console.error('❌ Otomatik token güncelleme hatası:', error);
    }
  }

  /**
   * Token geçersiz olduğunda yenile
   * Firebase Functions'tan gelen hata durumunda çağrılabilir
   */
  static async refreshTokenIfNeeded() {
    try {
      console.log('🔄 Token yenileme başlatılıyor...');
      
      // Eski token'ı temizle
      await Preferences.remove({ key: 'fcm_token' });
      await Preferences.remove({ key: 'last_saved_fcm_token' });
      
      // Yeniden register et
      await PushNotifications.register();
      
      // Token güncellemesini bekle
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Yeni token'ı kontrol et ve kaydet
      await this.checkAndUpdateFCMToken();
      
    } catch (error) {
      console.error('❌ Token yenileme hatası:', error);
    }
  }
}

