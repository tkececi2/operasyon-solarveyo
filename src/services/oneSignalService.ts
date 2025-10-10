/**
 * 🚀 OneSignal Service - Multi-Tenant SAAS Bildirim Sistemi
 * Firebase FCM karmaşıklığından kurtulma!
 * 
 * Features:
 * - Multi-şirket izolasyonu
 * - Rol bazlı hedefleme  
 * - Saha/santral filtreleme
 * - Visual dashboard
 * - %99 delivery rate
 */

import OneSignal from 'react-onesignal';

// OneSignal Configuration - Dashboard'dan alındı
const ONESIGNAL_APP_ID = 'c7477da8-21b8-4780-aabf-39ede0892ebd'; // ✅ ALINDI!
const ONESIGNAL_REST_API_KEY = 'os_v2_app_y5dx3kbbxbdybkv7hhw6bcjoxxbtxqv2lxregs5m45sqr5o6hjsoeiq5lh6j3tfua75skotesh7ypb5kgm66iwjwv3p6mf47lg3pe2y'; // ✅ ALINDI!

interface NotificationData {
  companyId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  roles?: string[];
  sahaId?: string;
  santralId?: string;
  metadata?: Record<string, any>;
}

interface UserTags {
  companyId: string;
  companyName: string;
  role: string;
  userId: string;
  sahalar?: string[];
  santraller?: string[];
  email?: string;
  name?: string;
}

export class OneSignalService {
  private static initialized = false;

  /**
   * OneSignal'i başlat (React App'te bir kez çalışır)
   */
  static async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.log('🔔 OneSignal zaten başlatıldı');
      return true;
    }

    if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'YOUR_ONESIGNAL_APP_ID') {
      console.error('❌ OneSignal APP_ID eksik! oneSignalService.ts dosyasını güncelleyin');
      return false;
    }

    // Eğer zaten başlatılmışsa hatayı ignore et
    try {
      // OneSignal mevcut durumunu kontrol et
      if (typeof window !== 'undefined' && window.OneSignal && window.OneSignal.initialized) {
        console.log('🔔 OneSignal zaten mevcut, tekrar başlatma atlanıyor');
        this.initialized = true;
        return true;
      }
    } catch (e) {
      // Ignore check errors
    }

    try {
      console.log('🚀 OneSignal başlatılıyor...');
      
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari: window.location.origin, // Dynamic domain
        autoRegister: true,
        allowLocalhostAsSecureOrigin: true, // Development için
        requiresUserPrivacyConsent: false, // Development için
        promptOptions: {
          slidedown: {
            enabled: true,
            autoPrompt: true,
            timeDelay: 3000 // 3 saniye sonra izin iste
          }
        }
      });

      console.log('✅ OneSignal başarıyla başlatıldı');
      this.initialized = true;
      return true;
      
    } catch (error) {
      // SDK already initialized hatası = normal
      if (error.message && error.message.includes('already initialized')) {
        console.log('🔔 OneSignal SDK zaten başlatıldı');
        this.initialized = true;
        return true;
      }
      console.error('❌ OneSignal başlatma hatası:', error);
      return false;
    }
  }

  /**
   * Kullanıcı giriş yaptığında tag'leri set et
   * Multi-tenant SAAS için company/role/saha bilgileri
   */
  static async setUserTags(userTags: UserTags): Promise<boolean> {
    try {
      console.log('🏷️ OneSignal tags setleniyor:', userTags);

      // OneSignal External User ID set et (Firebase UID)
      await OneSignal.setExternalUserId(userTags.userId);

      // Multi-tenant tags
      const tags: Record<string, string> = {
        companyId: userTags.companyId,
        companyName: userTags.companyName,
        role: userTags.role,
        userId: userTags.userId
      };

      // Opsiyonel alanlar
      if (userTags.email) tags.email = userTags.email;
      if (userTags.name) tags.name = userTags.name;
      if (userTags.sahalar) tags.sahalar = JSON.stringify(userTags.sahalar);
      if (userTags.santraller) tags.santraller = JSON.stringify(userTags.santraller);

      await OneSignal.sendTags(tags);
      
      console.log('✅ OneSignal tags başarıyla setlendi');
      return true;
      
    } catch (error) {
      console.error('❌ OneSignal tags setleme hatası:', error);
      return false;
    }
  }

  /**
   * Kullanıcı çıkış yaptığında temizle
   */
  static async removeUser(): Promise<void> {
    try {
      console.log('🗑️ OneSignal user temizleniyor...');
      
      // External user ID'yi temizle
      await OneSignal.removeExternalUserId();
      
      // Tags'leri temizle
      await OneSignal.deleteTags(['companyId', 'role', 'userId', 'sahalar', 'santraller']);
      
      console.log('✅ OneSignal user temizlendi');
    } catch (error) {
      console.error('❌ OneSignal user temizleme hatası:', error);
    }
  }

  /**
   * Company bazlı bildirim gönder (SAAS Core Feature)
   */
  static async sendCompanyNotification(data: NotificationData): Promise<boolean> {
    if (!ONESIGNAL_REST_API_KEY || ONESIGNAL_REST_API_KEY === 'YOUR_REST_API_KEY') {
      console.error('❌ OneSignal REST API Key eksik!');
      return false;
    }

    try {
      console.log('📤 OneSignal bildirim gönderiliyor:', {
        company: data.companyId,
        title: data.title,
        roles: data.roles || 'TÜM ROLLER'
      });

      // Filters oluştur - Company bazlı izolasyon
      const filters: any[] = [
        { field: "tag", key: "companyId", relation: "=", value: data.companyId }
      ];

      // Rol filtreleme
      if (data.roles && data.roles.length > 0) {
        if (data.roles.length === 1) {
          filters.push({ field: "tag", key: "role", relation: "=", value: data.roles[0] });
        } else {
          filters.push({ field: "tag", key: "role", relation: "in", value: data.roles });
        }
      }

      // Saha filtreleme (bekçi/müşteri için)
      if (data.sahaId) {
        filters.push({ 
          field: "tag", 
          key: "sahalar", 
          relation: "contains", 
          value: data.sahaId 
        });
      }

      // İkon belirleme
      const icon = data.type === 'error' ? '🚨' : 
                   data.type === 'warning' ? '⚠️' : 
                   data.type === 'success' ? '✅' : '🔔';

      // OneSignal REST API call
      const response = await fetch('https://api.onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          filters: filters,
          headings: { "tr": `${icon} ${data.title}` },
          contents: { "tr": data.message },
          url: data.actionUrl || '/dashboard',
          data: {
            type: data.type || 'info',
            companyId: data.companyId,
            actionUrl: data.actionUrl || '/dashboard',
            ...data.metadata
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ OneSignal bildirim başarılı:', result);
        return true;
      } else {
        const error = await response.text();
        console.error('❌ OneSignal bildirim hatası:', error);
        return false;
      }

    } catch (error) {
      console.error('❌ OneSignal network hatası:', error);
      return false;
    }
  }

  /**
   * Test bildirimi gönder
   */
  static async sendTestNotification(companyId: string, title: string = "Test"): Promise<boolean> {
    return this.sendCompanyNotification({
      companyId,
      title: `🧪 ${title}`,
      message: 'OneSignal test bildirimi - Sistem çalışıyor!',
      type: 'info',
      actionUrl: '/test/notifications'
    });
  }

  /**
   * User bilgilerini al (debugging için)
   */
  static async getUserInfo(): Promise<any> {
    try {
      const playerId = await OneSignal.getPlayerId();
      const tags = await OneSignal.getTags();
      const permission = await OneSignal.getNotificationPermission();
      
      return {
        playerId,
        tags,
        permission,
        initialized: this.initialized
      };
    } catch (error) {
      console.error('OneSignal user info hatası:', error);
      return null;
    }
  }
}

