/**
 * 🔧 Firebase FCM Token Toplu Düzeltme
 * Tüm kullanıcıların token'larını yenileme sistemi
 */

import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Token eksik kullanıcıları bulup flagle
 */
export const findUsersWithoutTokens = async (companyId: string) => {
  try {
    const usersRef = collection(db, 'kullanicilar');
    const q = query(usersRef, where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    
    const usersWithoutTokens: string[] = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.pushTokens?.fcm && !data.fcmToken) {
        usersWithoutTokens.push(doc.id);
        console.log('❌ Token eksik:', data.email || data.ad);
      }
    });
    
    return usersWithoutTokens;
  } catch (error) {
    console.error('Token kontrol hatası:', error);
    return [];
  }
};

/**
 * Kullanıcıya "token yenile" flag'i ekle
 */
export const flagUserForTokenRefresh = async (userId: string) => {
  try {
    await updateDoc(doc(db, 'kullanicilar', userId), {
      needsTokenRefresh: true,
      tokenRefreshRequestedAt: new Date().toISOString()
    });
    console.log('✅ Token yenileme flag eklendi:', userId);
  } catch (error) {
    console.error('Flag ekleme hatası:', error);
  }
};

/**
 * Tüm şirket kullanıcılarını token yenilemeye zorla
 */
export const forceCompanyTokenRefresh = async (companyId: string) => {
  const usersWithoutTokens = await findUsersWithoutTokens(companyId);
  
  for (const userId of usersWithoutTokens) {
    await flagUserForTokenRefresh(userId);
  }
  
  return {
    total: usersWithoutTokens.length,
    flagged: usersWithoutTokens
  };
};
