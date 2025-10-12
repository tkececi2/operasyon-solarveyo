/**
 * 🔄 TOPLU TOKEN MIGRATION SCRIPT
 * 
 * Tüm kullanıcıların eski format token'larını yeni multi-device formatına taşır.
 * 
 * KULLANIM:
 * 1. Firebase Console'da çalıştır (Browser Console)
 * 2. Ya da Node.js scripti olarak çalıştır
 * 
 * @author Solarveyo Team
 * @date 2025-10-12
 */

import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/lib/firebase';

interface OldTokenFormat {
  pushTokens?: {
    fcm?: string;
    platform?: string;
    updatedAt?: any;
  };
  fcmToken?: string;
  platform?: string;
  tokenUpdatedAt?: any;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: Array<{
    userId: string;
    status: 'migrated' | 'skipped' | 'error';
    reason?: string;
  }>;
}

/**
 * Tek kullanıcının token'ını migrate et
 */
async function migrateUserToken(userId: string, userData: any): Promise<{
  success: boolean;
  reason?: string;
}> {
  try {
    const devices = userData.devices || {};
    
    // Zaten yeni format varsa migrate etme
    if (Object.keys(devices).length > 0) {
      return { success: false, reason: 'already-migrated' };
    }
    
    // Eski format token var mı?
    const oldToken = userData.pushTokens?.fcm || userData.fcmToken;
    const oldPlatform = userData.pushTokens?.platform || userData.platform || 'web';
    
    if (!oldToken) {
      return { success: false, reason: 'no-token' };
    }
    
    console.log(`🔄 Migration: ${userId} (${oldPlatform})`);
    
    // Yeni formata kaydet
    const deviceKey = `${oldPlatform}_${oldToken.substring(0, 12)}`;
    await updateDoc(doc(db, 'kullanicilar', userId), {
      [`devices.${deviceKey}`]: {
        token: oldToken,
        platform: oldPlatform,
        lastUsed: userData.pushTokens?.updatedAt || userData.tokenUpdatedAt || serverTimestamp(),
        addedAt: userData.pushTokens?.updatedAt || userData.tokenUpdatedAt || serverTimestamp(),
        migrated: true,
        migratedAt: serverTimestamp()
      }
    });
    
    console.log(`✅ Migrated: ${userId} → ${deviceKey}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Migration error for ${userId}:`, error);
    return { success: false, reason: 'error' };
  }
}

/**
 * Tüm kullanıcıları migrate et
 */
export async function migrateAllTokens(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  try {
    console.log('🚀 Token migration başlıyor...\n');
    
    // Tüm kullanıcıları getir
    const usersSnapshot = await getDocs(collection(db, 'kullanicilar'));
    stats.total = usersSnapshot.size;
    
    console.log(`📊 Toplam ${stats.total} kullanıcı bulundu\n`);
    
    // Her kullanıcı için migration
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const result = await migrateUserToken(userId, userData);
      
      if (result.success) {
        stats.migrated++;
        stats.details.push({ userId, status: 'migrated' });
      } else if (result.reason === 'already-migrated') {
        stats.skipped++;
        stats.details.push({ userId, status: 'skipped', reason: 'already-migrated' });
      } else if (result.reason === 'no-token') {
        stats.skipped++;
        stats.details.push({ userId, status: 'skipped', reason: 'no-token' });
      } else {
        stats.errors++;
        stats.details.push({ userId, status: 'error', reason: result.reason });
      }
    }
    
    // Sonuçları göster
    console.log('\n📊 ===== MIGRATION SONUÇLARI =====');
    console.log(`✅ Migrated: ${stats.migrated}/${stats.total}`);
    console.log(`⏭️  Skipped:  ${stats.skipped}/${stats.total}`);
    console.log(`❌ Errors:   ${stats.errors}/${stats.total}`);
    console.log('===================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    throw error;
  }
}

/**
 * Şirket bazlı migration
 */
export async function migrateTokensByCompany(companyId: string): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: []
  };
  
  try {
    console.log(`🚀 Şirket token migration başlıyor: ${companyId}\n`);
    
    // Şirketin kullanıcılarını getir
    const usersRef = collection(db, 'kullanicilar');
    const usersSnapshot = await getDocs(usersRef);
    
    // Şirkete ait kullanıcıları filtrele
    const companyUsers = usersSnapshot.docs.filter(doc => 
      doc.data().companyId === companyId
    );
    
    stats.total = companyUsers.length;
    console.log(`📊 ${companyId} için ${stats.total} kullanıcı bulundu\n`);
    
    // Migration
    for (const userDoc of companyUsers) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      
      const result = await migrateUserToken(userId, userData);
      
      if (result.success) {
        stats.migrated++;
        stats.details.push({ userId, status: 'migrated' });
      } else if (result.reason === 'already-migrated' || result.reason === 'no-token') {
        stats.skipped++;
        stats.details.push({ userId, status: 'skipped', reason: result.reason });
      } else {
        stats.errors++;
        stats.details.push({ userId, status: 'error', reason: result.reason });
      }
    }
    
    // Sonuçlar
    console.log('\n📊 ===== MIGRATION SONUÇLARI =====');
    console.log(`Şirket: ${companyId}`);
    console.log(`✅ Migrated: ${stats.migrated}/${stats.total}`);
    console.log(`⏭️  Skipped:  ${stats.skipped}/${stats.total}`);
    console.log(`❌ Errors:   ${stats.errors}/${stats.total}`);
    console.log('===================================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    throw error;
  }
}

// CLI kullanımı için
if (require.main === module) {
  migrateAllTokens()
    .then(stats => {
      console.log('🎉 Migration tamamlandı!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration başarısız:', error);
      process.exit(1);
    });
}

