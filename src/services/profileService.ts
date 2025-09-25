import { 
  doc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  updatePassword, 
  EmailAuthProvider, 
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  updateEmail,
  sendEmailVerification,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, auth } from '@/lib/firebase';
import { User } from '@/types';

interface ProfileUpdateData {
  ad?: string;
  telefon?: string;
  fotoURL?: string;
}

interface PasswordUpdateData {
  currentPassword: string;
  newPassword: string;
}

interface EmailUpdateData {
  currentPassword: string;
  newEmail: string;
}

// Profil bilgilerini güncelle
export async function updateProfile(
  userId: string, 
  data: ProfileUpdateData
): Promise<void> {
  try {
    // userId'nin auth UID olduğunu varsayıyoruz
    const userRef = doc(db, 'kullanicilar', userId);
    
    await updateDoc(userRef, {
      ...data,
      guncellenmeTarihi: Timestamp.now()
    });
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    if (error instanceof Error && error.message.includes('permissions')) {
      throw new Error('Profil güncelleme yetkiniz yok');
    }
    throw new Error('Profil güncellenemedi');
  }
}

// Profil fotoğrafı yükle
export async function uploadProfilePhoto(
  userId: string, 
  file: File
): Promise<string> {
  try {
    // Dosya boyutu kontrolü (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Dosya boyutu 5MB\'dan büyük olamaz');
    }

    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)');
    }

    // Storage referansı
    const timestamp = Date.now();
    const fileName = `profile-photos/${userId}/${timestamp}_${file.name}`;
    const storageRef = ref(storage, fileName);

    // Dosyayı yükle
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Veritabanını güncelle (auth UID ile)
    const userRef = doc(db, 'kullanicilar', userId);
    await updateDoc(userRef, {
      fotoURL: downloadURL,
      guncellenmeTarihi: Timestamp.now()
    });

    return downloadURL;
  } catch (error) {
    console.error('Profil fotoğrafı yükleme hatası:', error);
    throw error;
  }
}

// Profil fotoğrafını kaldır
export async function removeProfilePhoto(userId: string): Promise<void> {
  try {
    const userRef = doc(db, 'kullanicilar', userId);
    
    // Veritabanını güncelle
    await updateDoc(userRef, {
      fotoURL: null,
      guncellenmeTarihi: Timestamp.now()
    });
  } catch (error) {
    console.error('Profil fotoğrafı kaldırma hatası:', error);
    if (error instanceof Error && error.message.includes('permissions')) {
      throw new Error('Profil fotoğrafı kaldırma yetkiniz yok');
    }
    throw new Error('Profil fotoğrafı kaldırılamadı');
  }
}

// Şifre güncelle
export async function updateUserPassword(
  user: FirebaseUser,
  data: PasswordUpdateData
): Promise<void> {
  try {
    // Debug için kullanıcı bilgilerini logla
    console.log('Şifre güncelleme denemesi:', {
      userEmail: user.email,
      userUid: user.uid,
      emailVerified: user.emailVerified,
      lastSignInTime: user.metadata?.lastSignInTime
    });

    // Alternatif yöntem: Önce signIn ile doğrula, sonra şifre güncelle
    try {
      // Yöntem 1: reauthenticateWithCredential
      const credential = EmailAuthProvider.credential(
        user.email!,
        data.currentPassword
      );
      
      console.log('Reauthentication başlatılıyor...');
      await reauthenticateWithCredential(user, credential);
      console.log('Reauthentication başarılı!');
    } catch (authError: any) {
      console.log('Reauthentication başarısız, signIn deneniyor...', authError.code);
      
      // Yöntem 2: signInWithEmailAndPassword ile dene
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          user.email!,
          data.currentPassword
        );
        
        // SignIn başarılı, şimdi şifreyi güncelle
        console.log('SignIn başarılı, şifre güncelleniyor...');
        await updatePassword(userCredential.user, data.newPassword);
        
        // Kullanıcı belgesini güncelle
        const userRef = doc(db, 'kullanicilar', user.uid);
        await updateDoc(userRef, {
          guncellenmeTarihi: Timestamp.now()
        });
        return; // İşlem başarılı, fonksiyondan çık
      }
      
      throw authError; // Başka bir hata varsa tekrar fırlat
    }
    
    // Reauthentication başarılı ise şifreyi güncelle
    await updatePassword(user, data.newPassword);
    
    // Kullanıcı belgesini güncelle (auth UID kullanarak)
    const userRef = doc(db, 'kullanicilar', user.uid);
    await updateDoc(userRef, {
      guncellenmeTarihi: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Şifre güncelleme hatası - Detaylı:', {
      errorCode: error.code,
      errorMessage: error.message,
      errorDetails: error
    });
    
    // Firebase Auth hata kodlarını kontrol et
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Mevcut şifre yanlış');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Yeni şifre en az 6 karakter olmalıdır');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Bu işlem için yeniden oturum açmanız gerekmektedir');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Geçersiz email adresi');
    } else if (error.code === 'auth/user-mismatch') {
      throw new Error('Kullanıcı bilgileri uyuşmuyor');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Kullanıcı bulunamadı');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Çok fazla deneme yapıldı. Lütfen biraz bekleyin');
    }
    
    throw new Error('Şifre güncellenemedi');
  }
}

