import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification as firebaseSendEmailVerification, getAuth } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../lib/firebase';
import type { User, UserRole } from '../types';

export interface EkipUyesi extends Omit<User, 'davetTarihi'> {
  sahalar?: string[]; // Atanmış saha ID'leri
  santraller?: string[]; // Atanmış santral ID'leri
  davetTarihi?: Timestamp | Date;
  davetEden?: string;
}

// Ekip üyesi oluştur
export const createEkipUyesi = async (
  ekipData: Omit<EkipUyesi, 'id' | 'olusturmaTarihi' | 'guncellenmeTarihi'>,
  password: string
): Promise<string> => {
  try {
    // Secondary app ile kullanıcı oluştur (yönetici session'ını koru)
    const secondaryApp = initializeApp(firebaseConfig, 'secondary');
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      ekipData.email,
      password
    );
    
    const userId = userCredential.user.uid;
    
    // Email doğrulama maili gönder
    await firebaseSendEmailVerification(userCredential.user);
    
    // Firestore'a kullanıcı bilgilerini kaydet
    const userDocRef = doc(db, 'kullanicilar', userId);
    await setDoc(userDocRef, {
      ...ekipData,
      id: userId,
      emailVerified: false,
      olusturmaTarihi: serverTimestamp(),
      guncellenmeTarihi: serverTimestamp(),
      davetTarihi: serverTimestamp(),
      // secondary kullanıldığı için davet eden bilgisi bilinmiyor; istenirse parametre olarak alınabilir
      davetEden: 'admin'
    });
    
    console.log('Ekip üyesi oluşturuldu:', userId);

    try {
      // Secondary app'i kapat
      await secondaryApp.delete();
    } catch (_e) {
      // ignore
    }
    return userId;
  } catch (error) {
    console.error('Ekip üyesi oluşturma hatası:', error);
    throw error;
  }
};

// Tüm ekip üyelerini getir (şirket bazlı)
export const getAllEkipUyeleri = async (companyId: string): Promise<EkipUyesi[]> => {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId)
    );
    
    const querySnapshot = await getDocs(q);
    const ekipUyeleri: EkipUyesi[] = [];
    
    querySnapshot.forEach((doc) => {
      ekipUyeleri.push({ id: doc.id, ...doc.data() } as EkipUyesi);
    });
    

    return ekipUyeleri;
  } catch (error) {
    console.error('Ekip üyeleri getirme hatası:', error);
    throw error;
  }
};

// Tek bir ekip üyesi getir
export const getEkipUyesi = async (userId: string): Promise<EkipUyesi | null> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() } as EkipUyesi;
    }
    
    return null;
  } catch (error) {
    console.error('Ekip üyesi getirme hatası:', error);
    throw error;
  }
};

// Kullanıcı davet et (email ile)
export const inviteUser = async (
  email: string,
  role: UserRole,
  companyId: string,
  companyName: string
): Promise<void> => {
  try {
    // Firestore'a davet kaydı ekle
    const invitationRef = doc(collection(db, 'invitations'));
    const invitationData = {
      id: invitationRef.id,
      email,
      role,
      companyId,
      companyName,
      status: 'pending',
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 gün
      invitationToken: generateInvitationToken()
    };
    
    await setDoc(invitationRef, invitationData);
    
    // Email gönderme işlemi - şimdilik konsola yazıyoruz
    console.log('Davet emaili gönderildi:', {
      email,
      role,
      companyId,
      companyName,
      invitationLink: `${window.location.origin}/register?token=${invitationData.invitationToken}`
    });
    
    // TODO: Gerçek email gönderimi için EmailJS veya Firebase Functions kullanılacak
    // await emailService.sendInvitation({
    //   email,
    //   role,
    //   companyName,
    //   invitationLink: `${window.location.origin}/register?token=${invitationData.invitationToken}`
    // });
    
  } catch (error) {
    console.error('Kullanıcı davet hatası:', error);
    throw error;
  }
};

// Davet token'ı oluştur
const generateInvitationToken = (): string => {
  return Array.from({ length: 32 }, () => 
    Math.random().toString(36).charAt(2)
  ).join('');
};

// Ekip üyesini güncelle
export const updateEkipUyesi = async (
  userId: string,
  updates: Partial<EkipUyesi>
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userDocRef, {
      ...updates,
      guncellenmeTarihi: serverTimestamp()
    });
    
    console.log('Ekip üyesi güncellendi:', userId);
  } catch (error) {
    console.error('Ekip üyesi güncelleme hatası:', error);
    throw error;
  }
};

// Email doğrulama gönder
export const sendVerificationEmail = async (userId: string): Promise<void> => {
  try {
    // Burada normalde email doğrulama linki gönderilir
    console.log('Email doğrulama gönderildi:', userId);
    
    // TODO: Firebase Auth veya başka bir servis ile email doğrulama
    // await auth.currentUser?.firebaseSendEmailVerification();
    
  } catch (error) {
    console.error('Email doğrulama gönderme hatası:', error);
    throw error;
  }
};

