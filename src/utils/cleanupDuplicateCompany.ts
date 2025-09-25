import { 
  collection, 
  getDocs,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export const cleanupDuplicateCompanies = async () => {
  try {
    console.log('İsimsiz şirket kayıtları temizleniyor...');
    
    // "İsimsiz Şirket" adına sahip şirketleri bul
    const q = query(
      collection(db, 'companies'), 
      where('name', '==', 'İsimsiz Şirket')
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('İsimsiz şirket kaydı bulunamadı.');
      return { success: true, deleted: 0 };
    }
    
    let deleted = 0;
    
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      
      // Eğer bu şirketin hiç kullanıcısı yoksa sil
      const usersQuery = query(
        collection(db, 'kullanicilar'),
        where('companyId', '==', docSnap.id)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      
      if (usersSnapshot.empty) {
        // Kullanıcısı olmayan İsimsiz Şirket'i sil
        console.log(`Siliniyor: ${docSnap.id} - Oluşturma: ${data.createdAt?.toDate()}`);
        await deleteDoc(doc(db, 'companies', docSnap.id));
        deleted++;
      } else {
        console.log(`Korunuyor: ${docSnap.id} - ${usersSnapshot.size} kullanıcısı var`);
      }
    }
    
    return { success: true, deleted };
    
  } catch (error) {
    console.error('Temizleme hatası:', error);
    return { success: false, error };
  }
};
