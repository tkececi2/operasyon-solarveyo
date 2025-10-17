import { 
  doc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  writeBatch,
  getDoc
} from 'firebase/firestore';
import { 
  deleteUser as firebaseDeleteUser,
  User as FirebaseUser 
} from 'firebase/auth';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { User } from '../types';
import { logUserAction } from './auditLogService';

/**
 * Kullanıcı Hesabını Tamamen Sil
 * GDPR Uyumlu - Tüm kullanıcı verileri silinir
 * Bu işlem GERİ ALINAMAZ!
 */
export const deleteUserAccount = async (
  firebaseUser: FirebaseUser,
  userProfile: User
): Promise<void> => {
  console.log('🗑️ Hesap silme işlemi başlatılıyor:', userProfile.email);

  try {
    const userId = firebaseUser.uid;
    const companyId = userProfile.companyId;

    // 1. Audit Log - Silme işlemini kaydet
    try {
      await logUserAction(
        {
          id: userId,
          email: userProfile.email,
          name: userProfile.ad,
          role: userProfile.rol,
          companyId: companyId
        },
        'user.account.delete',
        'user',
        userId,
        {
          reason: 'User requested account deletion',
          timestamp: new Date().toISOString(),
          deletedData: {
            email: userProfile.email,
            role: userProfile.rol,
            companyId: companyId
          }
        },
        true // Success
      );
    } catch (logError) {
      console.warn('Audit log kaydedilemedi:', logError);
      // Devam et - log hatası silme işlemini durdurmamalı
    }

    // 2. Kullanıcının oluşturduğu içerikleri temizle (batch operations)
    const batch = writeBatch(db);
    let batchCount = 0;

    // Helper: Batch commit fonksiyonu
    const commitBatch = async () => {
      if (batchCount > 0) {
        await batch.commit();
        console.log(`✅ ${batchCount} kayıt silindi`);
        batchCount = 0;
      }
    };

    // 2a. Kullanıcının oluşturduğu arızaları SİLME - sadece owner bilgisini temizle
    const arizalarRef = collection(db, 'arizalar');
    const arizalarQuery = query(arizalarRef, where('olusturanKisi', '==', userId));
    const arizalarSnap = await getDocs(arizalarQuery);
    
    console.log(`📋 ${arizalarSnap.size} arıza kaydı bulundu`);
    
    // Arızaları silme - sadece owner referansını temizle
    // Çünkü arızalar şirket varlığı, kullanıcı silinse de kalmalı
    // ANCAK: Müşteri rolündeyse ve sadece kendi arızalarıysa silinebilir
    if (userProfile.rol === 'musteri') {
      arizalarSnap.forEach((doc) => {
        batch.delete(doc.ref);
        batchCount++;
        if (batchCount >= 450) {
          commitBatch();
        }
      });
    }

    // 2b. Vardiya bildirimleri (bekçi rolü)
    if (userProfile.rol === 'bekci') {
      const vardiyaRef = collection(db, 'vardiyaBildirimleri');
      const vardiyaQuery = query(vardiyaRef, where('olusturanKisiId', '==', userId));
      const vardiyaSnap = await getDocs(vardiyaQuery);
      
      console.log(`📋 ${vardiyaSnap.size} vardiya bildirimi bulundu`);
      
      vardiyaSnap.forEach((doc) => {
        batch.delete(doc.ref);
        batchCount++;
        if (batchCount >= 450) {
          commitBatch();
        }
      });
    }

    // 2c. Kullanıcının yüklediği fotoğrafları Storage'dan sil
    try {
      // Profil fotoğrafı
      if (userProfile.fotoURL) {
        try {
          const photoPath = userProfile.fotoURL.split('/o/')[1]?.split('?')[0];
          if (photoPath) {
            const decodedPath = decodeURIComponent(photoPath);
            const photoRef = ref(storage, decodedPath);
            await deleteObject(photoRef);
            console.log('✅ Profil fotoğrafı silindi');
          }
        } catch (photoError) {
          console.warn('Profil fotoğrafı silinemedi:', photoError);
        }
      }

      // Kullanıcının upload ettiği diğer dosyalar (arıza fotoğrafları vs)
      const userStoragePath = `companies/${companyId}/users/${userId}`;
      const userStorageRef = ref(storage, userStoragePath);
      
      try {
        const fileList = await listAll(userStorageRef);
        const deletePromises = fileList.items.map(item => deleteObject(item));
        await Promise.all(deletePromises);
        console.log(`✅ ${fileList.items.length} dosya silindi`);
      } catch (storageError) {
        console.warn('Storage dosyaları silinemedi:', storageError);
      }
    } catch (storageError) {
      console.warn('Storage temizleme hatası:', storageError);
    }

    // Batch commit
    await commitBatch();

    // 3. Push notification token'larını temizle
    try {
      const { pushNotificationService } = await import('./pushNotificationService');
      await pushNotificationService.onUserLogout(userId);
      console.log('✅ Push notification token\'ları temizlendi');
    } catch (pushError) {
      console.warn('Push token temizleme hatası:', pushError);
    }

    // 4. Kullanıcı profilini Firestore'dan sil
    const userDocRef = doc(db, 'kullanicilar', userId);
    await deleteDoc(userDocRef);
    console.log('✅ Kullanıcı profili silindi');

    // 5. Firebase Authentication'dan kullanıcıyı sil
    await firebaseDeleteUser(firebaseUser);
    console.log('✅ Firebase Auth kullanıcısı silindi');

    console.log('🎉 Hesap silme işlemi tamamlandı!');
  } catch (error) {
    console.error('❌ Hesap silme hatası:', error);
    throw new Error('Hesap silinirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
  }
};

/**
 * Hesap Silme Ön Kontrolü
 * Silme işlemi yapılabilir mi kontrol eder
 */
export const canDeleteAccount = async (
  userProfile: User
): Promise<{ canDelete: boolean; reason?: string }> => {
  try {
    // SuperAdmin kontrolü
    if (userProfile.rol === 'superadmin') {
      return {
        canDelete: false,
        reason: 'Süper Admin hesapları silinemez. Lütfen destek ile iletişime geçin.'
      };
    }

    // Yönetici kontrolü - şirkette başka yönetici var mı?
    if (userProfile.rol === 'yonetici') {
      const usersRef = collection(db, 'kullanicilar');
      const managersQuery = query(
        usersRef,
        where('companyId', '==', userProfile.companyId),
        where('rol', '==', 'yonetici')
      );
      const managersSnap = await getDocs(managersQuery);
      
      if (managersSnap.size <= 1) {
        return {
          canDelete: false,
          reason: 'Şirkette son yönetici sizsiniz. Hesabınızı silmeden önce başka bir yönetici ataması yapmalısınız.'
        };
      }
    }

    // Şirket sahibi kontrolü (ilk kullanıcı)
    const companyDocRef = doc(db, 'companies', userProfile.companyId);
    const companyDoc = await getDoc(companyDocRef);
    
    if (companyDoc.exists()) {
      const companyData = companyDoc.data();
      if (companyData.ownerId === userProfile.id) {
        return {
          canDelete: false,
          reason: 'Şirket sahibi olarak hesabınızı silemezsiniz. Önce şirket sahipliğini devretmeniz gerekmektedir.'
        };
      }
    }

    return { canDelete: true };
  } catch (error) {
    console.error('Hesap silme kontrolü hatası:', error);
    return {
      canDelete: false,
      reason: 'Kontrol yapılırken bir hata oluştu.'
    };
  }
};

