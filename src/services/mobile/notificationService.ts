import { PushNotifications, PushNotificationSchema, Token, ActionPerformed } from '@capacitor/push-notifications';
import { platform } from '../../utils/platform';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

/**
 * Mobil bildirim servisi
 * iOS ve Android için push notification yönetimi
 */
export class MobileNotificationService {
  /**
   * Bildirim sistemini başlat ve token'ı Firebase'e kaydet
   */
  static async initialize(userId: string) {
    if (!platform.isNative()) {
      console.log('Web platformunda push notification desteklenmiyor');
      return;
    }
    
    try {
      // İzin iste
      const permission = await PushNotifications.requestPermissions();
      console.log('Push notification izni:', permission);
      
      if (permission.receive === 'granted') {
        // Token alındığında
        await PushNotifications.addListener('registration', async (token: Token) => {
          console.log('Push token alındı:', token.value);
          
          // Token'ı Firebase'e kaydet
          try {
            const platformKey = platform.isIOS() ? 'ios' : 'android';
            await updateDoc(doc(db, 'kullanicilar', userId), {
              [`pushTokens.${platformKey}`]: token.value,
              pushTokenUpdatedAt: new Date().toISOString()
            });
            console.log('Push token Firebase\'e kaydedildi');
          } catch (error) {
            console.error('Push token kaydetme hatası:', error);
          }
        });
        
        // Token hatası durumunda
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('Push notification kayıt hatası:', error);
        });
        
        // Bildirim alındığında (uygulama açıkken)
        await PushNotifications.addListener('pushNotificationReceived', 
          (notification: PushNotificationSchema) => {
            console.log('Bildirim alındı:', notification);
            
            // Uygulama içi bildirim göster
            this.showInAppNotification(notification);
          }
        );
        
        // Bildirime tıklandığında
        await PushNotifications.addListener('pushNotificationActionPerformed', 
          (notification: ActionPerformed) => {
            console.log('Bildirime tıklandı:', notification);
            
            // İlgili sayfaya yönlendir
            this.handleNotificationClick(notification);
          }
        );
        
        // Push notification kaydını başlat
        await PushNotifications.register();
        console.log('Push notification başarıyla başlatıldı');
      } else {
        console.log('Push notification izni reddedildi');
      }
    } catch (error) {
      console.error('Push notification başlatma hatası:', error);
    }
  }
  
  /**
   * Uygulama içi bildirim göster
   */
  private static showInAppNotification(notification: PushNotificationSchema) {
    // React toast veya custom notification component ile göster
    const event = new CustomEvent('inAppNotification', {
      detail: {
        title: notification.title || 'Yeni Bildirim',
        body: notification.body || '',
        data: notification.data
      }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Bildirim tıklama işlemini yönet
   */
  private static handleNotificationClick(notification: ActionPerformed) {
    const data = notification.notification.data;
    
    // Bildirim tipine göre yönlendirme yap
    if (data?.type) {
      switch(data.type) {
        case 'ariza':
          window.location.href = `/arizalar/${data.id}`;
          break;
        case 'bakim':
          window.location.href = `/bakim/${data.id}`;
          break;
        case 'vardiya':
          window.location.href = `/vardiya-bildirimleri`;
          break;
        default:
          window.location.href = '/bildirimler';
      }
    }
  }
  
  /**
   * Badge sayısını güncelle
   */
  static async setBadgeCount(count: number) {
    if (!platform.isNative()) return;
    
    try {
      // iOS için badge güncelleme
      if (platform.isIOS()) {
        await PushNotifications.removeAllDeliveredNotifications();
      }
    } catch (error) {
      console.error('Badge güncelleme hatası:', error);
    }
  }
  
  /**
   * Tüm bildirimleri temizle
   */
  static async clearAllNotifications() {
    if (!platform.isNative()) return;
    
    try {
      await PushNotifications.removeAllDeliveredNotifications();
      console.log('Tüm bildirimler temizlendi');
    } catch (error) {
      console.error('Bildirim temizleme hatası:', error);
    }
  }
}
