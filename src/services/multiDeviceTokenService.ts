/**
 * Multi-Device FCM Token Yönetimi
 * 
 * Bir kullanıcının birden fazla cihazdan (iOS, web, tablet vb.) 
 * giriş yapması durumunda tüm cihazlara bildirim göndermek için.
 * 
 * @author Solarveyo Team
 * @date 2025-10-12
 */

import { doc, updateDoc, getDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';

export interface DeviceInfo {
  token: string;
  platform: 'ios' | 'android' | 'web' | 'mobile-web';
  deviceModel?: string;
  os?: string;
  browser?: string;
  lastUsed: any; // Firestore Timestamp
  addedAt: any; // Firestore Timestamp
}

export interface DevicesMap {
  [deviceKey: string]: DeviceInfo;
}

/**
 * Cihaz bilgilerini topla
 */
function getDeviceInfo(): Partial<DeviceInfo> {
  const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
  const userAgent = navigator.userAgent;
  
  // Platform bilgisi
  let devicePlatform: DeviceInfo['platform'] = 'web';
  if (platform === 'ios') {
    devicePlatform = 'ios';
  } else if (platform === 'android') {
    devicePlatform = 'android';
  } else {
    // Web - mobile mi değil mi kontrol et
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
    devicePlatform = isMobile ? 'mobile-web' : 'web';
  }
  
  // Tarayıcı bilgisi
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  // OS bilgisi
  let os = 'Unknown';
  if (userAgent.includes('Mac OS')) os = 'macOS';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('iPhone')) os = 'iOS';
  else if (userAgent.includes('iPad')) os = 'iPadOS';
  else if (userAgent.includes('Android')) os = 'Android';
  
  return {
    platform: devicePlatform,
    browser,
    os
  };
}

/**
 * Token'ı benzersiz cihaz key'e dönüştür
 */
function getDeviceKey(token: string, platform: string): string {
  // Token'ın ilk 12 karakteri + platform
  const tokenHash = token.substring(0, 12);
  return `${platform}_${tokenHash}`;
}

/**
 * Yeni cihaz kaydı ekle veya mevcut cihazı güncelle
 */
export async function registerDevice(
  userId: string,
  token: string,
  forceUpdate = false
): Promise<boolean> {
  try {
    const deviceInfo = getDeviceInfo();
    const deviceKey = getDeviceKey(token, deviceInfo.platform || 'web');
    
    console.log('📱 Cihaz kaydediliyor:', {
      userId,
      deviceKey,
      platform: deviceInfo.platform,
      tokenPreview: token.substring(0, 20) + '...'
    });
    
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ Kullanıcı bulunamadı:', userId);
      return false;
    }
    
    const existingDevices = userDoc.data()?.devices || {};
    const existingDevice = existingDevices[deviceKey];
    
    // Cihaz zaten kayıtlı mı?
    if (existingDevice && !forceUpdate) {
      console.log('✅ Cihaz zaten kayıtlı, lastUsed güncelleniyor');
      await updateDoc(userRef, {
        [`devices.${deviceKey}.lastUsed`]: serverTimestamp()
      });
      return true;
    }
    
    // Yeni cihaz veya güncelleme
    await updateDoc(userRef, {
      [`devices.${deviceKey}`]: {
        token,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        lastUsed: serverTimestamp(),
        addedAt: existingDevice?.addedAt || serverTimestamp()
      }
    });
    
    console.log('✅ Cihaz başarıyla kaydedildi:', deviceKey);
    return true;
    
  } catch (error) {
    console.error('❌ Cihaz kaydetme hatası:', error);
    return false;
  }
}

/**
 * Cihazı kaldır (logout sırasında)
 */
export async function unregisterDevice(
  userId: string,
  token: string
): Promise<boolean> {
  try {
    console.log('🗑️ Cihaz kaldırılıyor:', {
      userId,
      tokenPreview: token.substring(0, 20) + '...'
    });
    
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ Kullanıcı bulunamadı:', userId);
      return false;
    }
    
    const devices = userDoc.data()?.devices || {};
    
    // Token'a sahip cihazı bul
    const deviceKey = Object.keys(devices).find(
      key => devices[key].token === token
    );
    
    if (!deviceKey) {
      console.warn('⚠️ Token ile eşleşen cihaz bulunamadı');
      return false;
    }
    
    // Cihazı sil
    await updateDoc(userRef, {
      [`devices.${deviceKey}`]: deleteField()
    });
    
    console.log('✅ Cihaz başarıyla kaldırıldı:', deviceKey);
    return true;
    
  } catch (error) {
    console.error('❌ Cihaz kaldırma hatası:', error);
    return false;
  }
}

/**
 * Kullanıcının tüm aktif cihazlarını getir
 */
export async function getUserDevices(userId: string): Promise<DeviceInfo[]> {
  try {
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const devices = userDoc.data()?.devices || {};
    return Object.values(devices) as DeviceInfo[];
    
  } catch (error) {
    console.error('❌ Cihazları getirme hatası:', error);
    return [];
  }
}

/**
 * Kullanıcının tüm cihaz token'larını getir
 */
export async function getUserDeviceTokens(userId: string): Promise<string[]> {
  try {
    const devices = await getUserDevices(userId);
    return devices.map(d => d.token).filter(Boolean);
  } catch (error) {
    console.error('❌ Token\'ları getirme hatası:', error);
    return [];
  }
}