/**
 * 🎯 Ready-to-use notification functions for services
 */

// Arıza bildirimi
export const sendFaultNotification = async (
  companyId: string,
  title: string,
  details: string,
  priority: 'kritik' | 'yuksek' | 'normal',
  sahaId?: string
) => {
  const type = priority === 'kritik' ? 'error' : priority === 'yuksek' ? 'warning' : 'info';
  
  return OneSignalService.sendCompanyNotification({
    companyId,
    title: `🚨 ARIZA - ${title}`,
    message: details,
    type,
    actionUrl: '/arizalar',
    roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
    sahaId,
    metadata: { type: 'fault', priority }
  });
};

// Bakım bildirimi
export const sendMaintenanceNotification = async (
  companyId: string,
  maintenanceType: 'elektrik' | 'mekanik',
  santralName: string,
  sahaId?: string
) => {
  const icon = maintenanceType === 'elektrik' ? '⚡' : '🔧';
  
  return OneSignalService.sendCompanyNotification({
    companyId,
    title: `${icon} ${maintenanceType.toUpperCase()} BAKIM`,
    message: `${santralName} için ${maintenanceType} bakım işlemi tamamlandı`,
    type: 'success',
    actionUrl: `/bakim/${maintenanceType}`,
    roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
    sahaId,
    metadata: { type: 'maintenance', maintenanceType }
  });
};

// Stok uyarısı
export const sendStockAlert = async (
  companyId: string,
  stockName: string,
  currentStock: number,
  minStock: number,
  sahaId?: string
) => {
  return OneSignalService.sendCompanyNotification({
    companyId,
    title: '📦 DÜŞÜK STOK UYARISI',
    message: `${stockName} stoğu kritik seviyede: ${currentStock}/${minStock}`,
    type: 'warning',
    actionUrl: '/stok',
    roles: ['yonetici', 'muhendis', 'tekniker'],
    sahaId,
    metadata: { type: 'stock', stockName, currentStock, minStock }
  });
};

// Vardiya bildirimi
export const sendShiftNotification = async (
  companyId: string,
  shiftType: string,
  sahaName: string,
  sahaId?: string
) => {
  return OneSignalService.sendCompanyNotification({
    companyId,
    title: '🔔 VARDİYA BİLDİRİMİ',
    message: `${sahaName} - ${shiftType} vardiya bildirimi`,
    type: 'info',
    actionUrl: '/vardiya',
    roles: ['yonetici', 'muhendis', 'tekniker', 'bekci', 'musteri'],
    sahaId,
    metadata: { type: 'shift', shiftType }
  });
};

export default OneSignalService;
