import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';

/**
 * Mevcut kullanıcının rolünü düzelt
 * SuperAdmin rolünü yönetici yap
 */
export const fixCurrentUserRole = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      console.log('❌ Giriş yapmış kullanıcı bulunamadı');
      return { success: false, message: 'Kullanıcı bulunamadı' };
    }

    // Kullanıcı profilini al
    const userDoc = await getDoc(doc(db, 'kullanicilar', user.uid));
    
    if (!userDoc.exists()) {
      console.log('❌ Kullanıcı profili bulunamadı');
      return { success: false, message: 'Kullanıcı profili bulunamadı' };
    }

    const userData = userDoc.data();
    console.log('Mevcut kullanıcı verisi:', userData);

    // Eğer rol superadmin ise yönetici yap
    if (userData.rol === 'superadmin' || !userData.rol) {
      await updateDoc(doc(db, 'kullanicilar', user.uid), {
        rol: 'yonetici',
        updatedAt: new Date()
      });
      
      console.log('✅ Kullanıcı rolü yönetici olarak güncellendi');
      
      // Sayfayı yenile
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return { 
        success: true, 
        message: 'Kullanıcı rolü düzeltildi. Sayfa yenileniyor...',
        email: user.email
      };
    } else {
      console.log('ℹ️ Kullanıcı rolü zaten düzgün:', userData.rol);
      return { 
        success: true, 
        message: `Kullanıcı rolü zaten ${userData.rol}`,
        email: user.email,
        role: userData.rol
      };
    }
  } catch (error) {
    console.error('Hata:', error);
    return { 
      success: false, 
      message: 'Rol güncellenirken hata oluştu' 
    };
  }
};

// Global fonksiyon olarak ekle (Console'dan çalıştırmak için)
if (typeof window !== 'undefined') {
  (window as any).fixCurrentUserRole = fixCurrentUserRole;
}

export default fixCurrentUserRole;

