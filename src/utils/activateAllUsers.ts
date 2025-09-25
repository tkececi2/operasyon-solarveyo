import { collection, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Tüm kullanıcıları aktif yapar
 * Tek seferlik kullanım için
 */
export const activateAllUsers = async () => {
  try {
    console.log('🔄 Tüm kullanıcılar aktifleştiriliyor...');
    
    const usersSnapshot = await getDocs(collection(db, 'kullanicilar'));
    let updatedCount = 0;
    let alreadyActiveCount = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      
      // Eğer aktif değilse veya aktif alanı yoksa
      if (userData.aktif !== true) {
        await updateDoc(doc(db, 'kullanicilar', userDoc.id), {
          aktif: true,
          guncellenmeTarihi: Timestamp.now()
        });
        updatedCount++;
        console.log(`✅ Aktifleştirildi: ${userData.email || userDoc.id}`);
      } else {
        alreadyActiveCount++;
      }
    }
    
    console.log(`
✅ İşlem tamamlandı!
📊 Toplam kullanıcı: ${usersSnapshot.size}
✅ Aktifleştirilen: ${updatedCount}
ℹ️ Zaten aktif olan: ${alreadyActiveCount}
    `);
    
    return {
      success: true,
      total: usersSnapshot.size,
      updated: updatedCount,
      alreadyActive: alreadyActiveCount
    };
  } catch (error) {
    console.error('❌ Hata:', error);
    return {
      success: false,
      error: error
    };
  }
};

// Window objesine ekle (tarayıcı konsolundan çalıştırabilmek için)
if (typeof window !== 'undefined') {
  (window as any).activateAllUsers = activateAllUsers;
}

export default activateAllUsers;
