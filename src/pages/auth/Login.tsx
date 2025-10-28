import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Home, CheckCircle, Sun, Shield, Zap, TrendingUp } from 'lucide-react';
import Logo from '../../components/ui/Logo';
import { useAuth } from '../../contexts/AuthContext';
import { platform } from '../../utils/platform';
import { IOSAuthService } from '../../services/iosAuthService';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui';
import toast from 'react-hot-toast';
import TwoFactorVerification from '../../components/auth/TwoFactorVerification';
import { twoFactorService } from '../../services/twoFactorService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { trackEvent } from '../../lib/posthog-events';

const loginSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, userProfile } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [registerMessage, setRegisterMessage] = useState<string | null>(null);

  // Register'dan gelen mesajı göster
  useEffect(() => {
    if (location.state?.message) {
      setRegisterMessage(location.state.message);
      // State'i temizle
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Login sonrası otomatik redirect
  useEffect(() => {
    if (userProfile && userProfile.id) {
      console.log('✅ UserProfile yüklendi - Dashboard\'a yönlendiriliyor...');
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);
  const [show2FA, setShow2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState<string>('');
  const [temp2FAPhone, setTemp2FAPhone] = useState<string>('');
  const [tempCredentials, setTempCredentials] = useState<LoginFormData | null>(null);

  // Eğer kullanıcı zaten girişliyse dashboard'a gönder
  React.useEffect(() => {
    try {
      const unsub = import('firebase/auth').then(m => {
        return m.onAuthStateChanged(m.getAuth(), (u) => {
          if (u) {
            // Navigate useEffect'te handle ediliyor
          }
        });
      });
      return () => {
        // unsubscribe promise döner, beklemeye gerek yok
      };
    } catch (_) { /* ignore */ }
  }, [navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    
    // Network timeout koruması (30 saniye)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TIMEOUT')), 30000);
    });
    
    try {
      // Önce kullanıcının 2FA durumunu kontrol et
      const userQuery = await getDoc(doc(db, 'kullanicilar', data.email));
      
      // Email ile kullanıcı bulunamazsa, normal login dene
      if (!userQuery.exists()) {
        await login(data.email, data.password);
        trackEvent.login('email'); // PostHog event
        // Navigate useEffect'te handle ediliyor
        return;
      }

      const userData = userQuery.data();
      
      // 2FA aktifse, önce doğrulama iste
      if (userData.twoFactorEnabled) {
        setTempUserId(userQuery.id);
        setTemp2FAPhone(userData.twoFactorPhone);
        setTempCredentials(data);
        setShow2FA(true);
      } else {
        // 2FA yoksa normal giriş (email ve admin kontrolü AuthContext'te yapılıyor)
        await login(data.email, data.password);
        
        // iOS için bilgileri kaydet
        if (platform.isNative()) {
          await IOSAuthService.saveCredentials(data.email, data.password);
          console.log('📱 iOS: Login bilgileri kaydedildi');
        }
        
        // Login başarılı - AuthContext handle edecek
        console.log('✅ Login başarılı - AuthContext otomatik redirect yapacak');
        trackEvent.login('email'); // PostHog event
      }
    } catch (error: any) {
      // Email ile bulunamazsa, auth ile dene
      try {
        await login(data.email, data.password);
        
        // iOS için bilgileri kaydet
        if (platform.isNative()) {
          await IOSAuthService.saveCredentials(data.email, data.password);
          console.log('📱 iOS: Login bilgileri kaydedildi');
        }
        
        // Giriş başarılı, şimdi 2FA kontrolü yap
        const { currentUser: user2FA } = await import('firebase/auth').then(m => ({ currentUser: m.getAuth().currentUser }));
        
        if (user2FA) {
          const status = await twoFactorService.check2FAStatus(user2FA.uid);
          
          if (status.isEnabled) {
            setTempUserId(user2FA.uid);
            setTemp2FAPhone(status.phoneNumber || '');
            setTempCredentials(data);
            setShow2FA(true);
            // Çıkış yap, 2FA sonrası tekrar giriş yapılacak
            await import('firebase/auth').then(m => m.signOut(m.getAuth()));
          } else {
            // Navigate useEffect'te handle ediliyor
            trackEvent.login('email'); // PostHog event
          }
        }
      } catch (loginError: any) {
        // Login hatası detaylı göster
        console.error('Login error:', loginError);
        console.error('Login error code:', loginError?.code);
        console.error('Login error message:', loginError?.message);
        
        // Timeout hatası
        if (loginError?.message === 'TIMEOUT') {
          toast.error('Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
          return;
        }
        
        // Firebase hata kodlarına göre özel mesajlar
        if (loginError?.code === 'auth/invalid-email') {
          toast.error('Geçersiz email adresi');
        } else if (loginError?.code === 'auth/user-disabled') {
          toast.error('Bu hesap devre dışı bırakılmış');
        } else if (loginError?.code === 'auth/user-not-found') {
          toast.error('Kullanıcı bulunamadı');
        } else if (loginError?.code === 'auth/wrong-password' || loginError?.code === 'auth/invalid-credential') {
          toast.error('Email veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.');
        } else if (loginError?.code === 'auth/network-request-failed') {
          toast.error('İnternet bağlantısı hatası. Lütfen bağlantınızı kontrol edin.');
        } else if (loginError?.code === 'auth/too-many-requests') {
          toast.error('Çok fazla başarısız deneme. Lütfen birkaç dakika sonra tekrar deneyin.');
        } else if (loginError?.message === 'account-disabled') {
          toast.error('Hesabınız pasif durumda. Yöneticinizle iletişime geçin.');
        } else {
          // Genel hata - detaylı bilgi ver
          const errorMsg = loginError?.message || 'Bilinmeyen hata';
          const errorCode = loginError?.code || 'No error code';
          toast.error(`Giriş başarısız: ${errorMsg} (${errorCode})`);
          console.error('Detailed error:', JSON.stringify(loginError, null, 2));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerified = async () => {
    if (!tempCredentials) return;
    
    setIsLoading(true);
    try {
      // 2FA doğrulandı, şimdi normal giriş yap
      await login(tempCredentials.email, tempCredentials.password);
      // Navigate useEffect'te handle ediliyor
    } catch (error) {
      toast.error('Giriş başarısız');
    } finally {
      setIsLoading(false);
      setShow2FA(false);
    }
  };

  const handle2FACancel = () => {
    setShow2FA(false);
    setTempUserId('');
    setTemp2FAPhone('');
    setTempCredentials(null);
  };

  // 2FA ekranını göster
  if (show2FA) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <TwoFactorVerification
          userId={tempUserId}
          phoneNumber={temp2FAPhone}
          onVerified={handle2FAVerified}
          onCancel={handle2FACancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-solar-50 flex">
      {/* Ana Sayfaya Dön Butonu - Sadece Web'de göster */}
      {!platform.isNative() && (
        <Link 
          to="/" 
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors z-10"
        >
          <Home className="w-5 h-5" />
          <span className="text-sm font-medium">Ana Sayfa</span>
        </Link>
      )}

      {/* SOL TARAF - Bilgi ve Özellikler */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 p-12 flex-col justify-center text-white relative overflow-hidden">
        {/* Dekoratif Arka Plan */}
        <div className="absolute inset-0 opacity-10">
          <Sun className="absolute top-20 right-20 w-64 h-64 text-yellow-300" />
          <Sun className="absolute bottom-20 left-20 w-48 h-48 text-yellow-300" />
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <Logo variant="white" size="large" />
          </div>

          <h1 className="text-4xl font-bold mb-6">
            Hoş Geldiniz! 👋<br />
            Santrallerinizi Yönetin
          </h1>
          
          <p className="text-xl text-blue-100 mb-12">
            Güçlü yönetim paneline giriş yapın ve tüm operasyonlarınızı tek platformdan kontrol edin.
          </p>

          {/* Özellikler */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Gerçek Zamanlı İzleme</h3>
                <p className="text-blue-100">Santrallerinizin anlık performansını takip edin</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Güvenli Platform</h3>
                <p className="text-blue-100">Verileriniz 256-bit şifreleme ile korunur</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Hızlı ve Kolay</h3>
                <p className="text-blue-100">Sezgisel arayüz ile dakikalar içinde işlem yapın</p>
              </div>
            </div>
          </div>

          {/* Sosyal Kanıt */}
          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-sm text-blue-100 mb-4">Güvenen şirketler:</p>
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold">500+</div>
                <div className="text-blue-100 text-sm">Aktif Santral</div>
              </div>
              <div>
                <div className="text-3xl font-bold">50+</div>
                <div className="text-blue-100 text-sm">Şirket</div>
              </div>
              <div>
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-blue-100 text-sm">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SAĞ TARAF - Giriş Formu */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobil Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex flex-col items-center justify-center">
              <Logo showSubtitle={true} />
            </div>
            <p className="text-gray-600 mt-3">Solar Enerji Santralı Yönetim Sistemi</p>
          </div>

          {/* Register Başarı Mesajı */}
          {registerMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-800">{registerMessage}</p>
              </div>
              <button
                onClick={() => setRegisterMessage(null)}
                className="text-green-600 hover:text-green-800"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Giriş Formu */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl">Giriş Yap</CardTitle>
              <CardDescription>
                Hesabınıza giriş yaparak devam edin
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Adresi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      id="email"
                      autoComplete="email"
                      className={`
                        block w-full pl-10 pr-3 py-2.5 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        ${errors.email ? 'border-red-500' : 'border-gray-300'}
                      `}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Şifre */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Şifre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      className={`
                        block w-full pl-10 pr-10 py-2.5 border rounded-lg
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        ${errors.password ? 'border-red-500' : 'border-gray-300'}
                      `}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Şifremi Unuttum */}
                <div className="flex items-center justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Şifremi Unuttum
                  </Link>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  size="lg"
                >
                  Giriş Yap
                </Button>

                <div className="text-center text-sm">
                  <span className="text-gray-600">Hesabınız yok mu? </span>
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:text-primary-500"
                  >
                    Ücretsiz Kayıt Olun
                  </Link>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Güvenlik Badge'leri - Mobil */}
          <div className="lg:hidden mt-6 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4" />
              <span>SSL Güvenli</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              <span>ISO 27001</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
