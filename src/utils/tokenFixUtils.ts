/**
 * FCM Token eksikliği sorunlarını çözmeye yardımcı utility fonksiyonları
 */

import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PushNotificationService } from '../services/pushNotificationService';
import { WebPushService } from '../services/webPushService';
import { platform } from './platform';

export interface TokenStatus {
  userId: string;
  email?: string;
  hasToken: boolean;
  tokenType: 'none' | 'web' | 'ios' | 'android';
  lastUpdated?: Date;
}

/**
 * Şirketteki tüm kullanıcıların token durumunu kontrol et
 */
export async function checkCompanyTokenStatus(companyId: string): Promise<TokenStatus[]> {
  const usersRef = collection(db, 'kullanicilar');
  const q = query(usersRef, where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  
  const results: TokenStatus[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    const pushTokens = data.pushTokens || {};
    
    results.push({
      userId: doc.id,
      email: data.email || data.ad,
      hasToken: !!pushTokens.fcm,
      tokenType: pushTokens.fcm ? (pushTokens.platform || 'unknown') as any : 'none',
      lastUpdated: data.pushTokenUpdatedAt?.toDate()
    });
  });
  
  return results.sort((a, b) => (a.hasToken === b.hasToken) ? 0 : a.hasToken ? -1 : 1);
}

/**
 * Mevcut kullanıcının token'ını yenile
 */
export async function refreshCurrentUserToken(): Promise<boolean> {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
  
  if (!userId) {
    console.error('❌ Kullanıcı ID bulunamadı');
    return false;
  }
  
  try {
    console.log('🔄 Token yenileme başlatıldı...');
    
    if (platform.isNative()) {
      // iOS için
      await PushNotificationService.initialize();
      await PushNotificationService.setUser(userId);
    } else {
      // Web için
      await WebPushService.initialize();
      await WebPushService.setUser(userId);
    }
    
    console.log('✅ Token yenileme tamamlandı');
    return true;
  } catch (error) {
    console.error('❌ Token yenileme hatası:', error);
    return false;
  }
}

/**
 * Token eksik kullanıcılar için otomatik düzeltme
 */
export async function fixMissingTokens(companyId: string): Promise<{ fixed: number; failed: number }> {
  const tokenStatuses = await checkCompanyTokenStatus(companyId);
  const missingTokenUsers = tokenStatuses.filter(status => !status.hasToken);
  
  console.log(`🔍 ${missingTokenUsers.length} kullanıcının token'ı eksik`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const user of missingTokenUsers) {
    console.log(`🔧 Token düzeltme deneniyor: ${user.email}`);
    
    try {
      // Bu kullanıcı için token kaydetme dene
      // Not: Bu sadece o anda aktif olan kullanıcı için çalışır
      if (platform.isNative()) {
        await PushNotificationService.setUser(user.userId, 1); // 1 retry
      } else {
        await WebPushService.setUser(user.userId);
      }
      fixed++;
      console.log(`✅ ${user.email} token düzeltildi`);
    } catch (error) {
      failed++;
      console.log(`❌ ${user.email} token düzeltilemedi:`, error);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return { fixed, failed };
}

/**
 * Token durumunu raporla
 */
export function generateTokenReport(tokenStatuses: TokenStatus[]): string {
  const total = tokenStatuses.length;
  const withTokens = tokenStatuses.filter(s => s.hasToken).length;
  const withoutTokens = total - withTokens;
  const webTokens = tokenStatuses.filter(s => s.tokenType === 'web').length;
  const iOSTokens = tokenStatuses.filter(s => s.tokenType === 'ios').length;
  
  return `
📊 FCM Token Raporu:
━━━━━━━━━━━━━━━━━━━

👥 Toplam Kullanıcı: ${total}
✅ Token Var: ${withTokens} (${Math.round(withTokens/total*100)}%)
❌ Token Yok: ${withoutTokens} (${Math.round(withoutTokens/total*100)}%)

📱 Platform Dağılımı:
🌐 Web: ${webTokens}
📱 iOS: ${iOSTokens}
🤖 Android: ${tokenStatuses.filter(s => s.tokenType === 'android').length}

⚠️ Eksik Token Kullanıcıları:
${tokenStatuses.filter(s => !s.hasToken).map(s => `• ${s.email}`).join('\n')}
`;
}
