/**
 * TÜM kullanıcıların FCM token'larını temizleme scripti
 * Firebase Console'dan çalıştırabilirsiniz
 */

import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';

export async function clearAllFCMTokens() {
  try {
    console.log('🔄 Tüm FCM token\'ları temizleniyor...');
    
    const usersRef = collection(db, 'kullanicilar');
    const snapshot = await getDocs(usersRef);
    
    let clearedCount = 0;
    const promises: Promise<void>[] = [];
    
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Token varsa temizle
      if (userData.pushTokens || userData.fcmToken) {
        console.log(`🗑️ Temizleniyor: ${userData.email || userDoc.id}`);
        
        const updatePromise = updateDoc(doc(db, 'kullanicilar', userDoc.id), {
          pushTokens: deleteField(),
          fcmToken: deleteField(),
          pushTokenUpdatedAt: deleteField(),
          pushNotificationsEnabled: false
        });
        
        promises.push(updatePromise);
        clearedCount++;
      }
    });
    
    await Promise.all(promises);
    
    console.log(`✅ Toplam ${clearedCount} kullanıcının token'ı temizlendi`);
    return clearedCount;
    
  } catch (error) {
    console.error('❌ Token temizleme hatası:', error);
    throw error;
  }
}

// Test için kullanabilirsiniz
export async function checkUserTokens(email: string) {
  try {
    const usersRef = collection(db, 'kullanicilar');
    const snapshot = await getDocs(usersRef);
    
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      if (userData.email === email) {
        console.log(`📋 Kullanıcı: ${email}`);
        console.log(`   - ID: ${userDoc.id}`);
        console.log(`   - pushTokens.fcm: ${userData.pushTokens?.fcm || 'YOK'}`);
        console.log(`   - fcmToken: ${userData.fcmToken || 'YOK'}`);
        console.log(`   - pushNotificationsEnabled: ${userData.pushNotificationsEnabled}`);
        console.log(`   - pushTokenUpdatedAt: ${userData.pushTokenUpdatedAt?.toDate?.() || 'YOK'}`);
      }
    });
  } catch (error) {
    console.error('❌ Token kontrol hatası:', error);
  }
}
