import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Eski odemeDurumu alanlarını temizler
 * Bu alan artık kullanılmıyor, abonelik bilgileri companies koleksiyonunda tutuluyor
 */
export async function cleanupOdemeDurumuFields() {
  try {
    console.log('🧹 odemeDurumu alanları temizleniyor...');
    
    // Tüm kullanıcıları al
    const usersSnapshot = await getDocs(collection(db, 'kullanicilar'));
    
    let cleanedCount = 0;
    const updatePromises: Promise<void>[] = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Eğer odemeDurumu alanı varsa, temizle
      if (userData.odemeDurumu || userData.denemeSuresiBaslangic || userData.denemeSuresiBitis) {
        updatePromises.push(
          updateDoc(doc(db, 'kullanicilar', userDoc.id), {
            odemeDurumu: deleteField(),
            denemeSuresiBaslangic: deleteField(),
            denemeSuresiBitis: deleteField()
          }).then(() => {
            cleanedCount++;
            console.log(`✅ Kullanıcı temizlendi: ${userData.email || userDoc.id}`);
          }).catch(error => {
            console.error(`❌ Hata (${userDoc.id}):`, error);
          })
        );
      }
    });
    
    // Tüm güncellemeleri bekle
    await Promise.all(updatePromises);
    
    console.log(`✨ Temizlik tamamlandı! ${cleanedCount} kullanıcı güncellendi.`);
    return cleanedCount;
    
  } catch (error) {
    console.error('❌ Temizlik sırasında hata:', error);
    throw error;
  }
}

/**
 * Tek bir kullanıcının odemeDurumu alanını temizler
 */
export async function cleanupUserOdemeDurumu(userId: string) {
  try {
    await updateDoc(doc(db, 'kullanicilar', userId), {
      odemeDurumu: deleteField(),
      denemeSuresiBaslangic: deleteField(),
      denemeSuresiBitis: deleteField()
    });
    console.log(`✅ Kullanıcı temizlendi: ${userId}`);
  } catch (error) {
    console.error(`❌ Kullanıcı temizlenemedi (${userId}):`, error);
    throw error;
  }
}
