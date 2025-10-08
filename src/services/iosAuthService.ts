import { Preferences } from '@capacitor/preferences';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';

/**
 * iOS için basit otomatik giriş servisi
 * Firebase persistence yerine manuel yönetim
 */
export class IOSAuthService {
  private static readonly EMAIL_KEY = 'saved_email';
  private static readonly PASSWORD_KEY = 'saved_password';
  
  /**
   * Kullanıcı bilgilerini kaydet
   */
  static async saveCredentials(email: string, password: string): Promise<void> {
    try {
      await Preferences.set({ key: this.EMAIL_KEY, value: email });
      await Preferences.set({ key: this.PASSWORD_KEY, value: password });
      console.log('✅ iOS: Bilgiler kaydedildi');
    } catch (error) {
      console.error('❌ iOS: Bilgi kaydetme hatası:', error);
    }
  }
  
  /**
   * Kaydedilmiş bilgileri temizle
   */
  static async clearCredentials(): Promise<void> {
    try {
      await Preferences.remove({ key: this.EMAIL_KEY });
      await Preferences.remove({ key: this.PASSWORD_KEY });
      console.log('✅ iOS: Bilgiler temizlendi');
    } catch (error) {
      console.error('❌ iOS: Bilgi temizleme hatası:', error);
    }
  }
  
  /**
   * Otomatik giriş yap
   */
  static async tryAutoLogin(): Promise<boolean> {
    try {
      console.log('🔐 iOS: Otomatik giriş deneniyor...');
      
      const { value: email } = await Preferences.get({ key: this.EMAIL_KEY });
      const { value: password } = await Preferences.get({ key: this.PASSWORD_KEY });
      
      console.log('📧 Email:', email ? 'Mevcut' : 'Yok');
      console.log('🔑 Password:', password ? 'Mevcut' : 'Yok');
      
      if (!email || !password) {
        console.log('❌ Kaydedilmiş bilgi yok');
        return false;
      }
      
      // Firebase ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (userCredential.user) {
        console.log('✅ Otomatik giriş başarılı!');
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('❌ Otomatik giriş hatası:', error.code, error.message);
      
      // Eğer bilgiler geçersizse temizle
      if (error.code === 'auth/invalid-credential' || 
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password') {
        await this.clearCredentials();
      }
      
      return false;
    }
  }
  
  /**
   * Bilgilerin kaydedilip kaydedilmediğini kontrol et
   */
  static async hasCredentials(): Promise<boolean> {
    const { value: email } = await Preferences.get({ key: this.EMAIL_KEY });
    const { value: password } = await Preferences.get({ key: this.PASSWORD_KEY });
    return !!(email && password);
  }
}

