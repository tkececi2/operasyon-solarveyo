/**
 * Production Phone Authentication Service
 * Gerçek SMS gönderimi için Phone Auth implementasyonu
 */

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  ApplicationVerifier
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';

// Production için reCAPTCHA site key (Firebase Console'dan alın)
const RECAPTCHA_SITE_KEY = '6LfD4wgqAAAAAP7FvKPNgFMLIwNLKpLwOPQUwHqI'; // Firebase'den alın

class ProductionPhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Production reCAPTCHA başlat
   */
  initializeRecaptcha(containerId: string = 'recaptcha-container'): ApplicationVerifier {
    try {
      // Önceki instance'ı temizle
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      // Production için görünür reCAPTCHA
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: (response: any) => {
          console.log('✅ reCAPTCHA doğrulandı');
        },
        'expired-callback': () => {
          console.log('⏰ reCAPTCHA süresi doldu');
          toast.error('Güvenlik doğrulaması süresi doldu. Lütfen tekrar deneyin.');
        }
      });

      return this.recaptchaVerifier;
    } catch (error) {
      console.error('reCAPTCHA başlatma hatası:', error);
      throw error;
    }
  }

  /**
   * Production SMS gönder
   */
  async sendVerificationCode(phoneNumber: string): Promise<void> {
    try {
      console.log('📱 Production SMS gönderimi başlatılıyor...');
      console.log('Telefon:', phoneNumber);
      
      // Telefon formatını kontrol et
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      console.log('Formatlanmış:', formattedPhone);
      
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }

      // reCAPTCHA'yı render et
      try {
        await this.recaptchaVerifier!.render();
        console.log('✅ reCAPTCHA render edildi');
      } catch (renderError: any) {
        if (renderError.message?.includes('already rendered')) {
          console.log('ℹ️ reCAPTCHA zaten render edilmiş');
        } else {
          throw renderError;
        }
      }

      // Gerçek SMS gönder
      console.log('📤 SMS gönderiliyor...');
      this.confirmationResult = await signInWithPhoneNumber(
        auth, 
        formattedPhone, 
        this.recaptchaVerifier!
      );

      console.log('✅ SMS başarıyla gönderildi!');
      toast.success('Doğrulama kodu SMS ile gönderildi!');
      
    } catch (error: any) {
      console.error('❌ SMS gönderme hatası:', error);
      
      // Detaylı hata mesajları
      if (error.code === 'auth/invalid-app-credential') {
        throw new Error('Firebase Phone Auth yapılandırması eksik');
      } else if (error.code === 'auth/invalid-phone-number') {
        throw new Error('Geçersiz telefon numarası');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Çok fazla deneme. Lütfen biraz bekleyin.');
      } else if (error.code === 'auth/quota-exceeded') {
        throw new Error('SMS kotası doldu');
      } else if (error.code === 'auth/captcha-check-failed') {
        throw new Error('reCAPTCHA doğrulaması başarısız');
      } else {
        throw new Error(`SMS gönderilemedi: ${error.message}`);
      }
    }
  }

  /**
   * SMS kodunu doğrula
   */
  async verifyCode(code: string): Promise<boolean> {
    try {
      if (!this.confirmationResult) {
        throw new Error('Önce SMS gönderilmelidir');
      }

      const result = await this.confirmationResult.confirm(code);
      
      if (result.user) {
        console.log('✅ Kod doğrulandı! User:', result.user.uid);
        toast.success('Doğrulama başarılı!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Kod doğrulama hatası:', error);
      
      if (error.code === 'auth/invalid-verification-code') {
        throw new Error('Geçersiz doğrulama kodu');
      } else if (error.code === 'auth/code-expired') {
        throw new Error('Doğrulama kodunun süresi dolmuş');
      } else {
        throw new Error('Doğrulama başarısız');
      }
    }
  }

  /**
   * Kullanıcı için 2FA etkinleştir
   */
  async enable2FA(userId: string, phoneNumber: string): Promise<void> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const backupCodes = this.generateBackupCodes();

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
   * Telefon numarasını formatla
   */
  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('90')) {
      cleaned = '90' + cleaned;
    }
    
    return '+' + cleaned;
  }

  /**
   * Backup kodları oluştur
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Temizlik
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
export const productionPhoneAuth = new ProductionPhoneAuthService();

// Production bilgileri
export const PRODUCTION_INFO = `
⚠️ PRODUCTION MODU - Gerçek SMS Gönderilecek!
────────────────────────────────────────────
• Firebase Blaze Plan gerekli (kullandığın kadar öde)
• Her SMS için ücret alınır (~$0.01 per SMS)
• reCAPTCHA doğrulaması zorunlu
• Authorized domains eklenmeli
• Rate limiting var (dakikada max 5 SMS)
`;
