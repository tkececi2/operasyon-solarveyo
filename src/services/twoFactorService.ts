/**
 * Two-Factor Authentication (2FA) Service
 * Firebase Phone Authentication kullanarak 2FA implementasyonu
 */

import { 
  RecaptchaVerifier, 
  PhoneAuthProvider, 
  signInWithCredential,
  multiFactor,
  PhoneMultiFactorGenerator,
  User as FirebaseUser,
  ConfirmationResult,
  signInWithPhoneNumber,
  ApplicationVerifier
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Recaptcha container ID
const RECAPTCHA_CONTAINER_ID = 'recaptcha-container';

// 2FA durumu için interface
export interface TwoFactorStatus {
  isEnabled: boolean;
  phoneNumber?: string;
  lastVerified?: Date;
  backupCodes?: string[];
}

class TwoFactorService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Recaptcha doğrulayıcıyı başlat
   */
  initializeRecaptcha(containerId: string = RECAPTCHA_CONTAINER_ID): ApplicationVerifier {
    try {
      // Eğer zaten varsa, temizle
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
      }

      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal', // invisible yerine normal kullan - daha stabil
        callback: () => {
          console.log('Recaptcha doğrulandı');
        },
        'expired-callback': () => {
          console.log('Recaptcha süresi doldu');
          toast.error('Güvenlik doğrulaması süresi doldu. Lütfen tekrar deneyin.');
        }
      });

      return this.recaptchaVerifier;
    } catch (error) {
      console.error('Recaptcha başlatma hatası:', error);
      throw error;
    }
  }

  /**
   * Telefon numarasına doğrulama kodu gönder
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      console.log('📱 SMS gönderimi başlatılıyor...');
      console.log('Gelen numara:', phoneNumber);
      
      // Telefon numarasını doğrudan kullan (zaten formatlanmış geliyor)
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : this.formatPhoneNumber(phoneNumber);
      console.log('Formatlanmış numara:', formattedPhone);
      
      if (!this.recaptchaVerifier) {
        console.log('⚠️ RecaptchaVerifier yok, yeniden oluşturuluyor...');
        this.initializeRecaptcha();
      }

      // RecaptchaVerifier'ı render et
      try {
        await this.recaptchaVerifier!.render();
        console.log('✅ Recaptcha render edildi');
      } catch (renderError: any) {
        // Zaten render edilmişse hata verir, devam et
        console.log('ℹ️ Recaptcha zaten render edilmiş veya render hatası:', renderError.message);
      }

      // SMS gönder
      console.log('📤 SMS gönderiliyor...');
      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        this.recaptchaVerifier!
      );

      console.log('✅ SMS başarıyla gönderildi!');
      toast.success('Doğrulama kodu gönderildi!');
    } catch (error: any) {
      console.error('❌ SMS gönderme hatası:', error);
      console.error('Hata kodu:', error.code);
      console.error('Hata mesajı:', error.message);
      
      // Detaylı hata mesajları
      if (error.code === 'auth/invalid-app-credential') {
        throw new Error('Firebase Phone Auth yapılandırması eksik. Firebase Console\'da Phone Authentication\'ı etkinleştirin.');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Geçersiz telefon numarası formatı');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Çok fazla deneme. Lütfen biraz bekleyin.');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin.');
      } else {
        throw new Error(`SMS gönderilemedi: ${error.message}`);
      }
    }
  }

  /**
   * Doğrulama kodunu kontrol et
   */
  async verifyCode(code: string): Promise<boolean> {
    try {
      if (!this.confirmationResult) {
        throw new Error('Önce doğrulama kodu gönderilmelidir');
      }

      const result = await this.confirmationResult.confirm(code);
      
      if (result.user) {
        toast.success('Telefon numarası doğrulandı!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Kod doğrulama hatası:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Geçersiz doğrulama kodu');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Doğrulama kodu süresi dolmuş');
      } else {
        throw new Error('Doğrulama başarısız');
      }
    }
  }

  /**
   * Kullanıcı için 2FA'yı etkinleştir
   */
  async enable2FA(userId: string, phoneNumber: string): Promise<void> {
    try {
      // Telefon numarasını formatla
      const formattedPhone = this.formatPhoneNumber(phoneNumber);

      // Backup kodları oluştur
      const backupCodes = this.generateBackupCodes();

      // Firestore'da kullanıcı ayarlarını güncelle
      await updateDoc(doc(db, 'kullanicilar', userId), {
        twoFactorEnabled: true,
        twoFactorPhone: formattedPhone,
        twoFactorBackupCodes: backupCodes,
        twoFactorEnabledAt: new Date(),
        guncellenmeTarihi: new Date()
      });

      toast.success('2FA başarıyla etkinleştirildi!');
    } catch (error) {
      console.error('2FA etkinleştirme hatası:', error);
      throw new Error('2FA etkinleştirilemedi');
    }
  }

  /**
   * Kullanıcı için 2FA'yı devre dışı bırak
   */
  async disable2FA(userId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'kullanicilar', userId), {
        twoFactorEnabled: false,
        twoFactorPhone: null,
        twoFactorBackupCodes: null,
        twoFactorDisabledAt: new Date(),
        guncellenmeTarihi: new Date()
      });

      toast.success('2FA devre dışı bırakıldı');
    } catch (error) {
      console.error('2FA devre dışı bırakma hatası:', error);
      throw new Error('2FA devre dışı bırakılamadı');
    }
  }

  /**
   * Kullanıcının 2FA durumunu kontrol et
   */
  async check2FAStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
      
      if (!userDoc.exists()) {
        return { isEnabled: false };
      }

      const userData = userDoc.data();
      
      return {
        isEnabled: userData.twoFactorEnabled || false,
        phoneNumber: userData.twoFactorPhone,
        lastVerified: userData.twoFactorEnabledAt?.toDate(),
        backupCodes: userData.twoFactorBackupCodes
      };
    } catch (error) {
      console.error('2FA durumu kontrol hatası:', error);
      return { isEnabled: false };
    }
  }

  /**
   * Backup kodu ile doğrula
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, 'kullanicilar', userId));
      
      if (!userDoc.exists()) {
        return false;
      }

      const userData = userDoc.data();
      const backupCodes = userData.twoFactorBackupCodes || [];

      // Kodu kontrol et
      const codeIndex = backupCodes.indexOf(code);
      if (codeIndex === -1) {
        return false;
      }

      // Kullanılan kodu sil
      backupCodes.splice(codeIndex, 1);
      
      // Güncelle
      await updateDoc(doc(db, 'kullanicilar', userId), {
        twoFactorBackupCodes: backupCodes,
        lastBackupCodeUsed: new Date()
      });

      toast.success('Backup kodu doğrulandı');
      return true;
    } catch (error) {
      console.error('Backup kod doğrulama hatası:', error);
      return false;
    }
  }

  /**
   * Yeni backup kodları oluştur
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes();

      await updateDoc(doc(db, 'kullanicilar', userId), {
        twoFactorBackupCodes: backupCodes,
        backupCodesRegeneratedAt: new Date()
      });

      return backupCodes;
    } catch (error) {
      console.error('Backup kod yenileme hatası:', error);
      throw new Error('Backup kodları yenilenemedi');
    }
  }

  /**
   * Rol bazlı 2FA zorunluluğu kontrolü
   */
  async isRequired2FA(userRole: string): Promise<boolean> {
    // Yönetici ve superadmin için zorunlu
    return ['yonetici', 'superadmin'].includes(userRole);
  }

  /**
   * Telefon numarasını formatla
   */
  private formatPhoneNumber(phone: string): string {
    // Boşlukları ve özel karakterleri temizle
    let cleaned = phone.replace(/\D/g, '');
    
    // Eğer 0 ile başlıyorsa, kaldır
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Eğer 90 ile başlamıyorsa, ekle
    if (!cleaned.startsWith('90')) {
      cleaned = '90' + cleaned;
    }
    
    // + işareti ekle
    return '+' + cleaned;
  }

  /**
   * Rastgele backup kodları oluştur
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // 8 haneli rastgele kod
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Recaptcha'yı temizle
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
    this.confirmationResult = null;
  }
}

// Singleton instance
export const twoFactorService = new TwoFactorService();

// Helper fonksiyonlar
export const send2FACode = (phoneNumber: string) => twoFactorService.sendVerificationCode(phoneNumber);
export const verify2FACode = (code: string) => twoFactorService.verifyCode(code);
export const enable2FA = (userId: string, phoneNumber: string) => twoFactorService.enable2FA(userId, phoneNumber);
export const disable2FA = (userId: string) => twoFactorService.disable2FA(userId);
export const check2FAStatus = (userId: string) => twoFactorService.check2FAStatus(userId);
export const verifyBackupCode = (userId: string, code: string) => twoFactorService.verifyBackupCode(userId, code);
export const regenerateBackupCodes = (userId: string) => twoFactorService.regenerateBackupCodes(userId);
export const isRequired2FA = (userRole: string) => twoFactorService.isRequired2FA(userRole);
