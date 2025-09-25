import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { User, UserRole } from '../types';
import { hasPermissionSync, canPerformActionSync, canAccessPageSync, type Permission } from '../services/permissionService';
import toast from 'react-hot-toast';
import { logUserAction, logSecurityEvent } from '../services/auditLogService';
import { analyticsService } from '../services/analyticsService';
import { SAAS_CONFIG } from '../config/saas.config';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  checkPermission: (requiredRoles: UserRole[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
  canPerformAction: (action: string) => boolean;
  canAccessPage: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Kullanıcı profili getir
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'kullanicilar', uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;

        setUserProfile(userData);
        
        // Deneme süresi kontrolü
        if (userData.odemeDurumu === 'deneme' && userData.denemeSuresiBitis) {
          const now = Timestamp.now();
          if (userData.denemeSuresiBitis.seconds < now.seconds) {
            // Deneme süresi bitmiş
            await updateDoc(doc(db, 'kullanicilar', uid), {
              odemeDurumu: 'surebitti',
              guncellenmeTarihi: now
            });
            toast.error('Deneme süreniz sona ermiştir. Lütfen abonelik satın alın.');
          }
        }
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı profili getirilemedi:', error);
      return null;
    }
  };

  // Auth state değişikliklerini dinle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchUserProfile(user.uid);
        
        // Kullanıcı pasif ise otomatik çıkış yap
        if (profile && profile.aktif === false) {
          await signOut(auth);
          setCurrentUser(null);
          setUserProfile(null);
          toast.error('⛔ Hesabınız devre dışı bırakılmıştır.');
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Giriş yap
  const login = async (email: string, password: string) => {
    try {
      // Gerçek Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Email doğrulaması kontrolü (şimdilik devre dışı)
      // if (!user.emailVerified) {
      //   await signOut(auth);
      //   throw new Error('Lütfen email adresinizi doğrulayın.');
      // }

      // Kullanıcı profili getir veya oluştur
      let userProfile = await fetchUserProfile(user.uid);
      
      // Kullanıcı pasif ise giriş yapmasına izin verme
      if (userProfile && userProfile.aktif === false) {
        await signOut(auth); // Otomatik çıkış yap
        throw new Error('account-disabled');
      }
      
      // Son giriş tarihini güncelle
      if (userProfile) {
        await updateDoc(doc(db, 'kullanicilar', user.uid), {
          sonGiris: Timestamp.now(),
          guncellenmeTarihi: Timestamp.now()
        });
        
        // Local profile'ı da güncelle
        userProfile.sonGiris = Timestamp.now();
        setUserProfile(userProfile);
      }
      
      if (!userProfile) {
        // Eğer kullanıcı profili yoksa, otomatik oluştur
        const now = Timestamp.now();
        const trialDays = (SAAS_CONFIG.PLANS.trial as any)?.duration || 14;
        const trialEnd = Timestamp.fromDate(new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000));

        // Şirketi oluştur (yoksa)
        const companyId = `company_${user.uid}`;
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        if (!companyDoc.exists()) {
          const companyData = {
            id: companyId,
            name: `${email.split('@')[0]} Şirketi`,
            subscriptionStatus: 'trial' as const,
            subscriptionPlan: 'trial' as const,
            isActive: true,
            createdAt: now,
            createdBy: user.uid,
            trialEndDate: trialEnd,
            settings: {
              theme: 'light',
              language: 'tr',
            }
          };
          await setDoc(companyRef, companyData);
        }

        // Kullanıcı profilini oluştur
        const newUserProfile: User = {
          id: user.uid,
          companyId,
          email: user.email!,
          ad: user.displayName || email.split('@')[0],
          rol: 'yonetici', // İlk kullanıcı yönetici olur
          odemeDurumu: 'deneme',
          denemeSuresiBaslangic: now,
          denemeSuresiBitis: trialEnd,
          emailVerified: user.emailVerified,
          aktif: true, // Yeni kullanıcılar varsayılan olarak aktif
          olusturmaTarihi: now,
          guncellenmeTarihi: now,
        };

        // Firestore'a kaydet
        await setDoc(doc(db, 'kullanicilar', user.uid), newUserProfile);
        setUserProfile(newUserProfile);
      }

      // Audit log
      await logUserAction(
        {
          id: user.uid,
          email: user.email || '',
          name: userProfile?.ad || email,
          role: userProfile?.rol || 'musteri',
          companyId: userProfile?.companyId
        },
        'user.login',
        'authentication',
        user.uid,
        { method: 'email/password' },
        true
      );

      // Analytics - Kullanıcı girişi takibi
      if (userProfile?.companyId) {
        const companyDoc = await getDoc(doc(db, 'companies', userProfile.companyId));
        if (companyDoc.exists()) {
          analyticsService.identify(userProfile, companyDoc.data() as any);
          analyticsService.track('user_logged_in', {
            method: 'email_password',
            user_role: userProfile.rol,
            company_id: userProfile.companyId
          });
        }
      }

      toast.success('Başarıyla giriş yaptınız!');

    } catch (error: any) {
      console.error('Giriş hatası:', error);
      
      // Özel hata kontrollerimiz
      if (error.message === 'account-disabled') {
        toast.error('⛔ Hesabınız devre dışı bırakılmıştır. Lütfen yönetici ile iletişime geçin.');
      } 
      // Firebase hata kodları
      else if (error.code === 'auth/user-not-found') {
        toast.error('Kullanıcı bulunamadı.');
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Hatalı şifre.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Geçersiz email adresi.');
      } else if (error.code === 'auth/invalid-credential') {
        toast.error('Geçersiz giriş bilgileri.');
      } else if (error.message === 'Lütfen email adresinizi doğrulayın.') {
        toast.error(error.message);
      } else {
        toast.error('Giriş yapılamadı: ' + (error.message || 'Bilinmeyen hata'));
      }
      throw error;
    }
  };

  // Kayıt ol
  const register = async (email: string, password: string, userData: Partial<User> & { companyName?: string }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Email doğrulama gönder
      await sendEmailVerification(user);

      const now = Timestamp.now();

      // Önce şirket oluştur (eğer companyName varsa)
      let companyId = userData.companyId || '';
      
      if (userData.companyName && !companyId) {
        const companyRef = doc(db, 'companies', `company_${user.uid}`);
        const trialDays = (SAAS_CONFIG.PLANS.trial as any)?.duration || 14;
        const trialEnd = Timestamp.fromDate(new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000));
        const companyData = {
          id: `company_${user.uid}`,
          name: userData.companyName,
          subscriptionStatus: 'trial' as const,
          subscriptionPlan: 'trial' as const,
          isActive: true,
          createdAt: now,
          createdBy: user.uid,
          trialEndDate: trialEnd,
          settings: {
            theme: 'light',
            language: 'tr',
          }
        };
        
        await setDoc(companyRef, companyData);
        companyId = `company_${user.uid}`;
      }

      // Kullanıcı profilini oluştur
      const trialDays = (SAAS_CONFIG.PLANS.trial as any)?.duration || 14;
      const denemeSuresiBaslangic = now;
      const denemeSuresiBitis = Timestamp.fromDate(
        new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
      );

      const newUserData: Partial<User> = {
        ...userData,
        id: user.uid,
        companyId,
        email: user.email!,
        emailVerified: false,
        odemeDurumu: 'deneme',
        denemeSuresiBaslangic,
        denemeSuresiBitis,
        olusturmaTarihi: now,
        guncellenmeTarihi: now,
      };

      // companyName'i userData'dan çıkar
      delete (newUserData as any).companyName;

      await setDoc(doc(db, 'kullanicilar', user.uid), newUserData);
      
      toast.success('Kayıt başarılı! Lütfen email adresinizi doğrulayın.');
      
      // Otomatik çıkış yap (email doğrulaması için)
      await signOut(auth);
    } catch (error: any) {
      console.error('Kayıt hatası:', error);
      
      // Eğer Firestore'a yazma başarısız olduysa, oluşturulan kullanıcıyı sil
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.delete();
          console.log('Hatalı kayıt temizlendi');
        }
      } catch (deleteError) {
        console.error('Kullanıcı silinirken hata:', deleteError);
      }
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Bu email adresi zaten kullanımda.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Şifre en az 6 karakter olmalıdır.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Geçersiz email adresi.');
      } else {
        toast.error(error.message || 'Kayıt yapılamadı.');
      }
      throw error;
    }
  };

  // Çıkış yap
  const logout = async () => {
    try {
      // Audit log - çıkış öncesi kullanıcı bilgilerini al
      if (currentUser && userProfile) {
        await logUserAction(
          {
            id: currentUser.uid,
            email: currentUser.email || '',
            name: userProfile.ad || '',
            role: userProfile.rol,
            companyId: userProfile.companyId
          },
          'user.logout',
          'authentication',
          currentUser.uid,
          {},
          true
        );
        
        // Analytics - Çıkış takibi
        analyticsService.logout();
      }
      
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Başarıyla çıkış yaptınız.');
    } catch (error) {
      console.error('Çıkış hatası:', error);
      toast.error('Çıkış yapılamadı.');
      throw error;
    }
  };

  // Şifre sıfırlama
  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Şifre sıfırlama emaili gönderildi.');
    } catch (error: any) {
      console.error('Şifre sıfırlama hatası:', error);
      if (error.code === 'auth/user-not-found') {
        toast.error('Bu email adresiyle kayıtlı kullanıcı bulunamadı.');
      } else {
        toast.error('Şifre sıfırlama emaili gönderilemedi.');
      }
      throw error;
    }
  };

  // Profil güncelle
  const updateProfile = async (data: Partial<User>) => {
    if (!currentUser || !userProfile) return;

    try {
      const updateData = {
        ...data,
        guncellenmeTarihi: Timestamp.now(),
      };

      await updateDoc(doc(db, 'kullanicilar', currentUser.uid), updateData);
      setUserProfile({ ...userProfile, ...updateData });
      toast.success('Profil güncellendi.');
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      toast.error('Profil güncellenemedi.');
      throw error;
    }
  };

  // Eski yetki kontrolü (geriye dönük uyumluluk için)
  const checkPermission = (requiredRoles: UserRole[]): boolean => {
    if (!userProfile) return false;
    
    
    // Kullanıcının rolü gerekli roller arasında mı?
    return requiredRoles.includes(userProfile.rol);
  };

  // Yeni izin kontrol fonksiyonları
  const checkUserPermission = (permission: Permission): boolean => {
    if (!userProfile) return false;
    return hasPermissionSync(userProfile.rol, permission);
  };

  const checkUserAction = (action: string): boolean => {
    if (!userProfile) return false;
    return canPerformActionSync(userProfile.rol, action);
  };

  const checkPageAccess = (page: string): boolean => {
    if (!userProfile) return false;
    return canAccessPageSync(userProfile.rol, page);
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    checkPermission,
    hasPermission: checkUserPermission,
    canPerformAction: checkUserAction,
    canAccessPage: checkPageAccess,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