// Email güncelle
export async function updateUserEmail(
  user: FirebaseUser,
  data: EmailUpdateData
): Promise<void> {
  try {
    // Önce kullanıcıyı yeniden doğrula
    const credential = EmailAuthProvider.credential(
      user.email!,
      data.currentPassword
    );
    
    await reauthenticateWithCredential(user, credential);
    
    // Email'i güncelle
    await updateEmail(user, data.newEmail);
    
    // Email doğrulama gönder
    await sendEmailVerification(user);
    
    // Kullanıcı belgesini güncelle (auth UID kullanarak)
    const userRef = doc(db, 'kullanicilar', user.uid);
    await updateDoc(userRef, {
      email: data.newEmail,
      emailVerified: false,
      guncellenmeTarihi: Timestamp.now()
    });
  } catch (error: any) {
    console.error('Email güncelleme hatası:', error);
    
    // Firebase Auth hata kodlarını kontrol et
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Şifre yanlış');
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('Bu email adresi zaten kullanımda');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Geçersiz email adresi');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('Bu işlem için yeniden oturum açmanız gerekmektedir');
    } else if (error.code === 'auth/user-mismatch') {
      throw new Error('Kullanıcı bilgileri uyuşmuyor');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('Kullanıcı bulunamadı');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Çok fazla deneme yapıldı. Lütfen biraz bekleyin');
    }
    
    throw new Error('Email güncellenemedi');
  }
}

// Kullanıcı bilgilerini getir
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    // İki yöntem deneyelim: önce direkt document ID, sonra query
    
    // Yöntem 1: Direkt document ID ile dene
    const userDocRef = doc(db, 'kullanicilar', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return {
        id: userDocSnap.id,
        ...userDocSnap.data()
      } as User;
    }
    
    // Yöntem 2: Query ile dene (fallback)
    const usersRef = collection(db, 'kullanicilar');
    const q = query(usersRef, where('id', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error);
    // Hata mesajını daha anlamlı yapalım
    if (error instanceof Error && error.message.includes('permissions')) {
      throw new Error('Kullanıcı profili için yetkiniz yok');
    }
    throw new Error('Kullanıcı profili getirilemedi');
  }
}

// Storage kullanım istatistiklerini getir
export async function getStorageStats(userId: string): Promise<{
  totalSize: number;
  fileCount: number;
  breakdown: {
    profilePhoto: number;
    documents: number;
  };
}> {
  try {
    // Bu fonksiyon genişletilebilir
    // Şimdilik basit bir yapı
    return {
      totalSize: 0,
      fileCount: 0,
      breakdown: {
        profilePhoto: 0,
        documents: 0
      }
    };
  } catch (error) {
    console.error('Storage istatistikleri getirme hatası:', error);
    throw new Error('Storage istatistikleri getirilemedi');
  }
}