// Kullanıcı rolünü güncelle
export const updateUserRole = async (
  userId: string,
  newRole: UserRole
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userDocRef, {
      rol: newRole,
      guncellenmeTarihi: serverTimestamp()
    });
    
    console.log('Kullanıcı rolü güncellendi:', { userId, newRole });
  } catch (error) {
    console.error('Rol güncelleme hatası:', error);
    throw error;
  }
};

// Ekip üyesine saha ata
export const assignSahalarToUser = async (
  userId: string,
  sahaIds: string[]
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userDocRef, {
      sahalar: sahaIds,
      guncellenmeTarihi: serverTimestamp()
    });
    
    console.log(`${sahaIds.length} saha atandı:`, userId);
  } catch (error) {
    console.error('Saha atama hatası:', error);
    throw error;
  }
};

// Ekip üyesine santral ata
export const assignSantrallerToUser = async (
  userId: string,
  santralIds: string[]
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userDocRef, {
      santraller: santralIds,
      guncellenmeTarihi: serverTimestamp()
    });
    
    console.log(`${santralIds.length} santral atandı:`, userId);
  } catch (error) {
    console.error('Santral atama hatası:', error);
    throw error;
  }
};

// Kullanıcının atanmış sahalarını getir
export const getUserSahalar = async (userId: string): Promise<string[]> => {
  try {
    const user = await getEkipUyesi(userId);
    return user?.sahalar || [];
  } catch (error) {
    console.error('Kullanıcı sahaları getirme hatası:', error);
    return [];
  }
};

// Kullanıcının atanmış santrallerini getir
export const getUserSantraller = async (userId: string): Promise<string[]> => {
  try {
    const user = await getEkipUyesi(userId);
    return user?.santraller || [];
  } catch (error) {
    console.error('Kullanıcı santralleri getirme hatası:', error);
    return [];
  }
};

// Sahaya atanmış kullanıcıları getir
export const getUsersBySaha = async (sahaId: string): Promise<EkipUyesi[]> => {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('sahalar', 'array-contains', sahaId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: EkipUyesi[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as EkipUyesi);
    });
    
    return users;
  } catch (error) {
    console.error('Saha kullanıcıları getirme hatası:', error);
    return [];
  }
};

// Santrale atanmış kullanıcıları getir
export const getUsersBySantral = async (santralId: string): Promise<EkipUyesi[]> => {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('santraller', 'array-contains', santralId)
    );
    
    const querySnapshot = await getDocs(q);
    const users: EkipUyesi[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as EkipUyesi);
    });
    
    return users;
  } catch (error) {
    console.error('Santral kullanıcıları getirme hatası:', error);
    return [];
  }
};

// Ekip üyesini sil (hem Firestore'dan hem Firebase Auth'tan)
export const deleteEkipUyesi = async (userId: string): Promise<void> => {
  try {
    // Cloud Function ile hem Auth'tan hem Firestore'dan sil
    const deleteUserAccount = httpsCallable(functions, 'deleteUserAccount');
    const result = await deleteUserAccount({ userId });
    
    console.log('✅ Ekip üyesi başarıyla silindi (Auth + Firestore):', userId, result.data);
  } catch (error: any) {
    console.error('❌ Ekip üyesi silme hatası:', error);
    
    // Kullanıcı dostu hata mesajı
    if (error?.code === 'functions/not-found') {
      throw new Error('Silme fonksiyonu bulunamadı. Lütfen Functions deploy edildiğinden emin olun.');
    } else if (error?.code === 'functions/unauthenticated') {
      throw new Error('Bu işlem için giriş yapmalısınız.');
    } else {
      throw new Error(error?.message || 'Kullanıcı silinirken bir hata oluştu.');
    }
  }
};

// Rol bazlı ekip üyeleri getir
export const getEkipUyeleriByRole = async (
  companyId: string,
  role: UserRole
): Promise<EkipUyesi[]> => {
  try {
    const q = query(
      collection(db, 'kullanicilar'),
      where('companyId', '==', companyId),
      where('rol', '==', role)
    );
    
    const querySnapshot = await getDocs(q);
    const users: EkipUyesi[] = [];
    
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as EkipUyesi);
    });
    
    return users;
  } catch (error) {
    console.error('Rol bazlı kullanıcılar getirme hatası:', error);
    return [];
  }
};

// Email doğrulama durumunu güncelle
export const updateEmailVerificationStatus = async (
  userId: string,
  verified: boolean
): Promise<void> => {
  try {
    const userDocRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userDocRef, {
      emailVerified: verified,
      guncellenmeTarihi: serverTimestamp()
    });
    
    console.log('Email doğrulama durumu güncellendi:', userId);
  } catch (error) {
    console.error('Email doğrulama güncelleme hatası:', error);
    throw error;
  }
};

// Export all functions
export const ekipService = {
  createEkipUyesi,
  getAllEkipUyeleri,
  getEkipUyesi,
  updateEkipUyesi,
  deleteEkipUyesi,
  inviteUser,
  sendVerificationEmail,
  updateUserRole,
  assignSahalarToUser,
  assignSantrallerToUser,
  getUsersBySaha,
  getUsersBySantral,
  getEkipUyeleriByRole,
  updateEmailVerificationStatus
};