/**
 * Eski/kullanılmayan cihazları temizle
 * @param userId Kullanıcı ID
 * @param maxAgeInDays Cihazın kullanılmama süresi (gün)
 */
export async function cleanupStaleDevices(
  userId: string,
  maxAgeInDays: number = 30
): Promise<number> {
  try {
    console.log(`🧹 Eski cihazlar temizleniyor (${maxAgeInDays} gün+)...`);
    
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return 0;
    }
    
    const devices = userDoc.data()?.devices || {};
    const now = Date.now();
    const maxAge = maxAgeInDays * 24 * 60 * 60 * 1000; // ms
    
    let removedCount = 0;
    
    for (const [deviceKey, device] of Object.entries(devices)) {
      const deviceData = device as DeviceInfo;
      const lastUsed = deviceData.lastUsed?.toMillis?.() || 0;
      const age = now - lastUsed;
      
      if (age > maxAge) {
        console.log(`🗑️ Eski cihaz kaldırılıyor: ${deviceKey} (${Math.floor(age / (24 * 60 * 60 * 1000))} gün)`, {
          platform: deviceData.platform,
          lastUsed: new Date(lastUsed).toLocaleDateString('tr-TR')
        });
        
        await updateDoc(userRef, {
          [`devices.${deviceKey}`]: deleteField()
        });
        
        removedCount++;
      }
    }
    
    console.log(`✅ ${removedCount} eski cihaz temizlendi`);
    return removedCount;
    
  } catch (error) {
    console.error('❌ Cihaz temizleme hatası:', error);
    return 0;
  }
}

/**
 * Tüm cihazları kaldır (hesap silme vb.)
 */
export async function removeAllDevices(userId: string): Promise<boolean> {
  try {
    console.log('🗑️ Tüm cihazlar kaldırılıyor...');
    
    const userRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userRef, {
      devices: deleteField(),
      pushTokens: deleteField(), // Eski format
      fcmToken: deleteField() // Eski format
    });
    
    console.log('✅ Tüm cihazlar kaldırıldı');
    return true;
    
  } catch (error) {
    console.error('❌ Tüm cihazları kaldırma hatası:', error);
    return false;
  }
}

/**
 * Cihaz istatistikleri
 */
export async function getDeviceStats(userId: string): Promise<{
  total: number;
  byPlatform: Record<string, number>;
  oldest?: DeviceInfo;
  newest?: DeviceInfo;
}> {
  try {
    const devices = await getUserDevices(userId);
    
    const stats = {
      total: devices.length,
      byPlatform: {} as Record<string, number>,
      oldest: undefined as DeviceInfo | undefined,
      newest: undefined as DeviceInfo | undefined
    };
    
    // Platform dağılımı
    devices.forEach(device => {
      stats.byPlatform[device.platform] = (stats.byPlatform[device.platform] || 0) + 1;
    });
    
    // En eski ve en yeni cihaz
    if (devices.length > 0) {
      stats.oldest = devices.reduce((oldest, current) => {
        const oldestTime = oldest.addedAt?.toMillis?.() || 0;
        const currentTime = current.addedAt?.toMillis?.() || 0;
        return currentTime < oldestTime ? current : oldest;
      });
      
      stats.newest = devices.reduce((newest, current) => {
        const newestTime = newest.addedAt?.toMillis?.() || 0;
        const currentTime = current.addedAt?.toMillis?.() || 0;
        return currentTime > newestTime ? current : newest;
      });
    }
    
    return stats;
    
  } catch (error) {
    console.error('❌ İstatistik hesaplama hatası:', error);
    return {
      total: 0,
      byPlatform: {}
    };
  }
}

/**
 * Eski format token'ları yeni formata migrate et
 */
export async function migrateOldTokenFormat(userId: string): Promise<boolean> {
  try {
    console.log('🔄 Eski token formatı kontrol ediliyor...');
    
    const userRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    const data = userDoc.data();
    const devices = data?.devices || {};
    
    // Zaten yeni format varsa migrate etme
    if (Object.keys(devices).length > 0) {
      console.log('✅ Zaten yeni format kullanılıyor');
      return true;
    }
    
    // Eski format token var mı?
    const oldToken = data?.pushTokens?.fcm || data?.fcmToken;
    const oldPlatform = data?.pushTokens?.platform || data?.platform || 'web';
    
    if (!oldToken) {
      console.log('ℹ️ Migrate edilecek token yok');
      return true;
    }
    
    console.log('🔄 Eski token yeni formata taşınıyor...', {
      platform: oldPlatform,
      tokenPreview: oldToken.substring(0, 20) + '...'
    });
    
    // Yeni formata kaydet
    const deviceKey = getDeviceKey(oldToken, oldPlatform);
    await updateDoc(userRef, {
      [`devices.${deviceKey}`]: {
        token: oldToken,
        platform: oldPlatform,
        lastUsed: data?.pushTokens?.updatedAt || data?.tokenUpdatedAt || serverTimestamp(),
        addedAt: data?.pushTokens?.updatedAt || data?.tokenUpdatedAt || serverTimestamp(),
        migrated: true
      }
    });
    
    console.log('✅ Token başarıyla migrate edildi');
    return true;
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    return false;
  }
}

