/**
 * Test Phone Authentication Service
 * Firebase Phone Auth test implementasyonu
 */

import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import toast from 'react-hot-toast';

class TestPhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  /**
   * Test için basit SMS gönderimi
   */
  async testSendSMS(phoneNumber: string, containerId: string = 'recaptcha-test'): Promise<void> {
    try {
      console.log('📱 Test SMS gönderimi başlatılıyor...');
      console.log('Telefon:', phoneNumber);
      
      // Recaptcha'yı temizle ve yeniden oluştur
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }

      // Yeni RecaptchaVerifier oluştur - GÖRÜNÜR modda
      this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: (response: any) => {
          console.log('✅ Recaptcha doğrulandı:', response);
        },
        'expired-callback': () => {
          console.log('⏰ Recaptcha süresi doldu');
        }
      });

      // Render et
      await this.recaptchaVerifier.render();
      console.log('🎨 Recaptcha render edildi');

      // SMS gönder
      this.confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        this.recaptchaVerifier
      );

      console.log('✅ SMS başarıyla gönderildi!');
      toast.success('SMS gönderildi! Kodu girin.');

    } catch (error: any) {
      console.error('❌ Test SMS hatası:', error);
      console.error('Hata kodu:', error.code);
      console.error('Hata mesajı:', error.message);
      
      // Detaylı hata mesajları
      if (error.code === 'auth/invalid-app-credential') {
        toast.error('Firebase Phone Auth yapılandırması eksik! Console\'u kontrol edin.');
      } else if (error.code === 'auth/invalid-phone-number') {
        toast.error('Geçersiz telefon numarası formatı');
      } else if (error.code === 'auth/missing-client-type') {
        toast.error('Firebase projesi ayarları eksik');
      } else if (error.code === 'auth/too-many-requests') {
        toast.error('Çok fazla deneme! Biraz bekleyin.');
      } else {
        toast.error(`Hata: ${error.message}`);
      }
      
      throw error;
    }
  }

  /**
   * Doğrulama kodunu test et
   */
  async testVerifyCode(code: string): Promise<boolean> {
    try {
      if (!this.confirmationResult) {
        throw new Error('Önce SMS gönderilmeli');
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
      toast.error('Geçersiz kod!');
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
  }
}

export const testPhoneAuth = new TestPhoneAuthService();
