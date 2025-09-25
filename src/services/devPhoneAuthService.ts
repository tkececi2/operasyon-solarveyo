/**
 * Development Phone Authentication Service
 * Test modunda çalışan Phone Auth implementasyonu
 * Firebase dokümantasyonuna göre: https://firebase.google.com/docs/auth/web/phone-auth?hl=tr
 */

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

class DevPhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Test modunu etkinleştir
   * Firebase dokümantasyonuna göre test için app verification kapatılabilir
   */
  enableTestMode(): void {
    try {
      // Test modunu etkinleştir - app verification'ı kapat
      (auth as any).settings.appVerificationDisabledForTesting = true;
      console.log('✅ Test modu etkinleştirildi');
      toast.success('Test modu aktif - Gerçek SMS gönderilmeyecek');
    } catch (error) {
      console.error('Test modu etkinleştirme hatası:', error);
    }
  }

  /**
   * Test için SMS gönder (Firebase test numaraları ile)
   */
  async sendTestSMS(phoneNumber: string, containerId: string = 'recaptcha-container'): Promise<void> {
    try {
      console.log('🧪 Test SMS gönderimi başlatılıyor...');
      
      // Test modunu etkinleştir
      this.enableTestMode();
      
      // Önceki recaptcha'yı temizle
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      // Test modunda fake reCAPTCHA oluştur
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible', // Test modunda invisible kullanabiliriz
        callback: (response: any) => {
          console.log('✅ Test reCAPTCHA doğrulandı');
        }
      });

      // Test modunda signInWithPhoneNumber otomatik olarak fake reCAPTCHA kullanır
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      console.log('✅ Test SMS gönderildi! (Simüle edildi)');
      toast.success('Test kodu: 123456 (Firebase test numarası kullanın)');

    } catch (error: any) {
      console.error('❌ Test SMS hatası:', error);
      
      if (error.code === 'auth/invalid-phone-number') {
        toast.error('Test numarası Firebase\'de tanımlı değil');
      } else {
        toast.error(`Hata: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Test kodunu doğrula
   */
  async verifyTestCode(code: string): Promise<boolean> {
    try {
      if (!this.confirmationResult) {
        throw new Error('Önce SMS gönderilmeli');
      }

      const result = await this.confirmationResult.confirm(code);
      
      if (result.user) {
        console.log('✅ Test kodu doğrulandı!');
        toast.success('Test doğrulaması başarılı!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Test kod doğrulama hatası:', error);
      toast.error('Geçersiz test kodu!');
      return false;
    }
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
    
    // Test modunu kapat
    try {
      (auth as any).settings.appVerificationDisabledForTesting = false;
    } catch (error) {
      // Ignore
    }
  }
}

export const devPhoneAuth = new DevPhoneAuthService();

// Test numaraları için yardımcı bilgi
export const TEST_PHONE_NUMBERS = {
  tr1: { phone: '+905551234567', code: '123456' },
  tr2: { phone: '+905559876543', code: '654321' },
  tr3: { phone: '+905555555555', code: '111111' }
};

export const getTestInfo = () => {
  return `
📱 Firebase Test Numaraları:
─────────────────────────
1. +905551234567 → 123456
2. +905559876543 → 654321  
3. +905555555555 → 111111

Bu numaraları Firebase Console'da ekleyin:
Authentication → Sign-in method → Phone → Test phone numbers
`;
};
