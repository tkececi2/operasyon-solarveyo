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
// Bildirim sistemi kaldırıldı - baştan yapılacak
import { platform } from '../utils/platform';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { SplashScreen } from '@capacitor/splash-screen';

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
  
  // DEBUG: Component mount edildiğinde
  console.log('🔥 AuthProvider component mount edildi');

  // Kullanıcı profili getir
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'kullanicilar', uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as User;

        setUserProfile(userData);
        
        // ESKİ DENEME SÜRESİ KONTROLÜ KALDIRILDI
        // Artık CompanyContext'te modern abonelik sistemi kullanılıyor
        // odemeDurumu alanı deprecated - kullanılmamalı
        
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Kullanıcı profili getirilemedi:', error);
      return null;
    }
  };

  // Auth state değişikliklerini dinle + iOS persistence
  useEffect(() => {
    console.log('🔥 AuthContext useEffect çalıştı!');
    let mounted = true;
    
    const initAuth = async () => {
      console.log('🚀 initAuth başladı, platform:', platform.getPlatformName(), 'isNative:', platform.isNative());
      
      // KRİTİK: Auto-login KALDIRILDI - Sadece logout flag kontrolü
      console.log('📱 iOS: Auto-login devre dışı - sadece logout flag kontrolü aktif');
      
      // Firebase auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (!mounted) return;
        
        console.log('🔄 Auth state changed:', { userId: user?.uid, email: user?.email });
        
        // KRİTİK: iOS için logout flag kontrolü - Force logout
        if (platform.isNative() && user) {
          const { value: logoutFlag } = await Preferences.get({ key: 'user_logged_out' });
          console.log('🔍 Logout flag kontrolü:', logoutFlag);
          if (logoutFlag === 'true') {
            console.log('⚠️ LOGOUT FLAG AKTİF - Kullanıcı force logout ediliyor!');
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            setLoading(false);
            return;
          }
        }
        
        if (user) {
          setCurrentUser(user);
          const profile = await fetchUserProfile(user.uid);
          
          // Kullanıcı pasif ise otomatik çıkış yap
          if (profile && profile.aktif === false) {
            await signOut(auth);
            setCurrentUser(null);
            setUserProfile(null);
            
            // iOS için: Kaydedilmiş bilgileri sil
            if (platform.isNative()) {
              await Preferences.remove({ key: 'user_email' });
              await Preferences.remove({ key: 'user_password' });
            }
            
            toast.error('⛔ Hesabınız devre dışı bırakılmıştır.');
          } else if (platform.isNative() && profile) {
            // Push notification sistemi kaldırıldı - yeniden yapılacak
            console.log('ℹ️ Push notification sistemi aktif değil - yeniden yapılacak');
          }
        } else {
          // Kullanıcı yok
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false); // KRİTİK: Loading'i kapat - Login sayfası göster!
          
          console.log('🚪 Kullanıcı yok - Login sayfası gösterilecek');
          
          // Splash Screen'i kapat
          setTimeout(() => {
            SplashScreen.hide();
            console.log('📱 Splash Screen kapatıldı');
          }, 100);
        }
        
        // Loading state yönetimi
        if (!platform.isNative()) {
          setLoading(false);
        } else if (user) {
          // iOS'ta kullanıcı varsa hemen loading'i kapat
          setLoading(false);
          // Splash Screen'i kapat
          SplashScreen.hide();
          console.log('📱 iOS: Kullanıcı mevcut, Splash Screen kapatıldı');
        } else {
          // iOS'ta user yoksa loading attemptAutoLogin tarafından kapatılacak
          // Ama Splash Screen'i yine de kapat
          setTimeout(() => {
            SplashScreen.hide();
            console.log('📱 iOS: Kullanıcı yok, Splash Screen kapatıldı');
          }, 500);
        }
      });

      return unsubscribe;
    };
    
    // Hemen başlat
    initAuth();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Giriş yap
  const login = async (email: string, password: string) => {
    try {
      // KRİTİK: Logout flag'ini GİRİŞ YAPMADAN ÖNCE temizle!
      if (platform.isNative()) {
        await Preferences.remove({ key: 'user_logged_out' });
        console.log('✅ Login başlamadan önce logout flag temizlendi');
      }
      
      // Gerçek Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ✅ EMAIL DOĞRULAMA KONTROLÜ - AKTİF
      // En güncel durumu al
      await user.reload();
      
      if (!user.emailVerified) {
        await signOut(auth);
        // Email doğrulama linki tekrar gönder
        try {
          await sendEmailVerification(user);
          throw new Error('Email adresinizi doğrulamanız gerekiyor. Yeni bir doğrulama linki gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        } catch (emailError) {
          throw new Error('Email adresinizi doğrulamanız gerekiyor. Lütfen email kutunuzdaki doğrulama linkine tıklayın.');
        }
      }

      // Kullanıcı profili getir veya oluştur
      let userProfile = await fetchUserProfile(user.uid);
      
      // Kullanıcı pasif ise giriş yapmasına izin verme
      if (userProfile && userProfile.aktif === false) {
        await signOut(auth); // Otomatik çıkış yap
        throw new Error('account-disabled');
      }
      
      // ✅ ADMIN ONAY KONTROLÜ
      if (userProfile && userProfile.adminApproved === false) {
        await signOut(auth);
        throw new Error('Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen yöneticinizle iletişime geçin.');
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
        
        // NOT: Logout flag login başında temizlenmiş olmalı
        
        // Push notification sistemini başlat (iOS ve Web için)
        console.log('🔔 Push notification sistemi başlatılıyor...');
        try {
          const { pushNotificationService } = await import('../services/pushNotificationService');
          await pushNotificationService.onUserLogin(user.uid, userProfile);
          console.log('✅ Push notification sistemi başlatıldı');
        } catch (pushError) {
          console.error('❌ Push notification başlatma hatası:', pushError);
        }
      }
      
      if (!userProfile) {
        // Eğer kullanıcı profili yoksa, otomatik oluştur
        const now = Timestamp.now();
        // Başlangıç paketi için 30 günlük süre
        const starterDays = 30;
        const starterEnd = Timestamp.fromDate(new Date(Date.now() + starterDays * 24 * 60 * 60 * 1000));

        // Şirketi oluştur (yoksa)
        const companyId = `company_${user.uid}`;
        const companyRef = doc(db, 'companies', companyId);
        const companyDoc = await getDoc(companyRef);
        if (!companyDoc.exists()) {
          const companyData = {
            id: companyId,
            name: `${email.split('@')[0]} Şirketi`,
            subscriptionStatus: 'active' as const, // Başlangıç paketi aktif
            subscriptionPlan: 'starter' as const, // Başlangıç paketi
            subscriptionPrice: 0, // Ücretsiz başlangıç
            subscriptionStartDate: now,
            subscriptionEndDate: starterEnd,
            isActive: true,
            createdAt: now,
            createdBy: user.uid,
            subscriptionLimits: {
              users: 3,
              sahalar: 2,
              santraller: 3,
              storageGB: 1,
              storageLimit: 1024 // MB cinsinden
            },
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
          // odemeDurumu kaldırıldı - deprecated alan
          // Abonelik bilgileri company koleksiyonunda tutuluyor
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

      // iOS için: Login olduğunda credentials'ı kaydet
      if (platform.isNative()) {
        try {
          await Preferences.set({ key: 'user_email', value: email });
          await Preferences.set({ key: 'user_password', value: password });
          console.log('📱 iOS: Kullanıcı bilgileri kaydedildi:', { email });
          
          // Kaydedilen bilgileri kontrol et
          const { value: checkEmail } = await Preferences.get({ key: 'user_email' });
          const { value: checkPassword } = await Preferences.get({ key: 'user_password' });
          console.log('📱 iOS: Verification - saved data:', { 
            emailSaved: !!checkEmail,
            passwordSaved: !!checkPassword 
          });
        } catch (error) {
          console.error('iOS bilgi kaydetme hatası:', error);
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
        // Başlangıç paketi için 30 günlük süre
        const starterDays = 30;
        const starterEnd = Timestamp.fromDate(new Date(Date.now() + starterDays * 24 * 60 * 60 * 1000));
        const companyData = {
          id: `company_${user.uid}`,
          name: userData.companyName,
          subscriptionStatus: 'active' as const, // Başlangıç paketi aktif
          subscriptionPlan: 'starter' as const, // Başlangıç paketi
          subscriptionPrice: 0, // Ücretsiz başlangıç
          subscriptionStartDate: now,
          subscriptionEndDate: starterEnd,
          isActive: true,
          createdAt: now,
          createdBy: user.uid,
          subscriptionLimits: {
            users: 3,
            sahalar: 2,
            santraller: 3,
            storageGB: 1,
            storageLimit: 1024 // MB cinsinden
          },
          metrics: {
            storageUsedMB: 0,
            fileCount: 0,
            lastStorageCalculation: now,
            breakdown: {
              logos: 0,
              arizaPhotos: 0,
              bakimPhotos: 0,
              vardiyaPhotos: 0,
              documents: 0,
              other: 0
            }
          },
          settings: {
            theme: 'light',
            language: 'tr',
          }
        };
        
        await setDoc(companyRef, companyData);
        companyId = `company_${user.uid}`;
      }

      // Kullanıcı profilini oluştur
      const newUserData: Partial<User> = {
        ...userData,
        id: user.uid,
        companyId,
        email: user.email!,
        emailVerified: false,
        // odemeDurumu kaldırıldı - deprecated alan
        // Abonelik bilgileri company koleksiyonunda tutuluyor
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
      
      // iOS için: Logout flag set et - Oturum kontrolü için
      if (platform.isNative()) {
        try {
          // KRİTİK: Logout flag'ini set et
          await Preferences.set({ key: 'user_logged_out', value: 'true' });
          console.log('📱 iOS: Logout flag set edildi');
          
          // Push notification cache temizle  
          await Preferences.remove({ key: 'fcm_token' });
          await Preferences.remove({ key: 'push_enabled' });
          
          console.log('✅ iOS: Logout işlemi tamamlandı');
        } catch (error) {
          console.error('iOS logout hatası:', error);
        }
      }
      
      // Push notification temizle - KRİTİK: userId göndererek Firestore'ı da temizle
      try {
        const { pushNotificationService } = await import('../services/pushNotificationService');
        await pushNotificationService.onUserLogout(currentUser.uid);
      } catch (pushError) {
        console.error('❌ Push notification temizleme hatası:', pushError);
      }
      
      // KRİTİK: Firebase Auth logout - force all sessions
      console.log('🚪 Firebase Auth logout yapılıyor...');
      await signOut(auth);
      console.log('✅ Firebase Auth logout tamamlandı');
      
      // Force clear authentication state
      setCurrentUser(null);
      setUserProfile(null);
      
      // iOS için ek güvenlik - auth state'i force reset
      if (platform.isNative()) {
        // AuthContext state'ini tamamen sıfırla
        setTimeout(() => {
          setLoading(false);
          console.log('✅ iOS: Loading state resetlendi');
        }, 100);
      }
      
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
